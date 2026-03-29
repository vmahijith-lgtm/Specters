from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from typing import Optional

router = APIRouter()

class StatusUpdate(BaseModel):
    user_id: str
    job_id: str
    status: str
    notes: Optional[str] = None
    next_follow_up: Optional[str] = None

@router.get("/{user_id}")
async def get_pipeline(user_id: str):
    result = (
        supabase.table("user_jobs")
        .select("*, jobs(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    # Group by status
    pipeline = {}
    for item in result.data:
        s = item["status"]
        pipeline.setdefault(s, []).append(item)
    return pipeline

@router.patch("/status")
async def update_status(req: StatusUpdate):
    valid = {"saved","applied","interviewing","offer","rejected","withdrawn"}
    if req.status not in valid:
        raise HTTPException(400, f"Invalid status. Choose from: {valid}")
    update = {"status": req.status}
    if req.notes:
        update["notes"] = req.notes
    if req.next_follow_up:
        update["next_follow_up"] = req.next_follow_up
    if req.status == "applied":
        update["applied_at"] = "now()"
    supabase.table("user_jobs") \
        .update(update) \
        .eq("user_id", req.user_id) \
        .eq("job_id", req.job_id) \
        .execute()
    return {"ok": True}
