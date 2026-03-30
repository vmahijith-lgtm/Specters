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
    user_id: Optional[str] = None,
):
    query = supabase.table("jobs").select("*, signals(*)") \
        .order("posted_at", desc=True) \
        .limit(200)

    if company:
        query = query.ilike("company", f"%{company}%")
    if role:
        query = query.ilike("title", f"%{role}%")
    
    result = query.execute()
    jobs_list = result.data

    # If user_id is provided, prioritize target locations dynamically
    if user_id:
        profile_req = supabase.table("profiles").select("target_locations, target_roles").eq("id", user_id).single().execute()
        if profile_req.data:
            target_locations = [loc.lower().strip() for loc in (profile_req.data.get("target_locations") or [])]
            target_roles = [role.lower().strip() for role in (profile_req.data.get("target_roles") or [])]
            
            def get_sort_priority(job):
                job_loc = (job.get("location") or "").lower()
                job_title = (job.get("title") or "").lower()
                
                # Check location match
                loc_match = False
                for tloc in target_locations:
                    if tloc in job_loc:
                        loc_match = True
                        break
                
                # Check role match
                role_match = False
                for trole in target_roles:
                    if trole in job_title:
                        role_match = True
                        break
                        
                # Priority: 
                # 0 = Both Loc & Role match
                # 1 = Location match only
                # 2 = Role match only
                # 3 = Neither (fallback to default date order)
                if loc_match and role_match:
                    return 0
                elif loc_match:
                    return 1
                elif role_match:
                    return 2
                else:
                    return 3

            # Sort by priority (0 first), if priorities tie, it preserves original fetch order (posted_at desc)
            jobs_list.sort(key=get_sort_priority)

    # Manual pagination after sorting
    paginated_jobs = jobs_list[offset:offset + limit]

    return {"jobs": paginated_jobs, "total": len(jobs_list)}

@router.get("/{job_id}")
async def get_job(job_id: str):
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Job not found")
    return result.data
