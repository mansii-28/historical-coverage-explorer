"""Health check router."""

import logging

from fastapi import APIRouter
from sqlalchemy import text

from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health check")
async def health_check():
    """
    Returns service health status including database connectivity.

    Response shape:
    - status: "ok" | "degraded"
    - database: "connected" | "unavailable"
    - version: application version string
    """
    db_status = "connected"
    overall = "ok"

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("Health check: database unavailable — %s", exc)
        db_status = "unavailable"
        overall = "degraded"

    return {
        "status": overall,
        "database": db_status,
        "service": "historical-coverage-explorer",
        "version": "0.1.0",
        "disclaimer": (
            "Concept prototype built as a product and engineering thought exercise. "
            "Uses synthetic data only and does not represent any company's production architecture."
        ),
    }
