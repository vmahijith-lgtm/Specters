"""
APScheduler tasks that run automatically.
- Every 4 hours: signal scan
- Every day at 7am: job scrape + email digest
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.signal_engine import run_signal_scan, normalize_companies
from services.signal_store import persist_signals
from services.scraper import scrape_all_for_user, scrape_jobs_for_company
from services.email_service import send_daily_digest
from database import supabase
import asyncio
from datetime import datetime, timezone

scheduler = AsyncIOScheduler(timezone="UTC")

def start_scheduler():
    scheduler.add_job(
        signal_scan_task, "interval", hours=4, id="signal_scan",
        next_run_time=datetime.now(timezone.utc),
    )
    scheduler.add_job(daily_job_hunt_task, "cron", hour=7, minute=0, id="daily_digest",
                      next_run_time=datetime.now(timezone.utc))
    scheduler.start()
    print("[scheduler] started")

def shutdown_scheduler():
    scheduler.shutdown()

async def signal_scan_task():
    print("[scheduler] running signal scan")
    # Collect all watchlist companies across all users
    resp = supabase.table("profiles").select("watchlist").execute()
    all_companies: set[str] = set()
    for row in resp.data:
        all_companies.update(normalize_companies(row.get("watchlist")))
    if not all_companies:
        return
    signals = await run_signal_scan(list(all_companies))
    stored = persist_signals(signals)
    print(f"[scheduler] stored {stored} signals")

async def daily_job_hunt_task():
    print("[scheduler] running daily job hunt")
    resp = supabase.table("profiles").select(
        "id,target_roles,target_locations,watchlist,llm_api_key,email_digest"
    ).execute()

    for user in resp.data:
        jobs: list[dict] = []

        # 1. Scrape by target roles × locations
        if user.get("target_roles") and user.get("target_locations"):
            jobs.extend(await scrape_all_for_user(user["target_roles"], user["target_locations"]))

        # 2. Scrape open roles specifically at each watchlist company
        for company in normalize_companies(user.get("watchlist")):
            company_jobs = await scrape_jobs_for_company(company)
            jobs.extend(company_jobs)

        # 3. Deduplicate by URL
        seen_urls: set[str] = set()
        unique_jobs: list[dict] = []
        for job in jobs:
            if job["url"] not in seen_urls:
                seen_urls.add(job["url"])
                unique_jobs.append(job)

        # Upsert jobs (deduplicate on URL)
        inserted = []
        for job in unique_jobs:
            try:
                r = supabase.table("jobs").upsert(job, on_conflict="url").execute()
                if r.data:
                    inserted.append(r.data[0])
            except Exception:
                pass

        # Send email digest
        if user.get("email_digest") and inserted:
            try:
                profile_r = supabase.auth.admin.get_user_by_id(user["id"])
                email = profile_r.user.email
                signals_r = supabase.table("signals") \
                    .select("*").order("signal_score", desc=True).limit(5).execute()
                send_daily_digest(email, inserted[:5], signals_r.data)
            except Exception as e:
                print(f"[scheduler] email failed for {user['id']}: {e}")

    print("[scheduler] daily hunt complete")
