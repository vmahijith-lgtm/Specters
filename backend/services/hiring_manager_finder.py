"""
Hiring manager discovery service.

Builds targeted LinkedIn people-search URLs for a given job/company,
attempts lightweight HTTP fetch + HTML parse, and degrades gracefully
when LinkedIn blocks unauthenticated access (which is the common case).

Fallback: stores the search URL itself so users can click through to
LinkedIn and find managers manually.
"""

import asyncio
import re
from urllib.parse import urlencode

import httpx
from bs4 import BeautifulSoup

from database import supabase

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def _build_search_url(company: str, title: str) -> str:
    """Return a LinkedIn people-search URL targeting ``title`` at ``company``."""
    params = urlencode({
        "keywords": f"{title} {company}",
        "origin": "GLOBAL_SEARCH_HEADER",
    })
    return f"https://www.linkedin.com/search/results/people/?{params}"


def _infer_search_titles(job_title: str) -> list[str]:
    """Return a short list of manager-tier titles relevant to ``job_title``."""
    jt = job_title.lower()

    def _any(*keywords: str) -> bool:
        return any(re.search(r'\b' + re.escape(k) + r'\b', jt) for k in keywords)

    if _any("engineer", "developer", "swe", "software", "backend", "frontend", "fullstack"):
        return ["Engineering Manager", "Head of Engineering", "Technical Recruiter", "VP of Engineering"]
    if _any("product manager", "product") or jt.endswith(" pm") or jt.startswith("pm "):
        return ["Director of Product", "VP of Product", "Technical Recruiter", "Head of Product"]
    if _any("design", "ux", "ui"):
        return ["Design Manager", "Head of Design", "Technical Recruiter"]
    if _any("data", "analyst", "machine learning", "ml", "ai"):
        return ["Head of Data", "VP of Data", "Technical Recruiter", "Director of Analytics"]
    if _any("sales", "account executive", "business development"):
        return ["Sales Manager", "VP of Sales", "Recruiter", "Head of Sales"]
    return ["Hiring Manager", "Technical Recruiter", "Talent Acquisition"]


async def _try_parse_search_page(url: str) -> list[dict]:
    """
    Attempt a lightweight HTTP fetch of a LinkedIn people-search page.

    LinkedIn frequently blocks unauthenticated requests – returning an empty
    list is the expected degraded behaviour, not an error.
    """
    try:
        async with httpx.AsyncClient(
            headers=_HEADERS, follow_redirects=True, timeout=10.0
        ) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        results: list[dict] = []
        for card in soup.select(".reusable-search__result-container")[:5]:
            try:
                name_el = card.select_one(".entity-result__title-text a")
                sub_el = card.select_one(".entity-result__primary-subtitle")
                if not name_el:
                    continue
                profile_url = (name_el.get("href") or "").split("?")[0]
                name = name_el.get_text(strip=True)
                title = sub_el.get_text(strip=True) if sub_el else None
                if name and profile_url:
                    results.append({"name": name, "title": title, "linkedin_url": profile_url})
            except Exception:
                continue
        return results
    except Exception:
        return []


def _upsert_managers(job_id: str, rows: list[dict]) -> None:
    """
    Insert new manager rows, skipping any whose ``(job_id, linkedin_url)``
    pair already exists in the table.

    The check is done in application code for compatibility with deployments
    that predate the unique constraint added in the schema migration.
    """
    if not rows:
        return

    existing_r = (
        supabase.table("hiring_managers")
        .select("linkedin_url")
        .eq("job_id", job_id)
        .execute()
    )
    existing_urls = {
        r["linkedin_url"]
        for r in (existing_r.data or [])
        if r.get("linkedin_url")
    }

    new_rows = [r for r in rows if r.get("linkedin_url") not in existing_urls]
    if new_rows:
        supabase.table("hiring_managers").insert(new_rows).execute()


async def discover_hiring_managers(
    job_id: str,
    company: str,
    job_title: str,
) -> list[dict]:
    """
    Discover potential hiring managers for a job.

    For each inferred search title:
      1. Build a LinkedIn people-search URL.
      2. Try lightweight HTML parsing (graceful degradation on block).
      3. If parsing yields results → upsert them.
         Otherwise → store a synthetic row with the search URL so the user
         can navigate to LinkedIn manually.

    Returns all ``hiring_managers`` rows for ``job_id`` after upsert.
    """
    search_titles = _infer_search_titles(job_title)
    rows_to_store: list[dict] = []

    for title in search_titles:
        url = _build_search_url(company, title)
        parsed = await _try_parse_search_page(url)

        if parsed:
            await asyncio.sleep(1)  # be polite to LinkedIn after a successful fetch
            for p in parsed:
                rows_to_store.append({
                    "job_id": job_id,
                    "name": p["name"],
                    "title": p.get("title") or title,
                    "linkedin_url": p["linkedin_url"],
                    "company": company,
                })
        else:
            # Fallback: store the search URL itself for manual click-through
            rows_to_store.append({
                "job_id": job_id,
                "name": None,
                "title": title,
                "linkedin_url": url,
                "company": company,
            })

    _upsert_managers(job_id, rows_to_store)

    result = (
        supabase.table("hiring_managers")
        .select("*")
        .eq("job_id", job_id)
        .order("found_at", desc=True)
        .execute()
    )
    return result.data or []
