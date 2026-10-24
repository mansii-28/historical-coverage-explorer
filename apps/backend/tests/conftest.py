"""
Pytest Configuration & Fixtures.
=================================
Configures an isolated PostgreSQL test database environment.
Enforces strict database name safety checks to prevent accidental operations
against production or local development databases.
"""

import os
from collections.abc import AsyncGenerator
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import make_url, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import CoverageVersion, Policy, Vehicle
from app.services.audit_service import record_audit_event

# ─── 1. Strict Test Database Safety Guard ──────────────────────────────────────
# The test database URL must be explicitly configured or defaulted to historical_coverage_test.
# Refinement 1: Fail fast unless the database name clearly contains 'test'.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://hce_user:changeme@localhost:5432/historical_coverage_test",
)

parsed_url = make_url(TEST_DATABASE_URL)
db_name = (parsed_url.database or "").lower()

if "test" not in db_name:
    raise RuntimeError(
        f"CRITICAL SAFETY VIOLATION: Database '{parsed_url.database}' lacks 'test'! "
        f"Refusing to run against non-test databases to protect development data."
    )

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(autouse=True)
async def initialize_test_database():
    """Ensure all tables exist in the isolated test database."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a transactional test session and truncate tables upon completion."""
    async with TestSessionLocal() as session:
        # Truncate tables with cascade before every test for absolute isolation
        await session.execute(
            text(
                "TRUNCATE TABLE audit_events, claims, coverage_versions, vehicles, policies "
                "RESTART IDENTITY CASCADE;"
            )
        )
        await session.commit()
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client wired to the FastAPI application overriding get_db with the test session."""

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def seed_canonical_policy(db_session: AsyncSession) -> dict[str, int]:
    """Seed the canonical Jordan Lee / 2024 BMW X3 / Version 1 baseline."""
    now_utc = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)

    policy = Policy(
        policy_number="DEMO-AUTO-1024",
        customer_name="Jordan Lee",
        status="ACTIVE",
        created_at=now_utc,
        updated_at=now_utc,
    )
    db_session.add(policy)
    await db_session.flush()

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
    db_session.add(vehicle)
    await db_session.flush()

    coverage = CoverageVersion(
        policy_id=policy.id,
        vehicle_id=vehicle.id,
        valid_from=date(2026, 1, 1),
        valid_to=None,  # Open-ended
        coverage_type="Comprehensive",
        liability_limit=Decimal("100000.00"),
        deductible=Decimal("500.00"),
        version_label="Version 1",
        created_at=now_utc,
    )
    db_session.add(coverage)
    await db_session.flush()

    await record_audit_event(
        session=db_session,
        event_type="POLICY_CREATED",
        policy_id=policy.id,
        event_timestamp=now_utc,
        metadata_json={"policy_number": policy.policy_number},
    )
    await db_session.commit()

    return {
        "policy_id": policy.id,
        "vehicle_id": vehicle.id,
        "coverage_version_id": coverage.id,
    }
