from fastapi import APIRouter
from database import supabase

router = APIRouter()

@router.get("/")
async def list_signals(limit: int = 20, min_score: int = 0):
    result = (
        supabase.table("signals")
        .select("*")
        .gte("signal_score", min_score)
        .order("signal_score", desc=True)
        .order("detected_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"signals": result.data}
