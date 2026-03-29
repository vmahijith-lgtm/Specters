"""
Job board scraper. Uses Playwright to scrape LinkedIn with a 24-hour filter.
Returns top 5 per search query. Avoids blocked user agents.
"""
from playwright.async_api import async_playwright
from datetime import datetime, timezone
from typing import Optional
import asyncio

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

async def scrape_linkedin_jobs(role: str, location: str, limit: int = 5) -> list[dict]:
    jobs = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            ctx = await browser.new_context(user_agent=USER_AGENT)
            page = await ctx.new_page()

            url = (
                f"https://www.linkedin.com/jobs/search/"
                f"?keywords={role.replace(' ', '%20')}"
                f"&location={location.replace(' ', '%20')}"
                f"&f_TPR=r86400"   # posted in last 24 hours
                f"&sortBy=DD"       # newest first
            )
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(3000)

            cards = await page.query_selector_all(".base-card")
            for card in cards[:limit]:
                try:
                    title_el    = await card.query_selector(".base-search-card__title")
                    company_el  = await card.query_selector(".base-search-card__subtitle")
                    link_el     = await card.query_selector("a.base-card__full-link")
                    location_el = await card.query_selector(".job-search-card__location")
                    time_el     = await card.query_selector("time")

                    title    = (await title_el.inner_text()).strip()   if title_el    else None
                    company  = (await company_el.inner_text()).strip() if company_el  else None
                    href     = await link_el.get_attribute("href")     if link_el     else None
                    location_text = (await location_el.inner_text()).strip() if location_el else location
                    posted   = await time_el.get_attribute("datetime") if time_el else None

                    if title and company and href:
                        jobs.append({
                            "title":     title,
                            "company":   company,
                            "location":  location_text,
                            "remote":    "remote" in location_text.lower(),
                            "url":       href.split("?")[0],
                            "source":    "linkedin",
                            "posted_at": posted,
                        })
                except Exception:
                    continue

            await browser.close()
    except Exception as e:
        print(f"[scraper] linkedin failed for '{role}' in '{location}': {e}")
    return jobs

async def scrape_all_for_user(target_roles: list[str], target_locations: list[str]) -> list[dict]:
    """Scrape all role × location combinations, deduplicate by URL."""
    all_jobs = []
    seen_urls = set()
    for role in target_roles:
        for loc in target_locations:
            batch = await scrape_linkedin_jobs(role, loc)
            for job in batch:
                if job["url"] not in seen_urls:
                    seen_urls.add(job["url"])
                    all_jobs.append(job)
            await asyncio.sleep(2)  # be polite
    return all_jobs
