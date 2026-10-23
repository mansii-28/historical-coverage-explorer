"""
Demo Reset & Seeding Service.
=============================
Provides deterministic, repeatable reset of the database to the canonical demo baseline
or the advanced multi-version scenario.
"""

from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CoverageVersion, Policy, Vehicle
from app.schemas import DemoResetResponse
from app.services.audit_service import record_audit_event


async def reset_demo_data(
    session: AsyncSession,
    scenario: Literal["canonical", "versioned"] = "canonical",
) -> DemoResetResponse:
    """
    Reset demo domain records and reseed canonical Jordan Lee baseline.
    Safe to execute repeatedly.
    """
    # ─── 1. Explicitly Purge Demo Domain Records & Reset Sequences ──────────
    # Note: Demo reset intentionally clears synthetic prototype data.
    # This behavior is not representative of production retention.
    # Tables are explicitly cleared child-first, restarting identity keys.
    await session.execute(
        text(
            "TRUNCATE TABLE audit_events, claims, coverage_versions, vehicles, policies "
            "RESTART IDENTITY CASCADE;"
        )
    )
    await session.flush()

    now_utc = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)

    # ─── 2. Seed Policy ───────────────────────────────────────────────────
    policy = Policy(
        policy_number="DEMO-AUTO-1024",
        customer_name="Jordan Lee",
        status="ACTIVE",
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(policy)
    await session.flush()

    # ─── 3. Seed Vehicle ──────────────────────────────────────────────────
    vehicle = Vehicle(
        policy_id=policy.id,
        vin="DEMO-VIN-001",
        make="BMW",
        model="X3",
        year=2024,
        added_at=date(2026, 1, 1),
        removed_at=None,
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(vehicle)
    await session.flush()

    # ─── 4. Seed Coverage Version(s) ──────────────────────────────────────
    first_coverage_id: int

    if scenario == "versioned":
        # Advanced multi-version scenario
        cv1 = CoverageVersion(
            policy_id=policy.id,
            vehicle_id=vehicle.id,
            valid_from=date(2026, 1, 1),
            valid_to=date(2026, 1, 8),
            coverage_type="Comprehensive",
            liability_limit=Decimal("100000.00"),
            deductible=Decimal("1000.00"),
            version_label="Version 1",
            created_at=now_utc,
        )
        session.add(cv1)
        await session.flush()
        first_coverage_id = cv1.id

        cv2 = CoverageVersion(
            policy_id=policy.id,
            vehicle_id=vehicle.id,
            valid_from=date(2026, 1, 8),
            valid_to=date(2026, 1, 15),
            coverage_type="Comprehensive",
            liability_limit=Decimal("100000.00"),
            deductible=Decimal("500.00"),
            version_label="Version 2",
            created_at=datetime(2026, 1, 8, 0, 0, 0, tzinfo=UTC),
        )
        session.add(cv2)
        await session.flush()
    else:
        # Canonical baseline: single active coverage from Jan 1
        cv = CoverageVersion(
            policy_id=policy.id,
            vehicle_id=vehicle.id,
            valid_from=date(2026, 1, 1),
            valid_to=None,
            coverage_type="Comprehensive",
            liability_limit=Decimal("100000.00"),
            deductible=Decimal("500.00"),
            version_label="Version 1",
            created_at=now_utc,
        )
        session.add(cv)
        await session.flush()
        first_coverage_id = cv.id

    # ─── 5. Seed Baseline Audit Events ────────────────────────────────────
    await record_audit_event(
        session=session,
        event_type="POLICY_CREATED",
        policy_id=policy.id,
        event_timestamp=now_utc,
        metadata_json={
            "policy_number": policy.policy_number,
            "customer_name": policy.customer_name,
        },
    )

    await record_audit_event(
        session=session,
        event_type="VEHICLE_ADDED",
        policy_id=policy.id,
        vehicle_id=vehicle.id,
        event_timestamp=datetime(2026, 1, 1, 0, 1, 0, tzinfo=UTC),
        metadata_json={
            "vin": vehicle.vin,
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
        },
    )

    await record_audit_event(
        session=session,
        event_type="COVERAGE_ACTIVATED",
        policy_id=policy.id,
        vehicle_id=vehicle.id,
        event_timestamp=datetime(2026, 1, 1, 0, 2, 0, tzinfo=UTC),
        metadata_json={
            "coverage_type": "Comprehensive",
            "liability_limit": "100000.00",
            "deductible": "500.00" if scenario != "versioned" else "1000.00",
            "valid_from": "2026-01-01",
        },
    )

    await session.commit()

    return DemoResetResponse(
        message=f"Demo state successfully reset to {scenario} baseline.",
        policy_id=policy.id,
        vehicle_id=vehicle.id,
        coverage_version_id=first_coverage_id,
        scenario=scenario,
    )
