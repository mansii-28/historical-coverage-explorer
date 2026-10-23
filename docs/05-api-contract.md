# API Contract

> **Prototype:** Historical Coverage Explorer
> **Document:** docs/05-api-contract.md
> **Status:** Phase 3 Complete (All endpoints live against FastAPI + PostgreSQL)

Legend: ✅ Implemented & Verified

---

## Base URL

```
http://localhost:8000
```

Interactive documentation: `http://localhost:8000/api/docs` (Swagger UI)

---

## Health

### `GET /health` ✅

Returns service health including database connectivity.

**Response 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "service": "historical-coverage-explorer",
  "version": "0.1.0",
  "disclaimer": "Concept prototype built as a product and engineering thought exercise. Uses synthetic data only and does not represent any company's production architecture."
}
```

**`status`** values: `ok` | `degraded`
**`database`** values: `connected` | `unavailable`

---

## Demo Reset

### `POST /api/demo/reset` ✅

Drops and re-seeds all demo data with sequence restart. Supports query param `scenario=canonical` (default) or `scenario=versioned`. Returns canonical baseline state.

**Response 200:**
```json
{
  "message": "Demo state successfully reset to canonical baseline.",
  "policy_id": 1,
  "vehicle_id": 1,
  "coverage_version_id": 1,
  "scenario": "canonical"
}
```

---

## Policies

### `GET /api/policies/{policy_id}` ✅

Returns full policy details.

**Response 200:**
```json
{
  "id": 1,
  "policy_number": "DEMO-AUTO-1024",
  "customer_name": "Jordan Lee",
  "status": "ACTIVE",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-15T00:00:00Z"
}
```

---

## Vehicles

### `GET /api/policies/{policy_id}/vehicles` ✅

Returns vehicles on the policy.

Query params:
- `include_removed=false` (default) — active only
- `include_removed=true` — all vehicles including removed

**Response 200:**
```json
[
  {
    "id": 1,
    "policy_id": 1,
    "vin": "DEMO-VIN-001",
    "make": "BMW",
    "model": "X3",
    "year": 2024,
    "added_at": "2026-01-01",
    "removed_at": null,
    "is_active": true
  }
]
```

### `GET /api/vehicles/{vehicle_id}` ✅

Returns a single vehicle by ID (regardless of removed status).

### `POST /api/vehicles/{vehicle_id}/remove` ✅

Removes a vehicle from the active policy. Transactionally:
1. Sets `vehicle.removed_at = effective_date`
2. Sets current `CoverageVersion.valid_to = effective_date`
3. Writes audit events

**Request body:**
```json
{
  "effective_date": "2026-01-15"
}
```

**Response 200:**
```json
{
  "message": "Vehicle removed successfully.",
  "vehicle_id": 1,
  "removed_at": "2026-01-15",
  "closed_coverage_version_id": 1
}
```

**Errors:**
- `404` — Vehicle not found
- `422` — Vehicle already removed
- `422` — Effective date is before coverage start date

---

## Coverage

### `GET /api/vehicles/{vehicle_id}/coverage-history` ✅

Returns all coverage versions for a vehicle, ordered by `valid_from`.

**Response 200:**
```json
[
  {
    "id": 1,
    "policy_id": 1,
    "vehicle_id": 1,
    "valid_from": "2026-01-01",
    "valid_to": "2026-01-15",
    "coverage_type": "Comprehensive",
    "liability_limit": "100000.00",
    "deductible": "500.00",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

### `GET /api/vehicles/{vehicle_id}/coverage?as_of=2026-01-10` ✅

Returns the single coverage version active on the given date, or 404 if none.

Uses the query:
```
valid_from <= as_of AND (valid_to IS NULL OR as_of < valid_to)
```

### `POST /api/coverage/check` ✅

Performs a historical coverage lookup without creating a claim.

**Request body:**
```json
{
  "vehicle_id": 1,
  "date_of_loss": "2026-01-10"
}
```

**Response 200:**
```json
{
  "coverage_found": true,
  "coverage_version": {
    "id": 1,
    "valid_from": "2026-01-01",
    "valid_to": "2026-01-15",
    "coverage_type": "Comprehensive",
    "liability_limit": "100000.00",
    "deductible": "500.00"
  }
}
```

---

## Claims

### `POST /api/claims` ✅

Creates a claim. Performs historical coverage lookup using `date_of_loss`.

**Request body:**
```json
{
  "policy_id": 1,
  "vehicle_id": 1,
  "date_of_loss": "2026-01-10",
  "filed_at": "2026-02-10T00:00:00Z"
}
```

**Response 201:**
```json
{
  "id": 1,
  "claim_number": "CLM-2026-001",
  "policy_id": 1,
  "vehicle_id": 1,
  "date_of_loss": "2026-01-10",
  "filed_at": "2026-02-10T00:00:00Z",
  "coverage_version_id": 1,
  "coverage_verification_status": "COVERAGE_FOUND",
  "status": "OPEN",
  "created_at": "2026-10-22T00:00:00Z"
}
```

**`coverage_verification_status`** values:
- `COVERAGE_FOUND` — Automated match found; `coverage_version_id` is set
- `NO_COVERAGE_FOUND` — Lookup returned no result (reserved for future use)
- `REQUIRES_MANUAL_REVIEW` — No automated match; `coverage_version_id` is NULL; claim proceeds for human review

### `GET /api/claims/{claim_id}` ✅

Returns a single claim with its pinned coverage version.

---

## Audit

### `GET /api/policies/{policy_id}/audit-events` ✅

Returns all audit events for a policy, ordered by `event_timestamp` ascending.

**Response 200:**
```json
[
  {
    "id": 1,
    "policy_id": 1,
    "vehicle_id": 1,
    "claim_id": null,
    "event_type": "POLICY_CREATED",
    "event_timestamp": "2026-01-01T00:00:00Z",
    "metadata_json": {},
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

## Proof of Insurance

### `GET /api/coverage/{coverage_version_id}/proof.pdf` ✅

Returns a DEMO ONLY PDF proof-of-insurance document for the given coverage version.

- Content-Type: `application/pdf`
- The PDF will visibly contain: `DEMO ONLY - NOT A REAL INSURANCE DOCUMENT`

---

## Error Format

All error responses follow FastAPI's standard format:

```json
{
  "detail": "Human-readable error description"
}
```

Common HTTP status codes used:
- `200` — Success
- `201` — Created
- `404` — Resource not found
- `422` — Validation error (Pydantic) or business rule violation
- `500` — Unexpected server error
