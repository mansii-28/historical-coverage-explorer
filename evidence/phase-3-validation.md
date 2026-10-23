# Phase 3 Validation Evidence

> **Prototype:** Historical Coverage Explorer  
> **Phase:** 3 — Backend, PostgreSQL, APIs, Domain Logic, PDF Generation, and Full Frontend Integration  
> **Date:** 2026-10-23  
> **Status:** PASSED  

---

## 1. Environment

- **Operating System:** macOS (Darwin 24.3.0 arm64)
- **Node.js:** v22.14.0
- **npm:** 10.9.2
- **Python:** 3.12.9 (`apps/backend/.venv`)
- **FastAPI / Uvicorn:** 0.115.5 / 0.32.1
- **SQLAlchemy:** 2.0.36 (asyncio with `psycopg` 3.2.3)
- **Database:** PostgreSQL 14+ (`historical_coverage` database; validated locally on PostgreSQL 14.17; Docker Compose targets PostgreSQL 16)
- **ReportLab:** 4.2.5
- **Frontend Stack:** React 19.0.0, TypeScript 5.7.3, Vite 6.0.7
- **Browser Automation:** Headless Google Chrome 145.0.7632.117 via Puppeteer-Core

---

## 2. Database Migrations

Executed Alembic migration on empty database:

```bash
cd apps/backend && PYTHONPATH=. .venv/bin/alembic upgrade head
```

**Result:**
```text
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> e1aeef35ef22, create initial schema
```

**Verified Schema Elements:**
- `policies`: PK `id`, unique index on `policy_number`
- `vehicles`: PK `id`, FK `policy_id` → `policies.id` (`RESTRICT`), index `ix_vehicles_policy_removed`
- `coverage_versions`: PK `id`, FKs to `policies` & `vehicles` (`RESTRICT`), check constraint `ck_coverage_versions_valid_range` (`valid_to IS NULL OR valid_to > valid_from`), composite index `ix_coverage_lookup`
- `claims`: PK `id`, unique index on `claim_number`, FKs to `policies` & `vehicles` (`RESTRICT`), FK `coverage_version_id` → `coverage_versions.id` (`RESTRICT`), index `ix_claims_vehicle_date_of_loss`
- `audit_events`: PK `id`, FKs to policy/vehicle/claim (`SET NULL`), JSONB `metadata_json`, index `ix_audit_events_policy_timestamp`

---

## 3. Seed / Reset Verification

Executed canonical reset via API:

```bash
curl -X POST http://localhost:8000/api/demo/reset
```

**Response:**
```json
{
  "message": "Demo state successfully reset to canonical baseline.",
  "policy_id": 1,
  "vehicle_id": 1,
  "coverage_version_id": 1,
  "scenario": "canonical"
}
```

**Verified Canonical Baseline:**
- Truncates tables with `RESTART IDENTITY CASCADE`, ensuring repeatable primary keys `1`.
- Customer: Jordan Lee
- Policy: DEMO-AUTO-1024
- Vehicle: 2024 BMW X3 (VIN: DEMO-VIN-001)
- Coverage Version 1: Comprehensive, $100k liability, $500 deductible, valid from 2026-01-01 to `NULL` (open-ended).
- Audit Events created: `POLICY_CREATED`, `VEHICLE_ADDED`, `COVERAGE_ACTIVATED`.

---

## 4. API Endpoints Exercised & Verified

| Method | Endpoint | Purpose | Status | Verified Result |
|---|---|---|---|---|
| `GET` | `/health` | Service health & DB connection | 200 OK | `status: "ok", database: "connected"` |
| `POST` | `/api/demo/reset` | Canonical demo state reset | 200 OK | Canonical IDs seeded with sequence reset |
| `GET` | `/api/policies/1` | Fetch policy with vehicle counts | 200 OK | Policy DEMO-AUTO-1024, Jordan Lee |
| `GET` | `/api/policies/1/vehicles` | List vehicles (`include_removed=true`) | 200 OK | Both active and past vehicles returned |
| `POST` | `/api/vehicles/1/remove` | Atomic soft vehicle removal on Jan 15 | 200 OK | `removed_at: "2026-01-15"`, coverage closed |
| `GET` | `/api/vehicles/1/coverage?as_of=2026-01-10` | Historical lookup for Jan 10 | 200 OK | `status: "COVERAGE_FOUND"`, Version 1 returned |
| `GET` | `/api/vehicles/1/coverage?as_of=2026-01-20` | Historical lookup for Jan 20 | 200 OK | `status: "REQUIRES_MANUAL_REVIEW"`, coverage: null |
| `GET` | `/api/vehicles/1/coverage-history` | Ordered chronological coverage versions | 200 OK | Version 1 (`2026-01-01` → `2026-01-15`) |
| `POST` | `/api/coverage/check` | Historical lookup body endpoint | 200 OK | Evaluates `date_of_loss` via shared service |
| `POST` | `/api/claims` | Create claim for Jan 10 (covered) | 201 Created | `coverage_version_id: 1`, `status: "SUBMITTED"` |
| `POST` | `/api/claims` | Create claim for Jan 20 (uncovered) | 201 Created | `coverage_version_id: null`, `status: "MANUAL_REVIEW"` |
| `GET` | `/api/claims/1` | Fetch single claim details | 200 OK | Retains pinned coverage version 1 |
| `GET` | `/api/policies/1/audit-events` | Chronological immutable domain events | 200 OK | 15 persistent audit events with JSONB |
| `GET` | `/api/coverage/1/proof.pdf` | Version-specific PDF generation | 200 OK | Valid PDF 1.4 stream with DEMO watermark |
| `GET` | `/api/docs` | Swagger OpenAPI documentation | 200 OK | OpenAPI 3.1.0 specification rendered |

---

## 5. End-to-End Canonical Workflow & Browser Persistence

The automated verification suite (`scripts/verify-phase3.cjs`) executed the complete scenario against live PostgreSQL:

1. **Initial Baseline:** Policy loaded from PostgreSQL, showing 1 Active Vehicle (`2024 BMW X3`), 0 Past Vehicles. Screenshot saved: `11-live-api-policy.png`.
2. **Soft Removal Transaction:** BMW removed effective `2026-01-15`.
3. **Browser Reload Persistence Test 1:** Full browser page reload (`networkidle0`) executed. BMW was correctly fetched from PostgreSQL into the `PAST VEHICLES (1)` section with preserved terms.
4. **Historical Covered Claim (Jan 10):** Filed claim for accident occurring on January 10, 2026. Backend evaluated `date_of_loss`, found Coverage Version 1, and pinned `coverage_version_id = 1`. Screenshot saved: `12-live-api-covered-claim.png`.
5. **Browser Reload Persistence Test 2:** Full browser page reload executed. Total claims count (1 active claim) and pinned coverage version were preserved from PostgreSQL.
6. **Historical Uncovered Claim (Jan 20):** Evaluated loss date after removal (January 20, 2026). Backend routed claim to `REQUIRES_MANUAL_REVIEW` / `MANUAL_REVIEW` without automated rejection. Screenshot saved: `13-live-api-manual-review.png`.
7. **Audit Trail Verification:** Complete chronological audit timeline queried from PostgreSQL JSONB events. Screenshot saved: `14-live-audit-events.png`.
8. **Browser Console Output:** 0 errors encountered across all flows.

---

## 6. PostgreSQL Direct Verification Evidence

Actual query output extracted from PostgreSQL and archived in `evidence/database/`:

1. `evidence/database/vehicle-after-removal.txt`:
   ```
   id: 1 | policy_id: 1 | vin: DEMO-VIN-001 | make: BMW | model: X3 | year: 2024
   added_at: 2026-01-01 | removed_at: 2026-01-15
   ```
2. `evidence/database/coverage-after-removal.txt`:
   ```
   id: 1 | policy_id: 1 | vehicle_id: 1 | valid_from: 2026-01-01 | valid_to: 2026-01-15
   coverage_type: Comprehensive | liability_limit: 100000.00 | deductible: 500.00
   ```
3. `evidence/database/covered-claim.txt`:
   ```
   id: 1 | claim_number: DEMO-CLM-0001 | date_of_loss: 2026-01-10 | filed_at: 2026-02-10
   coverage_version_id: 1 | coverage_verification_status: COVERAGE_FOUND | status: SUBMITTED
   ```
4. `evidence/database/manual-review-claim.txt`:
   ```
   id: 2 | claim_number: DEMO-CLM-0002 | date_of_loss: 2026-01-20 | filed_at: 2026-02-10
   coverage_version_id: NULL | coverage_verification_status: REQUIRES_MANUAL_REVIEW | status: MANUAL_REVIEW
   ```
5. `evidence/database/audit-events.txt`:
   15 immutable domain events recorded from `POLICY_CREATED` through `PROOF_OF_INSURANCE_GENERATED`.

---

## 7. Database Integrity & Claim Pinning Protection Test

To verify that claims protect their pinned coverage version at the database layer (rather than relying on application conventions), a direct deletion of `coverage_versions WHERE id = 1` was attempted within a controlled transaction while referenced by Claim 1:

```sql
BEGIN;
DELETE FROM coverage_versions WHERE id = 1;
ROLLBACK;
```

**PostgreSQL Database Result:**
```text
ERROR:  update or delete on table "coverage_versions" violates foreign key constraint "claims_coverage_version_id_fkey" on table "claims"
DETAIL:  Key (id)=(1) is still referenced from table "claims".
```

**Verification:**
The transaction aborted and was rolled back cleanly. The database engine strictly rejected the deletion due to the `ON DELETE RESTRICT` foreign key constraint, proving that historical coverage versions referenced by claims cannot be destroyed.

---

## 8. PDF Generation Verification

- **Command:** `curl -s -o /tmp/proof.pdf http://localhost:8000/api/coverage/1/proof.pdf`
- **HTTP Status:** 200 OK
- **Content-Type:** `application/pdf`
- **File Validation:** `evidence/generated/demo-proof-of-insurance.pdf: PDF document, version 1.4, 1 pages`
- **Visual & Structural Elements Verified:**
  - Watermark: `DEMO ONLY - NOT A REAL INSURANCE DOCUMENT`
  - Warning banner: Explicit non-legal prototype disclaimer
  - Vehicle terms: BMW X3, masked VIN (`••••-001 (SYNTHETIC)`), $100,000 liability, $500 deductible
  - Coverage bounds: Jan 1, 2026 (inclusive) to Jan 15, 2026 (exclusive)
  - Audit event: Automatically recorded `PROOF_OF_INSURANCE_GENERATED` in PostgreSQL

---

## 9. Linter & Build Verification

- **Backend Linting (`apps/backend/.venv/bin/ruff check .`):**
  `All checks passed!`
- **Frontend Linting (`npm run lint`):**
  `Found 0 warnings and 0 errors. Finished in 39ms on 28 files.`
- **Frontend Build (`npm run build`):**
  `tsc -b && vite build` built in 305ms without errors.

---

## 10. Known Limitations

- Single-policy demo context (`DEMO-AUTO-1024`); multi-tenant routing is simulated via scenario parameters.
- Temporal effective boundaries operate on calendar dates (`DATE`); sub-day time-of-day endorsements are out of scope.
- Automated legal claims adjudication is deliberately not implemented; uncovered dates route to `REQUIRES_MANUAL_REVIEW`.
