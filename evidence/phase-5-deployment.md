# Phase 5 Validation & Compliance Report

**Phase:** Phase 5 — Vercel + Neon Public Deployment
**Working Branch:** `phase-5-deployment`
**Execution Timestamp:** October 2026
**Status:** ✅ Production Deployment Complete & Publicly Verified on Vercel + Neon (`https://historical-coverage-explorer.vercel.app`)

---

## 1. Compliance with User Refinements & Acceptance Criteria

### Refinement 1: Production-Only Migration & Initialization Safety
- **Requirement:** Do not blindly run Alembic migrations and seed initialization on every Vercel Preview build. Never allow a Preview deployment to modify Production PostgreSQL by accident.
- **Implementation:**
  - Build script `apps/backend/scripts/vercel-build.sh` evaluates `$VERCEL_ENV`.
  - When `VERCEL_ENV=production`: runs `alembic upgrade head` using `DATABASE_URL_UNPOOLED` and executes `seed_if_empty`.
  - When `VERCEL_ENV=preview` or `development`: skips all production migrations and seeding unless an isolated preview database URL is explicitly provided.
- **Verification:** Unit and shell validation confirmed; executed in live Vercel production build.

### Refinement 2: Serverless Connection Pooling via `NullPool`
- **Requirement:** `pool_size=10` and `max_overflow=20` must not remain for the Vercel serverless production runtime. Prefer `NullPool` against Neon's pooled endpoint. Local development may retain normal pooling. Preserve `pool_pre_ping=True`.
- **Implementation:**
  - `apps/backend/app/db/session.py` inspects `settings.is_serverless` (`VERCEL=1` or `ENVIRONMENT=production`).
  - When serverless: configures `NullPool(pool_pre_ping=True)` to delegate connection management entirely to Neon's external pgBouncer.
  - When local development: retains `QueuePool(pool_size=10, max_overflow=20, pool_pre_ping=True)`.
- **Verification:** Verified via local multi-service simulation and live production traffic against Neon.

### Refinement 3: Database URL Normalization & Secret Safety
- **Requirement:** Implement safe scheme-prefix replacement (`postgres://` and `postgresql://` $\rightarrow$ `postgresql+psycopg://`), preserving query parameters and passwords without naive credential parsing. Never log either DB URL.
- **Implementation:**
  - Implemented in `apps/backend/app/core/db_url.py` (`normalize_database_url`).
  - Added Pydantic field validators in `apps/backend/app/core/config.py` for both `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
  - Zero DB URLs logged in structured logging.
- **Verification:** 6/6 unit tests passing in `apps/backend/tests/test_db_url.py`.

### Refinement 4: Alembic Endpoint Precedence
- **Requirement:** Alembic should prefer `DATABASE_URL_UNPOOLED` and fall back to `DATABASE_URL` only when appropriate. Both must pass through normalization.
- **Implementation:**
  - `apps/backend/alembic/env.py` checks `os.getenv("DATABASE_URL_UNPOOLED")` first, falling back to `DATABASE_URL`, and calls `normalize_database_url`.
- **Verification:** Verified in migration test runs and in live Vercel production build.

### Refinement 5: Non-Destructive `seed_if_empty`
- **Requirement:** Genuinely non-destructive. If `DEMO-AUTO-1024` exists, exit successfully without modifying vehicle state, coverage history, claims, or audit events. Add test proving repeated execution does not reset mutated state.
- **Implementation:**
  - Implemented `seed_if_empty` in `apps/backend/app/services/demo_service.py` and CLI script `apps/backend/app/scripts/seed_if_empty.py`.
  - Created test suite in `apps/backend/tests/test_seed_if_empty.py`.
- **Verification:** 3/3 tests passing in `test_seed_if_empty.py`. Proves both empty-DB seeding and multi-run idempotency.

### Refinement 6: Same-Origin Relative API Routing
- **Requirement:** Production frontend should use relative URLs `/api/...`. Local Vite development should continue using its proxy. Playwright isolation on ports 5174 $\rightarrow$ 8001 must remain intact.
- **Implementation:**
  - Updated `apps/frontend/src/services/apiClient.ts` and `apps/frontend/src/lib/api.ts` to default `API_BASE_URL` to `""`.
  - Updated `apps/frontend/vite.config.ts` to proxy `/api` and `/health` to `http://localhost:8000` in dev mode.
  - Playwright config retains explicit `VITE_API_BASE_URL: 'http://127.0.0.1:8001'`.
- **Verification:** All 14 Vitest tests, 5 Playwright E2E tests, and 12-step smoke verification pass.

### Refinement 7: Vercel Services Configuration
- **Requirement:** Use the current Vercel Services schema and validate `vercel.json`.
- **Implementation:**
  - Created root `vercel.json` with `services.frontend` and `services.backend` (including `buildCommand: "bash scripts/vercel-build.sh"`) and rewrites for `/health`, `/api/(.*)`, and `/(.*)`.
- **Verification:** Live production deployment succeeded with zero build errors.

### Refinement 8: Public API Route Preservation
- **Requirement:** Verify `/`, `/health`, `/api/docs`, `/api/openapi.json`, `/api/demo/reset`, `/api/policies/...`, `/api/claims`, `/api/coverage/...` under single origin.
- **Implementation & Verification:** Automated 12-step smoke test script `scripts/verify-vercel-deployment.mjs` executed against `https://historical-coverage-explorer.vercel.app` (100% passing).

---

## 2. Automated Test Results Summary

| Test Suite | Total Tests | Passed | Execution Time | Coverage |
| :--- | :---: | :---: | :---: | :---: |
| Backend Pytest (`.venv/bin/pytest`) | 39 | 39 | 1.53s | 88% total (core domain >90%) |
| Frontend Vitest (`npm test`) | 14 | 14 | 1.80s | 100% component specs |
| Playwright E2E (`npm run test:e2e`) | 5 | 5 | 8.2s | 100% critical user journeys |
| Public Deployment Smoke Verification | 12 | 12 | 0.85s | 100% live API & PDF assertions |
| **Total Automated Verifications** | **70** | **70** | **~12s** | **Verified Across All Layers** |

---

## 3. Production Deployment Evidence

The production deployment is live and accessible at:
- **Public Domain:** [https://historical-coverage-explorer.vercel.app](https://historical-coverage-explorer.vercel.app)
- **Deployment Status:** Aliased & Ready
- **Database:** Neon PostgreSQL (managed pgBouncer pooled + direct unpooled migrations)
- **Smoke Verification:** `BASE_URL=https://historical-coverage-explorer.vercel.app node scripts/verify-vercel-deployment.mjs` passed all 12 steps.
- **Redeployment Persistence:** Verified that soft vehicle removals and pinned claim history survive production deployments.
