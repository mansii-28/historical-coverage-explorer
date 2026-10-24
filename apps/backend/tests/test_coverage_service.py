"""
Coverage Service Unit & Integration Tests.
==========================================
Verifies deterministic point-in-time coverage lookups, half-open interval boundaries
[valid_from, valid_to), multi-version selection, and overlap prevention.
"""

from datetime import date
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models import CoverageVersion
from app.services.coverage_service import (
    check_coverage,
    get_coverage_history,
    get_coverage_on_date,
    validate_coverage_overlap,
)


@pytest.mark.asyncio
async def test_1_coverage_during_active_interval(db_session, seed_canonical_policy):
    """
    Test 1:
      Coverage lookup for a date during an active coverage interval returns COVERAGE_FOUND.
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # 2026-01-10 is between valid_from (2026-01-01) and valid_to (None)
    result = await check_coverage(db_session, vehicle_id=vehicle_id, date_of_loss=date(2026, 1, 10))

    assert result.coverage_found is True
    assert result.verification_status == "COVERAGE_FOUND"
    assert result.coverage_version is not None
    assert result.coverage_version.id == seed_canonical_policy["coverage_version_id"]
    assert result.coverage_version.coverage_type == "Comprehensive"
    assert result.coverage_version.deductible == Decimal("500.00")
    assert result.coverage_version.liability_limit == Decimal("100000.00")


@pytest.mark.asyncio
async def test_4_boundary_valid_from_is_inclusive(db_session, seed_canonical_policy):
    """Test 4: The interval start date (valid_from) is inclusive."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Look up exactly on valid_from (2026-01-01)
    matched = await get_coverage_on_date(db_session, vehicle_id, date(2026, 1, 1))

    assert matched is not None
    assert matched.id == seed_canonical_policy["coverage_version_id"]
    assert matched.valid_from == date(2026, 1, 1)


@pytest.mark.asyncio
async def test_5_boundary_valid_to_is_exclusive(db_session, seed_canonical_policy):
    """Test 5: The interval end date (valid_to) is exclusive in [valid_from, valid_to)."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Close active coverage to end on 2026-01-15
    cv = await db_session.get(CoverageVersion, seed_canonical_policy["coverage_version_id"])
    cv.valid_to = date(2026, 1, 15)
    await db_session.commit()

    # Look up exactly on valid_to (2026-01-15) -> Must NOT match
    result = await check_coverage(db_session, vehicle_id=vehicle_id, date_of_loss=date(2026, 1, 15))

    assert result.coverage_found is False
    assert result.verification_status == "REQUIRES_MANUAL_REVIEW"
    assert result.coverage_version is None


@pytest.mark.asyncio
async def test_6_boundary_day_before_valid_to(db_session, seed_canonical_policy):
    """Test 6: The day immediately prior to valid_to is covered (inclusive end)."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Close coverage to end on 2026-01-15
    cv = await db_session.get(CoverageVersion, seed_canonical_policy["coverage_version_id"])
    cv.valid_to = date(2026, 1, 15)
    await db_session.commit()

    # Look up on 2026-01-14 -> Must match
    matched = await get_coverage_on_date(db_session, vehicle_id, date(2026, 1, 14))

    assert matched is not None
    assert matched.id == seed_canonical_policy["coverage_version_id"]


@pytest.mark.asyncio
async def test_7_multiple_versions_chronological_selection(db_session, seed_canonical_policy):
    """
    Test 7: Multiple sequential versions:
      Version 1: Jan 1 -> Jan 8 (deductible $1000)
      Version 2: Jan 8 -> Jan 15 (deductible $500)
    Lookup Jan 5 -> Version 1
    Lookup Jan 10 -> Version 2
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]

    # Update Version 1
    cv1 = await db_session.get(CoverageVersion, seed_canonical_policy["coverage_version_id"])
    cv1.valid_from = date(2026, 1, 1)
    cv1.valid_to = date(2026, 1, 8)
    cv1.deductible = Decimal("1000.00")
    cv1.version_label = "Version 1"

    # Add Version 2
    cv2 = CoverageVersion(
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        valid_from=date(2026, 1, 8),
        valid_to=date(2026, 1, 15),
        coverage_type="Comprehensive",
        liability_limit=Decimal("100000.00"),
        deductible=Decimal("500.00"),
        version_label="Version 2",
    )
    db_session.add(cv2)
    await db_session.commit()

    # Lookup on Jan 5 -> Must select Version 1
    res_jan5 = await get_coverage_on_date(db_session, vehicle_id, date(2026, 1, 5))
    assert res_jan5 is not None
    assert res_jan5.id == cv1.id
    assert res_jan5.deductible == Decimal("1000.00")

    # Lookup on Jan 10 -> Must select Version 2
    res_jan10 = await get_coverage_on_date(db_session, vehicle_id, date(2026, 1, 10))
    assert res_jan10 is not None
    assert res_jan10.id == cv2.id
    assert res_jan10.deductible == Decimal("500.00")

    # Verify coverage history returns both versions in chronological order
    history = await get_coverage_history(db_session, vehicle_id)
    assert len(history) == 2
    assert history[0].id == cv1.id
    assert history[1].id == cv2.id


@pytest.mark.asyncio
async def test_8_coverage_overlap_prevention(db_session, seed_canonical_policy):
    """Test 8: Coverage overlap validation rejects overlapping ranges for the same vehicle."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Version 1 currently covers Jan 1 -> Present (None)
    # Attempting to add an interval from Jan 5 to Jan 20 must raise 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        await validate_coverage_overlap(
            session=db_session,
            vehicle_id=vehicle_id,
            new_from=date(2026, 1, 5),
            new_to=date(2026, 1, 20),
        )

    assert exc_info.value.status_code == 409
    assert "overlaps with existing version" in exc_info.value.detail


@pytest.mark.asyncio
async def test_9_invalid_coverage_range_rejected(db_session, seed_canonical_policy):
    """
    Test 9:
      Invalid coverage range where valid_to <= valid_from is rejected by check constraint.
    """
    policy_id = seed_canonical_policy["policy_id"]
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Inverted range: valid_from = Jan 15, valid_to = Jan 10
    invalid_cv = CoverageVersion(
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        valid_from=date(2026, 1, 15),
        valid_to=date(2026, 1, 10),
        coverage_type="Comprehensive",
        liability_limit=Decimal("100000.00"),
        deductible=Decimal("500.00"),
        version_label="Invalid Version",
    )
    db_session.add(invalid_cv)

    with pytest.raises(IntegrityError):
        await db_session.commit()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_16_historical_lookup_unknown_vehicle(db_session):
    """Test 16: Historical coverage lookup for non-existent vehicle returns no coverage."""
    matched = await get_coverage_on_date(
        db_session, vehicle_id=999999, target_date=date(2026, 1, 10)
    )
    assert matched is None
