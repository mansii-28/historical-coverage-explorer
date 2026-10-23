# Backend Integration Guide

> **Prototype:** Historical Coverage Explorer  
> **Document:** docs/07-backend-integration.md  
> **Status:** Phase 3 Complete  

---

## 1. Overview & Architecture

Phase 3 transitions the Historical Coverage Explorer prototype from an in-memory mock client experience into a fully persistent, transactional, three-tier architecture:

```
┌────────────────────────────────────────────────────────┐
│            Browser Frontend (React 19 + TypeScript)    │
│            • PolicyDashboard  • FileClaimModal         │
│            • PastVehicles     • AuditTimeline          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / PDF Streams
                            ▼
┌────────────────────────────────────────────────────────┐
│            FastAPI Backend (Python 3.12)               │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │     API Routers       │  │    Domain Services    │  │
│  │ • /api/policies       │  │ • CoverageService     │  │
│  │ • /api/vehicles       │  │ • VehicleService      │  │
│  │ • /api/claims         │  │ • ClaimService        │  │
│  │ • /api/demo/reset     │  │ • DocumentService     │  │
│  │ • /api/coverage       │  │ • AuditService        │  │
│  └───────────────────────┘  └───────────────────────┘  │
│               │ SQLAlchemy 2.x Async ORM               │
└───────────────┼────────────────────────────────────────┘
                │ psycopg (async) connection pool
                ▼
┌────────────────────────────────────────────────────────┐
│            PostgreSQL 14+ Database                     │
│            (Validated locally on 14; Compose uses 16)  │
│            • policies           • vehicles             │
│            • coverage_versions  • claims               │
│            • audit_events (JSONB)                      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema & Tables

All database schema definitions are managed through Alembic migration `e1aeef35ef22`.

### Tables and Relationships

1. **`policies`**
   - `id`: BigInteger Primary Key (Identity)
   - `policy_number`: VARCHAR(64) Unique Indexed
   - `customer_name`: VARCHAR(255)
   - `status`: VARCHAR(32) (`ACTIVE`, `CANCELLED`)
   - `created_at`, `updated_at`: TIMESTAMPTZ

2. **`vehicles`**
   - `id`: BigInteger Primary Key (Identity)
   - `policy_id`: BigInteger Foreign Key → `policies.id` (`RESTRICT` — policies cannot be deleted if vehicles exist)
   - `vin`: VARCHAR(64)
   - `make`: VARCHAR(64)
   - `model`: VARCHAR(64)
   - `year`: INTEGER
   - `added_at`: DATE
   - `removed_at`: DATE Nullable (`NULL` indicates actively covered vehicle)
   - `created_at`, `updated_at`: TIMESTAMPTZ
   - *Indexes:* `ix_vehicles_policy_id`, `ix_vehicles_policy_removed (policy_id, removed_at)`

3. **`coverage_versions`**
   - `id`: BigInteger Primary Key (Identity)
   - `policy_id`: BigInteger Foreign Key → `policies.id` (`RESTRICT`)
   - `vehicle_id`: BigInteger Foreign Key → `vehicles.id` (`RESTRICT` — vehicles cannot be deleted if coverage history exists)
   - `valid_from`: DATE
   - `valid_to`: DATE Nullable (`NULL` indicates indefinite/open-ended coverage)
   - `coverage_type`: VARCHAR(64) (`Comprehensive`, `Collision`, `Liability Only`)
   - `liability_limit`: NUMERIC(12, 2)
   - `deductible`: NUMERIC(10, 2)
   - `version_label`: VARCHAR(64) (`Version 1`, `Version 2`)
   - `created_at`: TIMESTAMPTZ
   - *Check Constraint:* `ck_coverage_versions_valid_range`: `valid_to IS NULL OR valid_to > valid_from`
   - *Indexes:* `ix_coverage_lookup (vehicle_id, valid_from, valid_to)`

4. **`claims`**
   - `id`: BigInteger Primary Key (Identity)
   - `claim_number`: VARCHAR(64) Unique Indexed
   - `policy_id`: BigInteger Foreign Key → `policies.id` (`RESTRICT`)
   - `vehicle_id`: BigInteger Foreign Key → `vehicles.id` (`RESTRICT`)
   - `date_of_loss`: DATE
   - `filed_at`: TIMESTAMPTZ
   - `coverage_version_id`: BigInteger Foreign Key → `coverage_versions.id` Nullable (`RESTRICT` — claims protect pinned coverage versions from deletion)
   - `coverage_verification_status`: VARCHAR(64) (`COVERAGE_FOUND`, `REQUIRES_MANUAL_REVIEW`)
   - `status`: VARCHAR(32) (`SUBMITTED`, `MANUAL_REVIEW`, `OPEN`)
   - `created_at`, `updated_at`: TIMESTAMPTZ
   - *Indexes:* `ix_claims_vehicle_date_of_loss (vehicle_id, date_of_loss)`

5. **`audit_events`**
   - `id`: BigInteger Primary Key (Identity)
   - `policy_id`: BigInteger Foreign Key Nullable (`SET NULL` — audit records survive independently)
   - `vehicle_id`: BigInteger Foreign Key Nullable (`SET NULL` — audit records survive independently)
   - `claim_id`: BigInteger Foreign Key Nullable (`SET NULL` — audit records survive independently)
   - `event_type`: VARCHAR(64) Indexed
   - `event_timestamp`: TIMESTAMPTZ
   - `metadata_json`: JSONB
   - `created_at`: TIMESTAMPTZ
   - *Indexes:* `ix_audit_events_policy_timestamp (policy_id, event_timestamp)`

---

## 3. Transaction Boundaries & Domain Workflows

### A. Vehicle Removal Transaction (`VehicleService.remove_vehicle`)
Removing a vehicle modifies state across three tables and must occur within a single atomic database transaction:

```text
BEGIN TRANSACTION
  1. Load Vehicle with SELECT FOR UPDATE.
  2. Validate: vehicle exists, policy_id matches, vehicle.removed_at is NULL.
  3. Validate: effective_date >= vehicle.added_at.
  4. Find open CoverageVersion (valid_to IS NULL).
  5. Validate: effective_date >= open CoverageVersion.valid_from.
  6. Record AuditEvent: VEHICLE_REMOVAL_REQUESTED.
  7. Update Vehicle: set removed_at = effective_date.
  8. Update CoverageVersion: set valid_to = effective_date.
  9. Record AuditEvent: COVERAGE_CLOSED.
 10. Record AuditEvent: VEHICLE_REMOVED.
COMMIT TRANSACTION
```
If any validation fails or a database exception occurs, the entire transaction is rolled back, preventing orphaned active coverage or soft-deleted vehicles without closed intervals.

### B. Point-in-Time Historical Coverage Lookup (`CoverageService.lookup_coverage_as_of`)
Historical coverage lookup uses deterministic half-open interval comparison `[valid_from, valid_to)`:

```sql
SELECT *
FROM coverage_versions
WHERE vehicle_id = :vehicle_id
  AND valid_from <= :as_of_date
  AND (valid_to IS NULL OR :as_of_date < valid_to)
LIMIT 1;
```
- For **January 10, 2026** (interval `2026-01-01` to `2026-01-15`): Returns `COVERAGE_FOUND` and Coverage Version 1.
- For **January 20, 2026** (after vehicle removal): Returns `REQUIRES_MANUAL_REVIEW` and `coverage: null`.

### C. Claim Creation & Coverage Version Pinning (`ClaimService.create_claim`)
Claims are evaluated strictly using `date_of_loss` (never the claim submission date `filed_at`):

```text
BEGIN TRANSACTION
  1. Validate vehicle and policy relationship.
  2. Validate: date_of_loss <= filed_at (cannot file for future incidents).
  3. Perform deterministic coverage lookup for vehicle_id on date_of_loss.
  4. Generate sequential claim number: DEMO-CLM-XXXX.
  5. If coverage match is found:
       - claim.coverage_version_id = matched_version.id (PINNED)
       - claim.coverage_verification_status = COVERAGE_FOUND
       - claim.status = SUBMITTED
       - Record AuditEvent: CLAIM_CREATED
       - Record AuditEvent: CLAIM_LINKED_TO_COVERAGE_VERSION
  6. If no coverage match is found:
       - claim.coverage_version_id = NULL
       - claim.coverage_verification_status = REQUIRES_MANUAL_REVIEW
       - claim.status = MANUAL_REVIEW
       - Record AuditEvent: CLAIM_CREATED
       - Record AuditEvent: CLAIM_SENT_TO_MANUAL_REVIEW (with explanation)
COMMIT TRANSACTION
```

**Critical Invariant:** Once pinned, `claim.coverage_version_id` is immutable. If subsequent endorsements or coverage changes occur on the vehicle, existing claims retain their historical link to the exact version that was active on the date of loss.

### D. Destructive Delete Protection & Foreign Key Hardening
Historical entities in this architecture are strictly protected against accidental or cascading deletion:
- **`ON DELETE RESTRICT` on Historical Foreign Keys:**
  - `vehicles.policy_id`: Deleting a policy is rejected if vehicle records exist.
  - `coverage_versions.policy_id` and `coverage_versions.vehicle_id`: Coverage intervals cannot be deleted if the vehicle or policy is targeted.
  - `claims.coverage_version_id`: A Claim that references CoverageVersion $X$ strictly blocks the deletion of CoverageVersion $X$ at the database level. Attempting `DELETE FROM coverage_versions WHERE id = X;` immediately raises a foreign key violation (`23503`).
- **No ORM Delete-Orphan Cascades:**
  SQLAlchemy collections omit `cascade="all, delete-orphan"`. Domain mutations rely on explicit state changes (`vehicle.removed_at`, `coverage_version.valid_to`) rather than entity deletion.
- **Audit Preservation:**
  Audit events use `ON DELETE SET NULL` for their foreign keys. If an associated entity is purged, the audit record itself remains in the database with its timestamp and complete JSONB operational payload intact.
- **Demo Reset vs Production Retention:**
  The `POST /api/demo/reset` endpoint is the only mechanism that clears data, executing an explicit, controlled `TRUNCATE TABLE audit_events, claims, coverage_versions, vehicles, policies RESTART IDENTITY CASCADE;`. This behavior exists solely to provide a repeatable demonstration baseline and is not representative of production record retention.

---

## 4. ReportLab PDF Generation

The version-specific endpoint `GET /api/coverage/{coverage_version_id}/proof.pdf` generates an official demonstration certificate directly from the database record:

- **Prominent Watermark:** Diagonal translucent `DEMO ONLY - NOT A REAL INSURANCE DOCUMENT`.
- **Top Header:** Highlighting synthetic demonstration and point-in-time temporal verification.
- **Warning Box:** Explicit notice stating the document has no legal validity.
- **Coverage Details:** Policy number, named insured, masked VIN (`••••-001 (SYNTHETIC)`), coverage type, liability limit (`$100,000.00`), deductible (`$500.00`), and effective interval dates.
- **Audit Logging:** Automatically writes a `PROOF_OF_INSURANCE_GENERATED` event with coverage version metadata to the database upon generation.

---

## 5. Demo Reset Service (`DemoService.reset_demo_state`)

The endpoint `POST /api/demo/reset` safely restores the canonical demonstration state:

1. Executes SQL `TRUNCATE TABLE policies, vehicles, coverage_versions, claims, audit_events RESTART IDENTITY CASCADE;`.
2. Seeds canonical customer `Jordan Lee`, policy `DEMO-AUTO-1024`, and vehicle `2024 BMW X3` (VIN `DEMO-VIN-001`).
3. Seeds initial open-ended Coverage Version 1: `valid_from = 2026-01-01`, `valid_to = NULL`, `$100k` limit, `$500` deductible.
4. Records baseline audit events: `POLICY_CREATED`, `VEHICLE_ADDED`, `COVERAGE_ACTIVATED`.
5. Guarantees deterministic canonical identity keys (`policy_id: 1, vehicle_id: 1, coverage_version_id: 1`) on every run.
6. Also supports `?scenario=versioned` to demonstrate multiple sequential versions (`Jan 1–8` and `Jan 8–15`).

---

## 6. Frontend Service Integration

The React frontend integrates with FastAPI via `apps/frontend/src/services/apiClient.ts`:

- `policyService.ts`: Invokes `GET /api/policies/1` and `GET /api/policies/1/vehicles?include_removed=true`.
- `vehicleService.ts`: Invokes `POST /api/vehicles/{id}/remove`.
- `coverageService.ts`: Invokes `POST /api/coverage/check` and `GET /api/vehicles/{id}/coverage-history`.
- `claimService.ts`: Invokes `POST /api/claims` and `GET /api/claims`.
- `auditService.ts`: Invokes `GET /api/policies/1/audit-events`.
- `ProofOfInsuranceModal.tsx`: Direct download anchor pointing to `http://localhost:8000/api/coverage/{id}/proof.pdf`.
- `DemoContext.tsx`: Initializes state directly from live API responses on startup, surviving page reloads. If the backend is unavailable, it displays an error banner with a retry button instead of silently using stale mocks.

---

## 7. Known Limitations & Out-of-Scope Items

- **Single Active Policy Context:** The prototype focuses on the canonical Jordan Lee policy (`DEMO-AUTO-1024`). Multi-tenant switching is simulated via demo scenarios.
- **No Temporal Sub-Day Granularity:** Boundaries are evaluated as calendar dates (`DATE`). Mid-day policy endorsements (e.g., 12:01 PM) are not modeled.
- **No Claims Adjudication:** Uncovered dates are routed to `REQUIRES_MANUAL_REVIEW`, stopping short of automated legal denial or payment processing.
