"""
Pre-posting signal detection engine.
Scans funding news, LinkedIn headcount growth, GitHub activity, Glassdoor.
Returns scored signals before jobs are ever posted.
"""
import httpx
import re
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from typing import Optional

COMPANY_SPLIT_RE = re.compile(r"[,\n]+")

SIGNAL_WEIGHTS = {
    "series_a": 75,
    "series_b": 85,
    "series_c": 90,
    "series_d": 88,
    "seed": 60,
    "headcount_growth_fast": 80,
    "github_spike": 55,
    "exec_hire": 70,
    "product_launch": 65,
}


def normalize_companies(raw_companies) -> list[str]:
    """Normalize mixed company inputs into a clean, de-duplicated list."""
    if raw_companies is None:
        return []

    if isinstance(raw_companies, str):
        candidates = [raw_companies]
    elif isinstance(raw_companies, (list, tuple, set)):
        candidates = [str(c) for c in raw_companies if c is not None]
    else:
        candidates = [str(raw_companies)]

    clean: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        for part in COMPANY_SPLIT_RE.split(candidate):
            company = part.strip()
            if not company:
                continue
            key = company.casefold()
            if key in seen:
                continue
            seen.add(key)
            clean.append(company)
    return clean

async def detect_funding_signal(company: str) -> Optional[dict]:
    """Scrapes TechCrunch RSS for funding news within last 72 hours."""
    try:
        company = company.strip()
        if not company:
            return None
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                "https://techcrunch.com/wp-json/wp/v2/posts",
                params={
                    "search": f"{company} funding",
                    "per_page": 5,
                    "_fields": "title,date,link,excerpt",
                },
            )
            if r.status_code != 200:
                return None
            posts = r.json()
            cutoff = datetime.now(timezone.utc) - timedelta(hours=72)
            for post in posts:
                pub = datetime.fromisoformat(post["date"]).replace(tzinfo=timezone.utc)
                if pub < cutoff:
                    continue
                text = BeautifulSoup(post["excerpt"]["rendered"], "html.parser").get_text()
                series = _extract_series(text)
                score = SIGNAL_WEIGHTS.get(f"series_{series.lower()}", 60)
                return {
                    "company": company,
                    "signal_type": "funding_round",
                    "signal_score": score,
                    "headline": post["title"]["rendered"],
                    "source_url": post["link"],
                    "raw_data": {"series": series, "date": post["date"]},
                }
    except Exception as e:
        print(f"[signal_engine] funding scan failed for {company}: {e}")
    return None

async def detect_github_spike(company: str) -> Optional[dict]:
    """Checks GitHub org repos for unusual recent commits (hiring signal)."""
    try:
        company = company.strip()
        if not company:
            return None
        async with httpx.AsyncClient(timeout=10, headers={"Accept": "application/vnd.github.v3+json"}) as client:
            # Find org
            r = await client.get(
                "https://api.github.com/search/users",
                params={"q": f"{company} type:org", "per_page": 1},
            )
            if r.status_code != 200 or not r.json().get("items"):
                return None
            org_login = r.json()["items"][0]["login"]

            # Check recent repos
            r2 = await client.get(
                f"https://api.github.com/orgs/{org_login}/repos"
                f"?sort=pushed&direction=desc&per_page=10"
            )
            if r2.status_code != 200:
                return None
            repos = r2.json()
            cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            recent_active = [
                repo for repo in repos
                if datetime.fromisoformat(repo["pushed_at"].replace("Z", "+00:00")) > cutoff
                and not repo["fork"]
            ]
            if len(recent_active) >= 4:
                return {
                    "company": company,
                    "signal_type": "github_spike",
                    "signal_score": SIGNAL_WEIGHTS["github_spike"],
                    "headline": f"{company} has {len(recent_active)} active repos this week",
                    "source_url": f"https://github.com/{org_login}",
                    "raw_data": {"active_repos": len(recent_active), "org": org_login},
                }
    except Exception as e:
        print(f"[signal_engine] github scan failed for {company}: {e}")
    return None

def _extract_series(text: str) -> str:
    match = re.search(r"Series ([A-F])|(\bseed\b)", text, re.I)
    if match:
        return match.group(1) or "seed"
    return "unknown"

async def run_signal_scan(companies: list[str]) -> list[dict]:
    """Run all signal detectors against a watchlist and return sorted results."""
    results = []
    for company in normalize_companies(companies):
        funding = await detect_funding_signal(company)
        if funding:
            results.append(funding)
        github = await detect_github_spike(company)
        if github:
            results.append(github)
    return sorted(results, key=lambda x: x["signal_score"], reverse=True)
