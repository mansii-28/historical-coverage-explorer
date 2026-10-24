# Testing Strategy & Verification Report

**Project:** Historical Coverage Explorer  
**Scope:** Phase 4 — Testing, Observability, Structured Logging, and Technical Evidence  
**Status:** Complete & Passing Across All Tiers  

---

## 1. Test Pyramid & Philosophy

The Historical Coverage Explorer implements an evidence-driven, multi-tier testing strategy designed to prove four fundamental architectural properties:

1. **Temporal Determinism:** Date queries on, before, or after coverage intervals evaluate strictly against half-open intervals `[valid_from, valid_to)`.
2. **Immutability & Integrity:** Deletions of vehicles or policies never delete past coverage versions; claims pinned to coverage versions cannot be orphaned; audit logs are strictly append-only.
3. **UX & Product Accuracy:** Negative matches route to `REQUIRES_MANUAL_REVIEW` without ever stating "Claim Denied"; claim creation confirms pinned coverage versions; the system never claims to adjudicate or approve claims.
4. **Reproducibility & Safety:** Test runs are isolated from production and development databases; safety guards immediately abort test runs on unsafe database connections.

```
                  ┌────────────────────────┐
                  │    Playwright E2E      │  5 Scenarios (Chromium)
                  │   Full User Journeys   │  Dedicated E2E DB (Port 8001 / 5174)
                  ├────────────────────────┤
                  │  Vitest & RTL Frontend │  14 Component & State Tests
                  │   UX & Route Guards    │  5 Test Files (JSDOM)
                  ├────────────────────────┤
                  │ Pytest Backend Domain  │  30 Integration & Unit Tests
                  │ Boundaries, DB Schema  │  89% Coverage (Test DB)
                  └────────────────────────┘
```

---

## 2. Test Database Safety & Isolation Guards

### Backend Pytest Safety Guard
The backend integration test suite connects to an isolated PostgreSQL database (`historical_coverage_test`).
To guarantee that test operations (table truncations, fixture insertions) **never** run against or modify the primary development database (`historical_coverage`), `tests/conftest.py` executes a mandatory fail-fast URL assertion prior to creating the engine or running fixtures:

```python
parsed_url = make_url(TEST_DATABASE_URL)
db_name = (parsed_url.database or "").lower()
if "test" not in db_name:
    raise RuntimeError(
        f"CRITICAL SAFETY VIOLATION: Database '{parsed_url.database}' lacks 'test'! "
        f"Refusing to run against non-test databases to protect development data."
    )
```

### Playwright E2E Dedicated Database & Safety Guard
The Playwright end-to-end suite performs destructive demo resets and writes/removes vehicle records. To completely isolate this activity from both development (`historical_coverage`) and pytest (`historical_coverage_test`), the E2E suite uses a dedicated database:
**`historical_coverage_e2e_test`**

#### Architecture
```
Playwright Runner (Chromium)
  └──> Frontend Test Server (http://localhost:5174)
         └──> Proxies /api to FastAPI E2E Backend (http://127.0.0.1:8001)
                └──> Dedicated PostgreSQL DB: historical_coverage_e2e_test
```

`scripts/run_e2e_backend.py` enforces a strict pre-flight safety check before launching uvicorn on port 8001:
```python
if "test" not in db_name.lower():
    sys.stderr.write(
        f"\n[FATAL SAFETY VIOLATION] Target database '{db_name}' does NOT contain 'test'.\n"
        "Playwright E2E suite refused to start because it must never execute against "
        "development ('historical_coverage') or production databases.\n"
        "Aborting immediately.\n\n"
    )
    sys.exit(1)
```

---

## 3. Test Suites & Coverage Breakdown

### A. Backend Test Suite (`pytest` + `pytest-asyncio` + `pytest-cov`)

The backend test suite runs 30 automated tests in ~0.86 seconds against a real PostgreSQL test database (`historical_coverage_test`).

| Test File | Category / Focus | Key Scenarios Tested |
|-----------|------------------|----------------------|
| `tests/test_coverage_service.py` | Temporal Boundaries & Invariants | Inclusive `valid_from`, exclusive `valid_to`, day before `valid_to`, multi-version chronological selection, overlap prevention, check constraints (`valid_to > valid_from`), unknown vehicle handling |
| `tests/test_vehicle_service.py` | Soft Removal & State Transitions | Soft vehicle removal closes active coverage version, preserves historical intervals, prevents duplicate removal (HTTP 409 Conflict), validates temporal ordering (`effective_date >= added_at`) |
| `tests/test_claim_service.py` | Claim Verification & Pinning | Claim filed after vehicle removal finds historical coverage, loss after coverage ended routes to `REQUIRES_MANUAL_REVIEW`, claim coverage version pinning is immutable, future date of loss rejected, vehicle-policy mismatch rejected |
| `tests/test_database_integrity.py` | Delete Protection | Foreign key `RESTRICT` on delete prevents deletion of coverage versions pinned to claims; prevents deletion of policy with vehicles; prevents deletion of vehicle with coverage records |
| `tests/test_pdf.py` | Document Generation | Valid PDF 1.4 header, ReportLab canvas generation, prominent `DEMO ONLY` watermarks, disclaimer inspection, 404 on missing version |
| `tests/test_api_endpoints.py` | HTTP Router Integration | Health probe, idempotent demo reset, correlation ID propagation in response headers, vehicle removal via HTTP, claims workflow |

#### Coverage Summary (89% Total Coverage)
- `app/services/claim_service.py`: **96%**
- `app/services/coverage_service.py`: **93%**
- `app/services/document_service.py`: **98%**
- `app/services/vehicle_service.py`: **98%**
- `app/core/logging.py`: **89%**
- `app/core/middleware.py`: **86%**
- `app/models/__init__.py`: **90%**
- `app/schemas/__init__.py`: **100%**
- `app/core/config.py`: **100%**

---

### B. Frontend Component Tests (`vitest` + `@testing-library/react`)

14 component and state tests across 5 test suites verify UX clarity and critical insurance domain requirements:

| Test File | Focus & Verification |
|-----------|----------------------|
| `PolicyPage.test.tsx` (3 tests) | Renders active vehicle with masked VIN (`••••-001`), displays past vehicles section with removal date when vehicle is soft-removed, triggers soft removal modal |
| `FileClaimPage.test.tsx` (4 tests) | Point-in-time check renders `COVERAGE_FOUND` pill and "Continue Claim" button for covered loss date; renders `REQUIRES_MANUAL_REVIEW` and "No Automated Coverage Match" for uncovered loss date; **strictly verifies absence of "Claim Denied" text**; **verifies claim confirmation displays Pinned Coverage Version and Version 1** |
| `ProofOfInsuranceModal.test.tsx` (2 tests) | Renders synthetic disclaimer, policy, and vehicle terms; **explicitly verifies invoking live version-specific route `/api/coverage/1/proof.pdf`** |
| `AuditTrailPage.test.tsx` (2 tests) | Renders audit header, event counts, human labels ("Policy Created", "Vehicle Added", "Coverage Activated"), and tests category filtering |
| `App.test.tsx` (3 tests) | Application header, navigation between tabs, backend connection failure error banner with retry action, and demo reset modal |

---

### C. End-to-End Test Suite (`playwright`)

5 end-to-end tests exercise complete user journeys in Chromium against the dedicated E2E stack:

1. **Scenario 1 (Canonical Covered Claim & Reload Persistence):**
   - Soft-removes BMW X3 effective Jan 15, 2026.
   - Files retrospective claim for loss on Jan 10 (filed Feb 10).
   - Verifies automated `COVERAGE_FOUND` result and claim creation pinned to Coverage Version 1.
   - Executes browser refresh (`page.reload()`) and verifies persisted claim count, sidebar badge, and audit logs.
   - *Language compliance: Strictly verifies "Claim Submitted" and "Pinned Coverage Version" without any "approved" claims phrasing.*
2. **Scenario 2 (Manual Review Routing on Post-Removal Incident):**
   - Evaluates incident date on Jan 20, 2026 (5 days after removal).
   - Verifies `REQUIRES_MANUAL_REVIEW` status and "No Automated Coverage Match" heading.
   - Asserts zero instances of "Claim Denied".
   - Continues claim and confirms manual review routing with `None (Manual Review)` pinned coverage.
3. **Scenario 3 (Immutable Audit Trail):**
   - Verifies audit events appear in timeline ledger.
   - Tests category pill filtering.
4. **Scenario 4 (Demo Reset):**
   - Triggers Reset Demo modal.
   - Confirms reset and verifies active vehicle is restored to baseline with zero claims.
5. **Scenario 5 (Effective-Dated Coverage Version Selection across Multiple Intervals):**
   - Seeds backend with versioned scenario (`POST /api/demo/reset?scenario=versioned`).
   - Incident on Jan 5, 2026 deterministically matches Version 1 (Jan 1 → Jan 8, $1,000 deductible).
   - Incident on Jan 10, 2026 deterministically matches Version 2 (Jan 8 → Jan 15, $500 deductible).
   - Confirms both version labels and respective deductibles in the live UI.
   - Restores canonical demo baseline afterward.

---

## 4. Running the Test Suites

```bash
# 1. Run backend tests with coverage (uses historical_coverage_test)
cd apps/backend
.venv/bin/pytest -v --cov=app --cov-report=term-missing

# 2. Run frontend component tests
cd apps/frontend
npm run test

# 3. Run Playwright end-to-end suite (automatically starts isolated backend on 8001 against historical_coverage_e2e_test and frontend on 5174)
cd apps/frontend
npm run test:e2e
```
