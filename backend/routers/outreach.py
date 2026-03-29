from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from services.ai_pipeline import draft_outreach

router = APIRouter()

class OutreachRequest(BaseModel):
    job_id: str
    user_id: str
    manager_name: str = "there"
    key_achievement: str = ""

@router.post("/draft")
async def generate_outreach(req: OutreachRequest):
    job_r = supabase.table("jobs").select("*").eq("id", req.job_id).single().execute()
    if not job_r.data:
        raise HTTPException(404, "Job not found")
    job = job_r.data

    profile_r = supabase.table("profiles").select("*").eq("id", req.user_id).single().execute()
    if not profile_r.data:
        raise HTTPException(404, "Profile not found")
    profile = profile_r.data

    if not profile.get("llm_api_key"):
        raise HTTPException(400, "Add your LLM API key first")

    achievement = req.key_achievement or (profile.get("base_resume", "")[:200] if profile.get("base_resume") else "")

    draft = await draft_outreach(
        job_title=job["title"],
        company=job["company"],
        manager_name=req.manager_name,
        key_achievement=achievement,
        provider=profile["llm_provider"],
        api_key=profile["llm_api_key"],
    )

    # Save to user_jobs
    supabase.table("user_jobs").upsert({
        "user_id": req.user_id,
        "job_id":  req.job_id,
        "outreach_draft": draft,
    }, on_conflict="user_id,job_id").execute()

    return {"draft": draft}
