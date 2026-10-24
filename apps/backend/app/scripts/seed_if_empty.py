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
                logger.info(
                    "✓ Seed-if-empty: Canonical DEMO-AUTO-1024 dataset successfully created."
                )
            else:
                logger.info(
                    "✓ Seed-if-empty: DEMO-AUTO-1024 already present. Preserving existing data."
                )
        except Exception as exc:
            logger.error("✗ Seed-if-empty failed: %s", exc)
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
