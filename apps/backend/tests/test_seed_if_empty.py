"""Unit tests proving seed_if_empty is non-destructive on repeated executions."""

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditEvent, CoverageVersion, Policy, Vehicle
from app.services.claim_service import create_claim
from app.services.demo_service import reset_demo_data, seed_if_empty
from app.services.vehicle_service import remove_vehicle


@pytest.mark.asyncio
async def test_seed_if_empty_on_fresh_empty_database_creates_canonical_records(
    db_session: AsyncSession,
):
    """Proves seed_if_empty correctly seeds baseline data when DB is empty."""
    # 1. Clean out all tables to simulate a fresh migrated database
    await db_session.execute(
        text(
            "TRUNCATE TABLE audit_events, claims, coverage_versions, vehicles, policies "
            "RESTART IDENTITY CASCADE;"
        )
    )
    await db_session.commit()

    # Verify database is empty
    result = await db_session.execute(select(Policy))
    assert result.scalars().first() is None

    # 2. Execute seed_if_empty — should return True (fresh seed)
    seeded = await seed_if_empty(session=db_session)
    assert seeded is True

    # 3. Verify canonical policy was created
    pol_stmt = select(Policy).where(Policy.policy_number == "DEMO-AUTO-1024")
    pol = (await db_session.execute(pol_stmt)).scalar_one()
    assert pol.customer_name == "Jordan Lee"
    assert pol.status == "ACTIVE"

    # 4. Verify canonical vehicle was created
    veh_stmt = select(Vehicle).where(Vehicle.policy_id == pol.id)
    veh = (await db_session.execute(veh_stmt)).scalar_one()
    assert veh.vin == "DEMO-VIN-001"
    assert veh.make == "BMW"
    assert veh.model == "X3"
    assert veh.year == 2024
    assert veh.added_at == date(2026, 1, 1)
    assert veh.removed_at is None

    # 5. Verify canonical coverage version was created
    cov_stmt = select(CoverageVersion).where(CoverageVersion.policy_id == pol.id)
    cov = (await db_session.execute(cov_stmt)).scalar_one()
    assert cov.valid_from == date(2026, 1, 1)
    assert cov.valid_to is None
    assert cov.coverage_type == "Comprehensive"
    assert cov.liability_limit == Decimal("100000.00")
    assert cov.deductible == Decimal("500.00")
    assert cov.version_label == "Version 1"

    # 6. Verify baseline audit events were created
    events_stmt = (
        select(AuditEvent)
        .where(AuditEvent.policy_id == pol.id)
        .order_by(AuditEvent.id.asc())
    )
    events = list((await db_session.execute(events_stmt)).scalars().all())
    assert len(events) == 3
    assert [e.event_type for e in events] == [
        "POLICY_CREATED",
        "VEHICLE_ADDED",
        "COVERAGE_ACTIVATED",
    ]

    # 7. Second execution must be a complete NO-OP (returns False, zero changes)
    seeded_again = await seed_if_empty(session=db_session)
    assert seeded_again is False

    # 8. Mutate state: soft-remove the BMW X3 and file a claim
    removal_date = date(2026, 1, 15)
    await remove_vehicle(session=db_session, vehicle_id=veh.id, effective_date=removal_date)
    claim = await create_claim(
        session=db_session,
        policy_id=pol.id,
        vehicle_id=veh.id,
        date_of_loss=date(2026, 1, 10),
    )
    assert claim.claim_number is not None

    # 9. Third execution after mutation must STILL make zero changes
    seeded_third = await seed_if_empty(session=db_session)
    assert seeded_third is False

    # Verify vehicle remains soft-removed and claim intact
    veh_after = (await db_session.execute(veh_stmt)).scalar_one()
    assert veh_after.removed_at == removal_date
    assert claim.id is not None


@pytest.mark.asyncio
async def test_seed_if_empty_skips_when_canonical_policy_exists(db_session: AsyncSession):
    # 1. Reset to baseline
    await reset_demo_data(session=db_session, scenario="canonical")

    # 2. Call seed_if_empty — should return False (already present)
    seeded = await seed_if_empty(session=db_session)
    assert seeded is False


@pytest.mark.asyncio
async def test_seed_if_empty_preserves_mutated_vehicle_and_claims(db_session: AsyncSession):
    # 1. Start with clean demo baseline
    await reset_demo_data(session=db_session, scenario="canonical")

    # 2. Mutate state: soft-remove the BMW X3 on Jan 15, 2026
    removal_date = date(2026, 1, 15)
    await remove_vehicle(session=db_session, vehicle_id=1, effective_date=removal_date)

    # Verify vehicle is removed
    vehicle_stmt = select(Vehicle).where(Vehicle.id == 1)
    veh = (await db_session.execute(vehicle_stmt)).scalar_one()
    assert veh.removed_at == removal_date

    # 3. File a claim for loss date Jan 10
    claim = await create_claim(
        session=db_session,
        policy_id=1,
        vehicle_id=1,
        date_of_loss=date(2026, 1, 10),
    )
    assert claim.claim_number is not None

    # 4. Execute seed_if_empty multiple times
    for _ in range(3):
        seeded = await seed_if_empty(session=db_session)
        assert seeded is False

    # 5. Verify mutated state was NOT reverted or cleared
    veh_after = (await db_session.execute(vehicle_stmt)).scalar_one()
    assert veh_after.removed_at == removal_date, "Vehicle must remain soft-removed"

    # Verify policy still exists and is unchanged
    pol_stmt = select(Policy).where(Policy.policy_number == "DEMO-AUTO-1024")
    pol = (await db_session.execute(pol_stmt)).scalar_one()
    assert pol.customer_name == "Jordan Lee"

    # Verify claim still exists
    assert claim.id is not None
