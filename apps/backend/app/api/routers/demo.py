"""Demo reset router."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas import DemoResetResponse
from app.services.demo_service import reset_demo_data

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post(
    "/reset",
    response_model=DemoResetResponse,
    summary="Reset demo dataset",
    description=(
        "Safely purges synthetic data and reseeds the canonical Jordan Lee / DEMO-AUTO-1024 "
        "baseline. Non-production demonstration endpoint. Safe to run repeatedly."
    ),
)
async def reset_demo(
    scenario: Literal["canonical", "versioned"] = Query(
        default="canonical",
        description="Demo scenario to seed ('canonical' or 'versioned')",
    ),
    db: AsyncSession = Depends(get_db),
):
    if not settings.DEMO_RESET_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo reset is disabled in this environment.",
        )
    return await reset_demo_data(session=db, scenario=scenario)
