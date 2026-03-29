from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import supabase
from services.ai_pipeline import tailor_resume, score_application
from services.google_drive import create_resume_doc
from typing import Optional

router = APIRouter()

class TailorRequest(BaseModel):
    job_id: str
    user_id: str
    create_doc: bool = True

@router.post("/tailor")
async def tailor(req: TailorRequest):
    # Get job
    job_r = supabase.table("jobs").select("*").eq("id", req.job_id).single().execute()
    if not job_r.data:
        raise HTTPException(404, "Job not found")
    job = job_r.data

    # Get user profile
    profile_r = supabase.table("profiles").select("*").eq("id", req.user_id).single().execute()
    if not profile_r.data:
        raise HTTPException(404, "Profile not found")
    profile = profile_r.data

    if not profile.get("base_resume"):
        raise HTTPException(400, "Upload your base resume first")
    if not profile.get("llm_api_key"):
        raise HTTPException(400, "Add your LLM API key in settings")

    provider = profile["llm_provider"]
    api_key  = profile["llm_api_key"]

    # Tailor
    tailored_text, keywords = await tailor_resume(
        job_description=job.get("description", ""),
        base_resume=profile["base_resume"],
        provider=provider,
        api_key=api_key,
    )

    # Score
    score = await score_application(
        job_description=job.get("description", ""),
        resume=tailored_text,
        provider=provider,
        api_key=api_key,
    )

    # Create Google Doc
    doc_url: Optional[str] = None
    if req.create_doc and profile.get("google_tokens"):
        try:
            doc_url = create_resume_doc(
                title=f"Resume — {job['title']} at {job['company']}",
                content=tailored_text,
                tokens=profile["google_tokens"],
            )
        except Exception as e:
            print(f"[resume] Drive doc failed: {e}")

    # Save to user_jobs
    supabase.table("user_jobs").upsert({
        "user_id": req.user_id,
        "job_id":  req.job_id,
        "tailored_resume_text": tailored_text,
        "tailored_resume_url":  doc_url,
        "response_probability": score,
        "status": "saved",
    }, on_conflict="user_id,job_id").execute()

    return {
        "tailored_text":    tailored_text,
        "doc_url":          doc_url,
        "keywords_matched": keywords,
        "response_probability": score,
    }

@router.post("/upload")
async def upload_base_resume(payload: dict):
    """Accepts plain text resume and saves to profile."""
    user_id = payload.get("user_id")
    resume  = payload.get("resume_text")
    if not user_id or not resume:
        raise HTTPException(400, "user_id and resume_text required")
    supabase.table("profiles").update({"base_resume": resume}).eq("id", user_id).execute()
    return {"ok": True}
