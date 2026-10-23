"""Demo reset router."""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

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
    return await reset_demo_data(session=db, scenario=scenario)
