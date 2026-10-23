"""
Claim Service.
==============
Implements deterministic claim creation, date_of_loss coverage verification,
historical coverage version pinning, and immutable audit event logging.
"""

from datetime import UTC, date, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Claim, Policy, Vehicle
from app.services.audit_service import record_audit_event
from app.services.coverage_service import get_coverage_on_date


async def get_claim_by_id(session: AsyncSession, claim_id: int) -> Claim | None:
    """Retrieve claim with relationships eager loaded."""
    query = (
        select(Claim)
        .options(
            selectinload(Claim.coverage_version),
            selectinload(Claim.vehicle),
        )
        .where(Claim.id == claim_id)
    )
    result = await session.execute(query)
    return result.scalars().first()


async def get_claims_for_policy(
    session: AsyncSession,
    policy_id: int,
) -> list[Claim]:
    """Retrieve all claims for a policy ordered by date_of_loss / id."""
    query = (
        select(Claim)
        .options(
            selectinload(Claim.coverage_version),
            selectinload(Claim.vehicle),
        )
        .where(Claim.policy_id == policy_id)
        .order_by(Claim.id.asc())
    )
    result = await session.execute(query)
    return list(result.scalars().all())


async def create_claim(
    session: AsyncSession,
    policy_id: int,
    vehicle_id: int,
    date_of_loss: date,
    filed_at: datetime | None = None,
) -> Claim:
    """
    Atomic Claim Creation Workflow:
    1. Validate policy and vehicle.
    2. Ensure vehicle belongs to policy.
    3. Evaluate historical coverage at date_of_loss.
    4. Pin coverage_version_id if found.
    5. If no coverage, set REQUIRES_MANUAL_REVIEW (never automated denial).
    6. Record immutable domain audit events.
    7. Commit transaction.
    """
    if filed_at is None:
        filed_at = datetime.now(UTC)

    # 1. Validate Policy
    policy_res = await session.execute(select(Policy).where(Policy.id == policy_id))
    policy = policy_res.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy #{policy_id} not found.",
        )

    # 2. Validate Vehicle
    vehicle_res = await session.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = vehicle_res.scalars().first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle #{vehicle_id} not found.",
        )

    if vehicle.policy_id != policy_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Vehicle #{vehicle_id} does not belong to policy #{policy_id}.",
        )

    # 3. Deterministic Historical Coverage Lookup using date_of_loss
    matched_coverage = await get_coverage_on_date(session, vehicle_id, date_of_loss)

    if matched_coverage:
        coverage_version_id = matched_coverage.id
        coverage_verification_status = "COVERAGE_FOUND"
        claim_status = "SUBMITTED"
    else:
        coverage_version_id = None
        coverage_verification_status = "REQUIRES_MANUAL_REVIEW"
        claim_status = "MANUAL_REVIEW"

    # 4. Generate next claim number: DEMO-CLM-XXXX
    count_res = await session.execute(select(func.count(Claim.id)))
    existing_claims_count = count_res.scalar_one()
    claim_number = f"DEMO-CLM-{existing_claims_count + 1:04d}"

    claim = Claim(
        claim_number=claim_number,
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        date_of_loss=date_of_loss,
        filed_at=filed_at,
        coverage_version_id=coverage_version_id,
        coverage_verification_status=coverage_verification_status,
        status=claim_status,
    )
    session.add(claim)
    await session.flush()  # Populates claim.id

    # 5. Record Audit Events
    # Event: CLAIM_CREATED
    await record_audit_event(
        session=session,
        event_type="CLAIM_CREATED",
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        claim_id=claim.id,
        metadata_json={
            "claim_number": claim.claim_number,
            "date_of_loss": date_of_loss.isoformat(),
            "filed_at": filed_at.isoformat(),
            "coverage_verification_status": coverage_verification_status,
        },
    )

    if matched_coverage:
        # Event: CLAIM_LINKED_TO_COVERAGE_VERSION
        await record_audit_event(
            session=session,
            event_type="CLAIM_LINKED_TO_COVERAGE_VERSION",
            policy_id=policy_id,
            vehicle_id=vehicle_id,
            claim_id=claim.id,
            metadata_json={
                "claim_number": claim.claim_number,
                "coverage_version_id": matched_coverage.id,
                "version_label": matched_coverage.version_label,
                "liability_limit": str(matched_coverage.liability_limit),
                "deductible": str(matched_coverage.deductible),
            },
        )
    else:
        # Event: CLAIM_SENT_TO_MANUAL_REVIEW
        await record_audit_event(
            session=session,
            event_type="CLAIM_SENT_TO_MANUAL_REVIEW",
            policy_id=policy_id,
            vehicle_id=vehicle_id,
            claim_id=claim.id,
            metadata_json={
                "claim_number": claim.claim_number,
                "date_of_loss": date_of_loss.isoformat(),
                "reason": (
                    "No coverage version active on date of loss; "
                    "routed to claims examiner for manual review."
                ),
            },
        )

    await session.commit()
    # Refresh to load relationships
    return await get_claim_by_id(session, claim.id)  # type: ignore
