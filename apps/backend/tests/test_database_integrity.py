"""
Database Integrity & Foreign Key Deletion Protection Tests.
===========================================================
Verifies that the database engine itself enforces ADR-007:
Historical entities and pinned coverage versions are strictly protected against
accidental or cascading deletions.
"""

from datetime import UTC, date, datetime

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.models import CoverageVersion, Policy, Vehicle
from app.services.claim_service import create_claim


@pytest.mark.asyncio
async def test_13_database_prevents_deletion_of_pinned_coverage_version(
    db_session, seed_canonical_policy
):
    """
    Test 13: Database-level foreign key protection.
    When Claim 1 references CoverageVersion 1, attempting to delete CoverageVersion 1
    MUST raise a foreign key integrity violation (RESTRICT), rolling back cleanly.
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]
    coverage_id = seed_canonical_policy["coverage_version_id"]

    # File claim to pin CoverageVersion 1
    claim = await create_claim(
        session=db_session,
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        date_of_loss=date(2026, 1, 10),
        filed_at=datetime(2026, 2, 10, 0, 0, 0, tzinfo=UTC),
    )
    assert claim.coverage_version_id == coverage_id

    # Attempt direct deletion of CoverageVersion 1 -> Must raise IntegrityError
    with pytest.raises(IntegrityError) as exc_info:
        await db_session.execute(
            text(f"DELETE FROM coverage_versions WHERE id = {coverage_id};")
        )
        await db_session.commit()

    await db_session.rollback()

    # Verify the error detail references the foreign key constraint
    assert "claims_coverage_version_id_fkey" in str(exc_info.value).lower() or "foreign key" in str(
        exc_info.value
    ).lower()

    # Verify CoverageVersion 1 is still present in the database
    cv = await db_session.get(CoverageVersion, coverage_id)
    assert cv is not None
    assert cv.id == coverage_id


@pytest.mark.asyncio
async def test_database_prevents_deletion_of_policy_with_vehicles(
    db_session, seed_canonical_policy
):
    """Verifies that vehicles.policy_id RESTRICT blocks deletion of a policy."""
    policy_id = seed_canonical_policy["policy_id"]

    with pytest.raises(IntegrityError):
        await db_session.execute(text(f"DELETE FROM policies WHERE id = {policy_id};"))
        await db_session.commit()

    await db_session.rollback()

    policy = await db_session.get(Policy, policy_id)
    assert policy is not None


@pytest.mark.asyncio
async def test_database_prevents_deletion_of_vehicle_with_coverage(
    db_session, seed_canonical_policy
):
    """Verifies that coverage_versions.vehicle_id RESTRICT blocks deletion of an insured vehicle."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    with pytest.raises(IntegrityError):
        await db_session.execute(text(f"DELETE FROM vehicles WHERE id = {vehicle_id};"))
        await db_session.commit()

    await db_session.rollback()

    vehicle = await db_session.get(Vehicle, vehicle_id)
    assert vehicle is not None
