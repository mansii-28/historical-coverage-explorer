"""Vehicles router."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas import (
    CoverageLookupResponse,
    CoverageVersionResponse,
    VehicleRemovalRequest,
    VehicleRemovalResponse,
    VehicleResponse,
)
from app.services.coverage_service import check_coverage, get_coverage_history
from app.services.vehicle_service import get_vehicle_by_id, remove_vehicle

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Get vehicle by ID",
    description="Returns vehicle details regardless of whether it is active or historical.",
)
async def get_vehicle(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
):
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle #{vehicle_id} not found.",
        )
    return vehicle


@router.post(
    "/{vehicle_id}/remove",
    response_model=VehicleRemovalResponse,
    summary="Soft-remove vehicle from policy",
    description=(
        "Executes atomic removal transaction: sets vehicle.removed_at, closes active "
        "coverage version (valid_to = effective_date), and records immutable audit events. "
        "Preserves complete historical record."
    ),
)
async def remove_vehicle_endpoint(
    vehicle_id: int,
    payload: VehicleRemovalRequest,
    db: AsyncSession = Depends(get_db),
):
    return await remove_vehicle(
        session=db,
        vehicle_id=vehicle_id,
        effective_date=payload.effective_date,
    )


@router.get(
    "/{vehicle_id}/coverage",
    response_model=CoverageLookupResponse,
    summary="Get historical coverage as of date",
    description=(
        "Evaluates point-in-time coverage on the specified date using half-open interval "
        "semantics: valid_from <= as_of < valid_to. Deterministic and auditable."
    ),
)
async def get_vehicle_coverage_as_of(
    vehicle_id: int,
    as_of: date = Query(
        ...,
        description="The target date to evaluate coverage for (YYYY-MM-DD)",
    ),
    db: AsyncSession = Depends(get_db),
):
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle #{vehicle_id} not found.",
        )
    return await check_coverage(
        session=db,
        vehicle_id=vehicle_id,
        date_of_loss=as_of,
        record_audit=True,
        policy_id=vehicle.policy_id,
    )


@router.get(
    "/{vehicle_id}/coverage-history",
    response_model=list[CoverageVersionResponse],
    summary="Get coverage version history",
    description=(
        "Returns all historical and active coverage versions for a vehicle "
        "ordered chronologically."
    ),
)
async def get_vehicle_coverage_history(
    vehicle_id: int,
    db: AsyncSession = Depends(get_db),
):
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle #{vehicle_id} not found.",
        )
    return await get_coverage_history(db, vehicle_id)
