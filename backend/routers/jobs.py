from fastapi import APIRouter, Header, HTTPException
from database import supabase
from typing import Optional

router = APIRouter()

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
