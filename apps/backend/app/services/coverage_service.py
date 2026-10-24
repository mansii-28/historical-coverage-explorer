"""
Coverage Service.
=================
Implements deterministic, effective-dated temporal coverage lookups
using half-open intervals [valid_from, valid_to).
"""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models import CoverageVersion
from app.schemas import CoverageLookupResponse, CoverageVersionResponse
from app.services.audit_service import record_audit_event

logger = get_logger("service.coverage")


async def get_coverage_on_date(
    session: AsyncSession,
    vehicle_id: int,
    target_date: date,
) -> CoverageVersion | None:
    """
    Deterministic historical coverage lookup for a specific date.

    Half-open interval semantics:
      valid_from <= target_date < valid_to
    If valid_to IS NULL, coverage remains open/active.
    """
    query = (
        select(CoverageVersion)
        .where(
            CoverageVersion.vehicle_id == vehicle_id,
            CoverageVersion.valid_from <= target_date,
            or_(
                CoverageVersion.valid_to.is_(None),
                target_date < CoverageVersion.valid_to,
            ),
        )
        .order_by(CoverageVersion.valid_from.desc())
    )
    result = await session.execute(query)
    return result.scalars().first()


async def check_coverage(
    session: AsyncSession,
    vehicle_id: int,
    date_of_loss: date,
    record_audit: bool = True,
    policy_id: int | None = None,
) -> CoverageLookupResponse:
    """
    Evaluates historical coverage for a given date of loss.
    Returns status COVERAGE_FOUND or REQUIRES_MANUAL_REVIEW.
    Never returns CLAIM_DENIED automatically.
    """
    logger.info(
        "coverage_lookup_started",
        vehicle_id=vehicle_id,
        requested_date=date_of_loss.isoformat(),
    )

    matched = await get_coverage_on_date(session, vehicle_id, date_of_loss)
    coverage_found = matched is not None
    verification_status = "COVERAGE_FOUND" if coverage_found else "REQUIRES_MANUAL_REVIEW"

    if coverage_found and matched:
        logger.info(
            "coverage_lookup_found",
            vehicle_id=vehicle_id,
            requested_date=date_of_loss.isoformat(),
            coverage_version_id=matched.id,
            coverage_type=matched.coverage_type,
        )
    else:
        logger.info(
            "coverage_lookup_not_found",
            vehicle_id=vehicle_id,
            requested_date=date_of_loss.isoformat(),
            verification_status="REQUIRES_MANUAL_REVIEW",
        )

    # Use matched policy_id if not explicitly provided
    resolved_policy_id = policy_id or (matched.policy_id if matched else None)

    if record_audit:
        # Audit event 1: Historical Coverage Lookup
        await record_audit_event(
            session=session,
            event_type="HISTORICAL_COVERAGE_LOOKUP",
            policy_id=resolved_policy_id,
            vehicle_id=vehicle_id,
            metadata_json={
                "vehicle_id": vehicle_id,
                "date_of_loss": date_of_loss.isoformat(),
            },
        )

        # Audit event 2: Historical Coverage Found / Not Found
        event_type = (
            "HISTORICAL_COVERAGE_FOUND" if coverage_found else "HISTORICAL_COVERAGE_NOT_FOUND"
        )
        await record_audit_event(
            session=session,
            event_type=event_type,
            policy_id=resolved_policy_id,
            vehicle_id=vehicle_id,
            metadata_json={
                "vehicle_id": vehicle_id,
                "date_of_loss": date_of_loss.isoformat(),
                "coverage_version_id": matched.id if matched else None,
                "result": verification_status,
            },
        )
        await session.commit()

    cv_response = CoverageVersionResponse.model_validate(matched) if matched else None

    return CoverageLookupResponse(
        coverage_found=coverage_found,
        coverage_version=cv_response,
        verification_status=verification_status,
        date_queried=date_of_loss,
        vehicle_id=vehicle_id,
    )


async def get_coverage_history(
    session: AsyncSession,
    vehicle_id: int,
) -> list[CoverageVersion]:
    """Retrieve all coverage versions for a vehicle ordered chronologically."""
    query = (
        select(CoverageVersion)
        .where(CoverageVersion.vehicle_id == vehicle_id)
        .order_by(CoverageVersion.valid_from.asc(), CoverageVersion.id.asc())
    )
    result = await session.execute(query)
    return list(result.scalars().all())


async def validate_coverage_overlap(
    session: AsyncSession,
    vehicle_id: int,
    new_from: date,
    new_to: date | None = None,
    exclude_version_id: int | None = None,
) -> None:
    """
    Validate that a coverage interval does not overlap with existing versions.
    Half-open interval overlap check:
      existing.valid_from < new_to (if new_to is set)
      AND (existing.valid_to IS NULL OR existing.valid_to > new_from)
    """
    query = select(CoverageVersion).where(CoverageVersion.vehicle_id == vehicle_id)
    if exclude_version_id is not None:
        query = query.where(CoverageVersion.id != exclude_version_id)

    result = await session.execute(query)
    existing_versions = result.scalars().all()

    for ev in existing_versions:
        # Check overlap
        ev_to = ev.valid_to
        # If new interval starts after existing ends, no overlap
        if ev_to is not None and new_from >= ev_to:
            continue
        # If existing interval starts after new ends, no overlap
        if new_to is not None and ev.valid_from >= new_to:
            continue

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Coverage interval [{new_from} -> {new_to or 'Present'}) overlaps with "
                f"existing version #{ev.id} [{ev.valid_from} -> {ev.valid_to or 'Present'})."
            ),
        )
