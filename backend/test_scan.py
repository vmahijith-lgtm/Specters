import asyncio
from scheduler import signal_scan_task

async def main():
    print("Forcing immediate signal scan...")
    await signal_scan_task()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
