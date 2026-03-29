from fastapi import APIRouter, Query
from database import supabase
from services.signal_engine import run_signal_scan
from typing import Optional, List

router = APIRouter()

@router.get("/")
async def list_signals(
    limit: int = 20,
    min_score: int = 0,
    companies: Optional[str] = Query(None, description="Comma-separated company names to filter by"),
):
    query = (
        supabase.table("signals")
        .select("*")
        .gte("signal_score", min_score)
        .order("signal_score", desc=True)
        .order("detected_at", desc=True)
        .limit(limit)
    )
    if companies:
        company_list = [c.strip() for c in companies.split(",") if c.strip()]
        if company_list:
            query = query.in_("company", company_list)
    result = query.execute()
    return {"signals": result.data}

@router.post("/scan")
async def scan_signals(companies: List[str]):
    """Trigger an on-demand signal scan for a list of companies and persist results."""
    if not companies:
        return {"signals": []}
    results = await run_signal_scan(companies)
    if results:
        supabase.table("signals").upsert(results, on_conflict="company,signal_type,headline").execute()
    return {"signals": results}
