"""
API Endpoints & Integration Tests.
==================================
Tests all public FastAPI endpoints through AsyncClient, verifying response schemas,
status codes, error formats, demo reset idempotency, and correlation ID propagation.
"""


import pytest
from httpx import AsyncClient

from app.services.demo_service import reset_demo_data


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Verifies GET /health returns 200 OK and database connectivity."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_18_demo_reset_idempotency(client: AsyncClient, db_session):
    """
    Test 18: Reset idempotency.
    Running reset multiple times produces the exact same canonical baseline
    without duplicate records or sequence drift.
    """
    # First reset
    res1 = await client.post("/api/demo/reset")
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["policy_id"] == 1
    assert d1["vehicle_id"] == 1
    assert d1["coverage_version_id"] == 1

    # Second reset
    res2 = await client.post("/api/demo/reset")
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["policy_id"] == 1
    assert d2["vehicle_id"] == 1
    assert d2["coverage_version_id"] == 1

    # Reset with versioned scenario
    res3 = await client.post("/api/demo/reset?scenario=versioned")
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["scenario"] == "versioned"
    assert d3["policy_id"] == 1


@pytest.mark.asyncio
async def test_api_correlation_id_propagation(client: AsyncClient):
    """Verifies that inbound X-Correlation-ID is echoed back on HTTP responses."""
    custom_trace_id = "trace-test-xyz-987"
    response = await client.get("/health", headers={"X-Correlation-ID": custom_trace_id})
    assert response.status_code == 200
    assert response.headers.get("X-Correlation-ID") == custom_trace_id

    # When no header is supplied, a UUID is automatically generated
    res_auto = await client.get("/health")
    assert "X-Correlation-ID" in res_auto.headers
    assert len(res_auto.headers["X-Correlation-ID"]) > 10


@pytest.mark.asyncio
async def test_api_policy_and_vehicles(client: AsyncClient, db_session):
    """Verifies policy read and vehicle listing endpoints."""
    await reset_demo_data(db_session, "canonical")

    # Read policy
    res_pol = await client.get("/api/policies/1")
    assert res_pol.status_code == 200
    pdata = res_pol.json()
    assert pdata["id"] == 1
    assert pdata["policy_number"] == "DEMO-AUTO-1024"
    assert pdata["customer_name"] == "Jordan Lee"
    assert pdata["status"] == "ACTIVE"

    # List vehicles
    res_veh = await client.get("/api/policies/1/vehicles?include_removed=true")
    assert res_veh.status_code == 200
    vdata = res_veh.json()
    assert len(vdata) == 1
    assert vdata[0]["vin"] == "DEMO-VIN-001"
    assert vdata[0]["is_active"] is True


@pytest.mark.asyncio
async def test_api_vehicle_removal_and_coverage(client: AsyncClient, db_session):
    """Verifies vehicle removal and point-in-time coverage lookup APIs."""
    await reset_demo_data(db_session, "canonical")

    # Historical coverage before removal: Jan 10
    cov_res1 = await client.get("/api/vehicles/1/coverage?as_of=2026-01-10")
    assert cov_res1.status_code == 200
    assert cov_res1.json()["verification_status"] == "COVERAGE_FOUND"

    # Remove vehicle effective Jan 15
    rem_res = await client.post("/api/vehicles/1/remove", json={"effective_date": "2026-01-15"})
    assert rem_res.status_code == 200
    assert rem_res.json()["removed_at"] == "2026-01-15"

    # Attempting removal again -> 409 Conflict
    rem_dup = await client.post("/api/vehicles/1/remove", json={"effective_date": "2026-01-20"})
    assert rem_dup.status_code == 409

    # Historical coverage after removal date: Jan 20 -> REQUIRES_MANUAL_REVIEW
    cov_res2 = await client.get("/api/vehicles/1/coverage?as_of=2026-01-20")
    assert cov_res2.status_code == 200
    assert cov_res2.json()["verification_status"] == "REQUIRES_MANUAL_REVIEW"
    assert cov_res2.json()["coverage_version"] is None

    # Coverage history endpoint
    hist_res = await client.get("/api/vehicles/1/coverage-history")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 1
    assert hist_res.json()[0]["valid_to"] == "2026-01-15"


@pytest.mark.asyncio
async def test_api_claims_workflow(client: AsyncClient, db_session):
    """Verifies claim creation for both covered and uncovered loss dates."""
    await reset_demo_data(db_session, "canonical")
    await client.post("/api/vehicles/1/remove", json={"effective_date": "2026-01-15"})

    # Covered claim (Jan 10)
    clm_res1 = await client.post(
        "/api/claims",
        json={
            "policy_id": 1,
            "vehicle_id": 1,
            "date_of_loss": "2026-01-10",
            "filed_at": "2026-02-10T00:00:00Z",
        },
    )
    assert clm_res1.status_code == 201
    c1 = clm_res1.json()
    assert c1["coverage_version_id"] == 1
    assert c1["coverage_verification_status"] == "COVERAGE_FOUND"
    assert c1["status"] == "SUBMITTED"

    # Uncovered claim (Jan 20) -> Manual Review
    clm_res2 = await client.post(
        "/api/claims",
        json={
            "policy_id": 1,
            "vehicle_id": 1,
            "date_of_loss": "2026-01-20",
            "filed_at": "2026-02-10T00:00:00Z",
        },
    )
    assert clm_res2.status_code == 201
    c2 = clm_res2.json()
    assert c2["coverage_version_id"] is None
    assert c2["coverage_verification_status"] == "REQUIRES_MANUAL_REVIEW"
    assert c2["status"] == "MANUAL_REVIEW"

    # Read claim by ID
    get_clm = await client.get(f"/api/claims/{c1['id']}")
    assert get_clm.status_code == 200
    assert get_clm.json()["claim_number"] == c1["claim_number"]


@pytest.mark.asyncio
async def test_api_audit_and_pdf(client: AsyncClient, db_session):
    """Verifies audit trail listing and PDF download route."""
    await reset_demo_data(db_session, "canonical")

    # Audit events
    audit_res = await client.get("/api/policies/1/audit-events")
    assert audit_res.status_code == 200
    events = audit_res.json()
    assert len(events) >= 3
    assert any(e["event_type"] == "POLICY_CREATED" for e in events)

    # PDF download
    pdf_res = await client.get("/api/coverage/1/proof.pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("content-type") == "application/pdf"
    assert len(pdf_res.content) > 1000
    assert b"%PDF" in pdf_res.content
