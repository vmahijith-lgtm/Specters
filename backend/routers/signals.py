from fastapi import APIRouter, Query
from database import supabase
from services.signal_engine import run_signal_scan, normalize_companies
from services.signal_store import persist_signals
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
        company_list = normalize_companies(companies)
        if company_list:
            # Use quoted ilike values to safely handle company names with special
            # characters. Double quotes are escaped by doubling them ("").
            def _q(name: str) -> str:
                return name.replace('"', '""')

            or_str = ",".join(f'company.ilike."{_q(c)}"' for c in company_list)
            query = query.or_(or_str)
    result = query.execute()
    return {"signals": result.data}

@router.post("/scan")
async def scan_signals(companies: List[str]):
    """Trigger an on-demand signal scan for a list of companies and persist results."""
    if not companies:
        return {"signals": []}
    results = await run_signal_scan(companies)
    persist_signals(results)
    return {"signals": results}
