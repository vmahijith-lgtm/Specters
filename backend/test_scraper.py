import asyncio
import json
from services.scraper import scrape_linkedin_jobs

async def main():
    print("Testing general scraper for 'Software Engineer' in 'New York'...")
    jobs = await scrape_linkedin_jobs(role="Software Engineer", location="New York", limit=5)
    print(f"Found {len(jobs)} jobs in the last 24 hours:")
    print(json.dumps(jobs, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
