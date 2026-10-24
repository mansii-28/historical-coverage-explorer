"""
Claim Service Unit & Integration Tests.
=======================================
Verifies claim creation evaluated by date_of_loss, coverage version pinning stability,
manual review routing, and domain validation.
"""

from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.models import CoverageVersion, Policy
from app.services.claim_service import (
    create_claim,
    get_claim_by_id,
    get_claims_for_policy,
)
from app.services.vehicle_service import remove_vehicle


@pytest.mark.asyncio
async def test_2_claim_filed_after_removal_finds_historical_coverage(
    db_session, seed_canonical_policy
):
    """
    Test 2:
      Coverage: Jan 1 -> Jan 15
      Loss: Jan 10
      Vehicle Removed: Jan 15
      Claim Filed: Feb 10
    Expected:
      coverage_version_id populated (pinned to Version 1)
      coverage_verification_status = COVERAGE_FOUND
      status = SUBMITTED
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]
    coverage_id = seed_canonical_policy["coverage_version_id"]

    # Remove vehicle on Jan 15
    await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=date(2026, 1, 15))

    # File claim on Feb 10 for loss on Jan 10
    filed_date = datetime(2026, 2, 10, 0, 0, 0, tzinfo=UTC)
    claim = await create_claim(
        session=db_session,
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        date_of_loss=date(2026, 1, 10),
        filed_at=filed_date,
    )

    assert claim is not None
    assert claim.coverage_version_id == coverage_id
    assert claim.coverage_verification_status == "COVERAGE_FOUND"
    assert claim.status == "SUBMITTED"
    assert claim.date_of_loss == date(2026, 1, 10)
    assert claim.claim_number.startswith("DEMO-CLM-")


@pytest.mark.asyncio
async def test_3_loss_after_coverage_ended_routes_to_manual_review(
    db_session, seed_canonical_policy
):
    """
    Test 3:
      Vehicle removed: Jan 15 (coverage ended Jan 15 exclusive)
      Loss: Jan 20
      Claim Filed: Feb 10
    Expected:
      coverage_version_id = NULL
      coverage_verification_status = REQUIRES_MANUAL_REVIEW
      status = MANUAL_REVIEW
      No automated denial or rejection.
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]

    # Remove vehicle on Jan 15
    await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=date(2026, 1, 15))

    # File claim for Jan 20 loss
    filed_date = datetime(2026, 2, 10, 0, 0, 0, tzinfo=UTC)
    claim = await create_claim(
        session=db_session,
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        date_of_loss=date(2026, 1, 20),
        filed_at=filed_date,
    )

    assert claim is not None
    assert claim.coverage_version_id is None
    assert claim.coverage_verification_status == "REQUIRES_MANUAL_REVIEW"
    assert claim.status == "MANUAL_REVIEW"
    assert "DENIED" not in claim.status
    assert "DENIED" not in claim.coverage_verification_status


@pytest.mark.asyncio
async def test_12_claim_pinning_remains_stable_after_policy_changes(
    db_session, seed_canonical_policy
):
    """
    Test 12: Claim Pinning Stability.
      Create Claim 1 on Jan 10 -> Pins Coverage Version 1.
      Subsequent policy/coverage mutations occur (e.g. vehicle removed, new version added).
      Claim 1 must remain pinned to Coverage Version 1 without mutation.
    """
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]
    coverage_id = seed_canonical_policy["coverage_version_id"]

    # File Claim 1
    claim = await create_claim(
        session=db_session,
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        date_of_loss=date(2026, 1, 10),
        filed_at=datetime(2026, 1, 11, 0, 0, 0, tzinfo=UTC),
    )
    assert claim.coverage_version_id == coverage_id

    # Later: Vehicle is removed on Jan 15 (closing Coverage Version 1)
    await remove_vehicle(db_session, vehicle_id=vehicle_id, effective_date=date(2026, 1, 15))

    # Later: A new coverage version is added for the policy
    new_cv = CoverageVersion(
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        valid_from=date(2026, 2, 1),
        valid_to=None,
        coverage_type="Liability Only",
        liability_limit=Decimal("50000.00"),
        deductible=Decimal("1000.00"),
        version_label="Version 2",
    )
    db_session.add(new_cv)
    await db_session.commit()

    # Re-fetch Claim 1: Pinned coverage_version_id must NOT have changed
    refetched_claim = await get_claim_by_id(db_session, claim.id)
    assert refetched_claim is not None
    assert refetched_claim.coverage_version_id == coverage_id
    assert refetched_claim.coverage_version is not None
    assert refetched_claim.coverage_version.version_label == "Version 1"


@pytest.mark.asyncio
async def test_14_claim_date_of_loss_after_filed_at_rejected(db_session, seed_canonical_policy):
    """Test 14: Claim date of loss occurring after filing date is rejected with 422."""
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]

    # Loss is Feb 20, but filing is Feb 10
    loss_date = date(2026, 2, 20)
    filed_date = datetime(2026, 2, 10, 0, 0, 0, tzinfo=UTC)

    with pytest.raises(HTTPException) as exc_info:
        await create_claim(
            session=db_session,
            policy_id=policy_id,
            vehicle_id=vehicle_id,
            date_of_loss=loss_date,
            filed_at=filed_date,
        )

    assert exc_info.value.status_code == 422
    assert "cannot be after claim filing date" in exc_info.value.detail


@pytest.mark.asyncio
async def test_15_policy_vehicle_mismatch_rejected(db_session, seed_canonical_policy):
    """Test 15: Filing a claim with a vehicle that belongs to a different policy is rejected."""
    vehicle_id = seed_canonical_policy["vehicle_id"]

    # Create another policy #2
    other_policy = Policy(
        policy_number="OTHER-POLICY-9999",
        customer_name="Different Customer",
        status="ACTIVE",
    )
    db_session.add(other_policy)
    await db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await create_claim(
            session=db_session,
            policy_id=other_policy.id,  # Policy mismatch!
            vehicle_id=vehicle_id,      # Belongs to policy 1
            date_of_loss=date(2026, 1, 10),
        )

    assert exc_info.value.status_code == 422
    assert "does not belong to policy" in exc_info.value.detail


@pytest.mark.asyncio
async def test_claim_queries_for_policy(db_session, seed_canonical_policy):
    """Test retrieving claims list for a policy."""
    vehicle_id = seed_canonical_policy["vehicle_id"]
    policy_id = seed_canonical_policy["policy_id"]

    # Initially empty
    claims_initial = await get_claims_for_policy(db_session, policy_id)
    assert len(claims_initial) == 0

    # Create two claims
    await create_claim(db_session, policy_id, vehicle_id, date(2026, 1, 5))
    await create_claim(db_session, policy_id, vehicle_id, date(2026, 1, 10))

    claims_after = await get_claims_for_policy(db_session, policy_id)
    assert len(claims_after) == 2
