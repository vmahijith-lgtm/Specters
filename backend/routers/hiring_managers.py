from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from services.hiring_manager_finder import discover_hiring_managers

router = APIRouter()


class DiscoverRequest(BaseModel):
    job_id: str
    user_id: str


@router.get("/")
async def get_hiring_managers(job_id: str):
    """Return all discovered hiring managers for a given job."""
    result = (
        supabase.table("hiring_managers")
        .select("*")
        .eq("job_id", job_id)
        .order("found_at", desc=True)
        .execute()
    )
    return {"managers": result.data or []}


@router.post("/discover")
async def discover_managers(req: DiscoverRequest):
    """Trigger hiring-manager discovery for a job, upsert results, and return them."""
    job_r = supabase.table("jobs").select("*").eq("id", req.job_id).single().execute()
    if not job_r.data:
        raise HTTPException(404, "Job not found")
    job = job_r.data

    profile_r = (
        supabase.table("profiles")
        .select("id")
        .eq("id", req.user_id)
        .single()
        .execute()
    )
    if not profile_r.data:
        raise HTTPException(404, "Profile not found")

    managers = await discover_hiring_managers(
        job_id=req.job_id,
        company=job["company"],
        job_title=job["title"],
    )
    return {"managers": managers}
