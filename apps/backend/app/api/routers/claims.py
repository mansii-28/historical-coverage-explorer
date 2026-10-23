"""Claims router."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models import Claim
from app.schemas import ClaimCreateRequest, ClaimResponse
from app.services.claim_service import create_claim, get_claim_by_id, get_claims_for_policy

router = APIRouter(prefix="/api/claims", tags=["claims"])


@router.post(
    "",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="File a new claim",
    description=(
        "Executes atomic claim creation: performs deterministic historical coverage lookup "
        "using date_of_loss (NOT filed_at date). Pins coverage_version_id immutably to the claim. "
        "If no coverage found, routes to REQUIRES_MANUAL_REVIEW rather than automated denial."
    ),
)
async def file_claim(
    payload: ClaimCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    return await create_claim(
        session=db,
        policy_id=payload.policy_id,
        vehicle_id=payload.vehicle_id,
        date_of_loss=payload.date_of_loss,
        filed_at=payload.filed_at,
    )


@router.get(
    "/{claim_id}",
    response_model=ClaimResponse,
    summary="Get claim by ID",
    description="Returns claim details including pinned coverage version and vehicle summary.",
)
async def get_claim(
    claim_id: int,
    db: AsyncSession = Depends(get_db),
):
    claim = await get_claim_by_id(db, claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim #{claim_id} not found.",
        )
    return claim


@router.get(
    "",
    response_model=list[ClaimResponse],
    summary="List claims",
    description="Returns claims, optionally filtered by policy ID.",
)
async def list_claims(
    policy_id: int | None = Query(default=None, description="Optional policy ID filter"),
    db: AsyncSession = Depends(get_db),
):
    if policy_id is not None:
        return await get_claims_for_policy(db, policy_id)

    query = (
        select(Claim)
        .options(
            selectinload(Claim.coverage_version),
            selectinload(Claim.vehicle),
        )
        .order_by(Claim.id.asc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())
