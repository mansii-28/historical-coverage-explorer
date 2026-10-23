"""Policies router."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Policy
from app.schemas import AuditEventResponse, PolicyResponse, VehicleResponse
from app.services.audit_service import get_audit_events_for_policy
from app.services.vehicle_service import get_vehicles_for_policy

router = APIRouter(prefix="/api/policies", tags=["policies"])


@router.get(
    "/{policy_id}",
    response_model=PolicyResponse,
    summary="Get policy by ID",
    description="Returns insurance policy metadata for dashboard display.",
)
async def get_policy(
    policy_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy #{policy_id} not found.",
        )
    return policy


@router.get(
    "/{policy_id}/vehicles",
    response_model=list[VehicleResponse],
    summary="Get policy vehicles",
    description="Returns vehicles associated with a policy, optionally filtering removed vehicles.",
)
async def get_policy_vehicles(
    policy_id: int,
    include_removed: bool = Query(
        default=True,
        description="Whether to include soft-removed vehicles in the response",
    ),
    db: AsyncSession = Depends(get_db),
):
    # Verify policy exists
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy #{policy_id} not found.",
        )
    return await get_vehicles_for_policy(db, policy_id, include_removed=include_removed)


@router.get(
    "/{policy_id}/audit-events",
    response_model=list[AuditEventResponse],
    summary="Get audit trail for policy",
    description="Returns domain audit events in chronological order with optional category filter.",
)
async def get_policy_audit_events(
    policy_id: int,
    category: str | None = Query(
        default=None,
        description="Optional category filter: policy, vehicle, coverage, claim, or all",
    ),
    db: AsyncSession = Depends(get_db),
):
    # Verify policy exists
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    if not result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy #{policy_id} not found.",
        )
    return await get_audit_events_for_policy(db, policy_id, category=category)
