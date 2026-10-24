"""
Deployment Seed-If-Empty Script.
=================================
Safely initializes the database with the canonical Jordan Lee / DEMO-AUTO-1024
demonstration baseline if and only if the policy does not already exist.

Guaranteed to be non-destructive:
- Never truncates tables.
- Never resets or overwrites claims, removed vehicles, or audit logs.
- Safe to run on every deployment and container startup.
"""

import asyncio
import logging
import sys

from app.db.session import AsyncSessionLocal
from app.services.demo_service import seed_if_empty

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_if_empty")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        try:
            seeded = await seed_if_empty(session)
            if seeded:
                print("[deployment] canonical demo seeded", flush=True)
            else:
                print("[deployment] canonical demo already exists; no changes made", flush=True)
        except Exception as exc:
            msg = str(exc)
            if "@" in msg and "://" in msg:
                msg = "Database connection error (credentials redacted)"
            print(f"[deployment] seed_if_empty failed: {type(exc).__name__}: {msg}", flush=True)
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
