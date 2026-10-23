"""
Vehicle Service.
================
Implements vehicle lifecycle management and the atomic vehicle removal transaction.
Soft removal populates removed_at and closes the active coverage interval,
preserving complete temporal and audit history.
"""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CoverageVersion, Vehicle
from app.schemas import VehicleRemovalResponse
from app.services.audit_service import record_audit_event


async def get_vehicle_by_id(session: AsyncSession, vehicle_id: int) -> Vehicle | None:
    """Retrieve vehicle by primary key."""
    result = await session.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    return result.scalars().first()


async def get_vehicles_for_policy(
    session: AsyncSession,
    policy_id: int,
    include_removed: bool = True,
) -> list[Vehicle]:
    """Retrieve vehicles for a policy with optional removed filter."""
    query = select(Vehicle).where(Vehicle.policy_id == policy_id)
    if not include_removed:
        query = query.where(Vehicle.removed_at.is_(None))
    query = query.order_by(Vehicle.id.asc())
    result = await session.execute(query)
    return list(result.scalars().all())


async def remove_vehicle(
    session: AsyncSession,
    vehicle_id: int,
    effective_date: date,
) -> VehicleRemovalResponse:
    """
    Atomic transaction for vehicle removal.
    1. Validate vehicle exists and is active.
    2. Validate effective date is not before added_at.
    3. Load currently active coverage version.
    4. Validate effective date is not before coverage valid_from.
    5. Emit audit event: VEHICLE_REMOVAL_REQUESTED.
    6. Set vehicle.removed_at = effective_date.
    7. Close active coverage: valid_to = effective_date.
    8. Emit audit event: COVERAGE_CLOSED.
    9. Emit audit event: VEHICLE_REMOVED.
    10. Commit transaction.
    """
    vehicle = await get_vehicle_by_id(session, vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle #{vehicle_id} not found.",
        )

    if vehicle.removed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Vehicle #{vehicle_id} is already removed "
                f"effective {vehicle.removed_at.isoformat()}."
            ),
        )

    if effective_date < vehicle.added_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Effective removal date ({effective_date}) cannot precede "
                f"vehicle added date ({vehicle.added_at})."
            ),
        )

    # Find active coverage version (valid_to IS NULL)
    cov_query = select(CoverageVersion).where(
        CoverageVersion.vehicle_id == vehicle_id,
        CoverageVersion.valid_to.is_(None),
    )
    cov_result = await session.execute(cov_query)
    active_coverage = cov_result.scalars().first()

    if not active_coverage:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No active coverage version found for vehicle #{vehicle_id}.",
        )

    if effective_date < active_coverage.valid_from:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Effective removal date ({effective_date}) cannot precede "
                f"active coverage start date ({active_coverage.valid_from})."
            ),
        )

    # ─── Execute Atomic Workflow ──────────────────────────────────────────
    # Step 1: Audit event VEHICLE_REMOVAL_REQUESTED
    await record_audit_event(
        session=session,
        event_type="VEHICLE_REMOVAL_REQUESTED",
        policy_id=vehicle.policy_id,
        vehicle_id=vehicle.id,
        metadata_json={
            "vehicle_id": vehicle.id,
            "vin": vehicle.vin,
            "effective_date": effective_date.isoformat(),
        },
    )

    # Step 2: Update Vehicle
    vehicle.removed_at = effective_date

    # Step 3: Close active coverage version
    active_coverage.valid_to = effective_date

    # Step 4: Audit event COVERAGE_CLOSED
    await record_audit_event(
        session=session,
        event_type="COVERAGE_CLOSED",
        policy_id=vehicle.policy_id,
        vehicle_id=vehicle.id,
        metadata_json={
            "coverage_version_id": active_coverage.id,
            "valid_from": active_coverage.valid_from.isoformat(),
            "valid_to": effective_date.isoformat(),
        },
    )

    # Step 5: Audit event VEHICLE_REMOVED
    await record_audit_event(
        session=session,
        event_type="VEHICLE_REMOVED",
        policy_id=vehicle.policy_id,
        vehicle_id=vehicle.id,
        metadata_json={
            "vehicle_id": vehicle.id,
            "removed_at": effective_date.isoformat(),
        },
    )

    await session.commit()

    return VehicleRemovalResponse(
        message="Vehicle removed successfully. Historical coverage preserved.",
        vehicle_id=vehicle.id,
        removed_at=effective_date,
        closed_coverage_version_id=active_coverage.id,
    )
