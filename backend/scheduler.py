"""
APScheduler tasks that run automatically.
- Every 2 hours: signal scan
- Every 3 hours: job scrape
- Every day at 7am: email digest
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.signal_engine import run_signal_scan, normalize_companies
from services.signal_store import persist_signals
from services.scraper import scrape_all_for_user, scrape_jobs_for_company
from services.email_service import send_daily_digest
from database import supabase
import asyncio
from datetime import datetime, timezone, timedelta

scheduler = AsyncIOScheduler(timezone="UTC")

def start_scheduler():
    # Signal Scan: Every 2 hours (frequent radar updates)
    scheduler.add_job(
        signal_scan_task, "interval", hours=2, id="signal_scan",
        next_run_time=datetime.now(timezone.utc),
        misfire_grace_time=3600
    )
    
    # Job Hunt: Every 3 hours (continuously find new jobs)
    scheduler.add_job(
        continuous_job_hunt_task, "interval", hours=3, id="continuous_job_hunt",
        next_run_time=datetime.now(timezone.utc) + timedelta(minutes=5),  # slight stagger
        misfire_grace_time=3600
    )
    
    # Daily Digest: Once a day at 7 AM (don't spam email)
    scheduler.add_job(
        daily_digest_task, "cron", hour=7, minute=0, id="daily_digest",
        misfire_grace_time=3600
    )
    
    scheduler.start()
    print("[scheduler] started")

def shutdown_scheduler():
    scheduler.shutdown()

async def signal_scan_task():
    print("[scheduler] running frequent signal scan")
    resp = supabase.table("profiles").select("watchlist").execute()
    all_companies: set[str] = set()
    for row in resp.data:
        all_companies.update(normalize_companies(row.get("watchlist")))
    if not all_companies:
        return
    signals = await run_signal_scan(list(all_companies))
    stored = persist_signals(signals)
    print(f"[scheduler] stored {stored} signals")

async def continuous_job_hunt_task():
    print("[scheduler] running frequent job hunt")
    resp = supabase.table("profiles").select("id,target_roles,target_locations,watchlist").execute()

    for user in resp.data:
        jobs: list[dict] = []

        if user.get("target_roles") and user.get("target_locations"):
            jobs.extend(await scrape_all_for_user(user["target_roles"], user["target_locations"]))

        for company in normalize_companies(user.get("watchlist")):
            company_jobs = await scrape_jobs_for_company(company)
            jobs.extend(company_jobs)

        seen_urls: set[str] = set()
        unique_jobs: list[dict] = []
        for job in jobs:
            if job["url"] not in seen_urls:
                seen_urls.add(job["url"])
                unique_jobs.append(job)

        inserted = []
        for job in unique_jobs:
            try:
                r = supabase.table("jobs").upsert(job, on_conflict="url").execute()
                if r.data:
                    inserted.append(r.data[0])
            except Exception:
                pass

    print("[scheduler] frequent hunt complete")

async def daily_digest_task():
    print("[scheduler] running daily email digest")
    resp = supabase.table("profiles").select("id,email_digest").execute()
    
    for user in resp.data:
        if not user.get("email_digest"):
            continue
            
        try:
            # fetch top recent jobs roughly from the last 24h to email
            jobs_r = supabase.table("jobs").select("*").order("posted_at", desc=True).limit(5).execute()
            signals_r = supabase.table("signals").select("*").order("detected_at", desc=True).limit(5).execute()
            
            if jobs_r.data:
                profile_r = supabase.auth.admin.get_user_by_id(user["id"])
                if profile_r.user and profile_r.user.email:
                    email = profile_r.user.email
                    send_daily_digest(email, jobs_r.data, signals_r.data)
        except Exception as e:
            print(f"[scheduler] email failed for {user['id']}: {e}")

    print("[scheduler] daily digest complete")
