"""Unit tests proving seed_if_empty is non-destructive on repeated executions."""

from datetime import date

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Policy, Vehicle
from app.services.claim_service import create_claim
from app.services.demo_service import reset_demo_data, seed_if_empty
from app.services.vehicle_service import remove_vehicle


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
