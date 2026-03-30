from fastapi import APIRouter, Header, HTTPException, Query
from database import supabase
from typing import Optional
from pydantic import BaseModel
from services.scraper import scrape_all_for_user, scrape_jobs_for_company
from services.signal_engine import normalize_companies

router = APIRouter()

class ScanRequest(BaseModel):
    user_id: str

@router.post("/scan")
async def scan_jobs_for_user(req: ScanRequest):
    # Fetch user profile to get target roles & locations
    resp = supabase.table("profiles").select("target_roles,target_locations,watchlist").eq("id", req.user_id).single().execute()
    if not resp.data:
        raise HTTPException(404, "User profile not found")

    user = resp.data
    jobs = []

    # 1. Scrape by target roles and locations from LinkedIn
    roles = user.get("target_roles") or []
    locs = user.get("target_locations") or []
    if roles and locs:
        jobs.extend(await scrape_all_for_user(roles, locs))

    # 2. Scrape jobs specifically at watchlist companies
    watchlist = normalize_companies(user.get("watchlist") or [])
    for company in watchlist:
        jobs.extend(await scrape_jobs_for_company(company))

    # Deduplicate before inserting to avoid constraint errors
    seen_urls = set()
    unique_jobs = []
    for job in jobs:
        if job["url"] not in seen_urls:
            seen_urls.add(job["url"])
            unique_jobs.append(job)

    # Insert jobs into Supabase
    inserted = []
    for job in unique_jobs:
        try:
            r = supabase.table("jobs").upsert(job, on_conflict="url").execute()
            if r.data:
                inserted.append(r.data[0])
        except Exception as e:
            pass

    return {"jobs": unique_jobs, "inserted": len(inserted)}

@router.get("/")
async def list_jobs(
    limit: int = 20,
    offset: int = 0,
    company: Optional[str] = None,
    role: Optional[str] = None,
):
    query = supabase.table("jobs").select("*, signals(*)") \
        .order("posted_at", desc=True) \
        .range(offset, offset + limit - 1)
    if company:
        query = query.ilike("company", f"%{company}%")
    if role:
        query = query.ilike("title", f"%{role}%")
    result = query.execute()
    return {"jobs": result.data, "total": len(result.data)}

@router.get("/{job_id}")
async def get_job(job_id: str):
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Job not found")
    return result.data
