"""
Vehicle Service Unit & Integration Tests.
=========================================
Verifies atomic vehicle soft-removal, active coverage closure, duplicate removal conflict,
and temporal validation rules.
"""

from datetime import date

import pytest
from fastapi import HTTPException

from app.models import CoverageVersion
from app.services.vehicle_service import (
    get_vehicle_by_id,
    get_vehicles_for_policy,
    remove_vehicle,
)


@pytest.mark.asyncio
async def test_10_vehicle_removal_closes_active_coverage(db_session, seed_canonical_policy):
    """
    Test 10: Removing a vehicle:
      - Sets vehicle.removed_at = effective_date
      - Sets active CoverageVersion.valid_to = effective_date
      - Preserves the vehicle and coverage records in the database (no hard deletion).
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]
    coverage_id = seed_canonical_policy["coverage_version_id"]

    removal_date = date(2026, 1, 15)
    response = await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=removal_date)

    assert response.vehicle_id == vehicle_id
    assert response.removed_at == removal_date
    assert response.closed_coverage_version_id == coverage_id

    # Verify vehicle record is NOT deleted, but has removed_at set
    vehicle = await get_vehicle_by_id(db_session, vehicle_id)
    assert vehicle is not None
    assert vehicle.removed_at == removal_date
    assert vehicle.is_active is False

    # Verify coverage version record is NOT deleted, but has valid_to set
    cv = await db_session.get(CoverageVersion, coverage_id)
    assert cv is not None
    assert cv.valid_to == removal_date

    # Verify get_vehicles_for_policy with include_removed=False excludes it
    active_vehicles = await get_vehicles_for_policy(
        db_session, seed_canonical_policy["policy_id"], include_removed=False
    )
    assert len(active_vehicles) == 0

    # With include_removed=True, it is included
    all_vehicles = await get_vehicles_for_policy(
        db_session, seed_canonical_policy["policy_id"], include_removed=True
    )
    assert len(all_vehicles) == 1
    assert all_vehicles[0].id == vehicle_id


@pytest.mark.asyncio
async def test_11_double_vehicle_removal_returns_409(db_session, seed_canonical_policy):
    """Test 11: Attempting to remove an already-removed vehicle raises HTTP 409 Conflict."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # First removal succeeds
    await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=date(2026, 1, 15))

    # Second removal attempt must fail with 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=date(2026, 1, 20))

    assert exc_info.value.status_code == 409
    assert "already removed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_removal_date_before_vehicle_added_date_rejected(db_session, seed_canonical_policy):
    """Validation test: Removal date cannot precede vehicle added date."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Vehicle was added on 2026-01-01. Attempting removal on 2025-12-15 must fail.
    with pytest.raises(HTTPException) as exc_info:
        await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=date(2025, 12, 15))

    assert exc_info.value.status_code == 422
    assert "cannot precede vehicle added date" in exc_info.value.detail


@pytest.mark.asyncio
async def test_removal_unknown_vehicle_returns_404(db_session):
    """Validation test: Removing non-existent vehicle returns 404."""
    with pytest.raises(HTTPException) as exc_info:
        await remove_vehicle(db_session, vehicle_id=999999, effective_date=date(2026, 1, 15))

    assert exc_info.value.status_code == 404
