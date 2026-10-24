# 10 — Vercel & Neon Public Deployment Architecture

This document specifies the deployment architecture, connection pooling strategy, database migration safety guarantees, and environment configuration for running the Historical Coverage Explorer on Vercel and Neon PostgreSQL.

---

## 1. Architectural Overview

The Historical Coverage Explorer is deployed as a single, unified project on Vercel using **Vercel Multi-Service Workspaces** backed by **Neon Serverless PostgreSQL**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vercel Public Edge Domain                       │
│                        https://<project>.vercel.app                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          Rewrite: `/` & `/(.*)`             Rewrite: `/api/(.*)` & `/health`
    ┌───────────────────────────┐       ┌───────────────────────────────┐
    │     Frontend Service      │       │        Backend Service        │
    │      (apps/frontend)      │       │        (apps/backend)         │
    │   React 19 + Vite SPA     │       │   FastAPI (Python 3.12)       │
    │  Static asset edge hosting│       │   Serverless Function runtime │
    └───────────────────────────┘       └───────────────┬───────────────┘
                                                        │
                                     psycopg3 async / NullPool
                                                        │
                                                        ▼
                                        ┌───────────────────────────────┐
                                        │   Neon Serverless PostgreSQL  │
                                        │   pgBouncer Pooled: :5432     │
                                        │   Direct Unpooled:  :5432     │
                                        └───────────────────────────────┘
```

### Key Deployment Characteristics
1. **Single Origin:** Both the SPA and REST API share the same public domain. The frontend issues relative requests (`/api/...`), completely eliminating cross-origin resource sharing (CORS) preflights, cookie boundary complexities, and disparate domain configurations.
2. **Path Preservation:** Vercel edge routing rewrites send incoming requests directly to the FastAPI service while preserving the full URL path (`/api/policies/...` arrives at FastAPI without path stripping).
3. **Dual Database Endpoints:** Runtime API traffic communicates through Neon's transaction-pooled endpoint, while schema migrations run over Neon's direct unpooled endpoint.

---

## 2. Serverless Connection Pooling Strategy

### The Serverless Concurrency Problem
Traditional relational database connection pools (such as SQLAlchemy's `QueuePool` with `pool_size=10, max_overflow=20`) are designed for long-running, stateful server processes.

In a serverless environment like Vercel Functions:
- Each incoming request may spin up a discrete, isolated execution container.
- Under high concurrency, 50 simultaneous serverless invocations maintaining 10 connections each would attempt to establish 500 persistent database connections.
- This immediately exhausts PostgreSQL connection limits (`max_connections`) and causes `connection refused` or `too many clients already` errors.

### The Solution: SQLAlchemy `NullPool` + Neon pgBouncer
Neon manages database connection pooling externally via **pgBouncer**:
- Neon maintains a warm pool of PostgreSQL server processes and multiplexes short-lived client queries over a small number of real connections.
- In `apps/backend/app/db/session.py`, when running in a serverless environment (`VERCEL=1` or `ENVIRONMENT=production`), SQLAlchemy is configured with **`NullPool`**.
- `NullPool` disables client-side connection pooling entirely: every session opens a lightweight connection directly to Neon's pgBouncer endpoint and closes it immediately when the request lifecycle ends.
- `pool_pre_ping=True` is maintained to verify connection vitality prior to query execution, gracefully discarding any stale connections.
- Local development retains normal `QueuePool` (`pool_size=10, max_overflow=20`) for fast query turnaround during local test runs.

---

## 3. Database URL Normalization & Secret Safety

Neon and cloud providers supply PostgreSQL connection strings using either the `postgres://` or `postgresql://` URI schemes. SQLAlchemy 2.x with the modern `psycopg` (v3) driver requires `postgresql+psycopg://`.

### Normalization Logic (`app/core/db_url.py`)
To prevent credential parsing bugs (such as percent-encoded passwords, query parameters, or TLS directives being corrupted by naive URL parsers), `normalize_database_url` applies safe scheme-prefix replacement:
- `postgres://` $\rightarrow$ `postgresql+psycopg://`
- `postgresql://` $\rightarrow$ `postgresql+psycopg://`
- Existing `postgresql+psycopg://` $\rightarrow$ unchanged

### Credential & Log Protection
- Neither `DATABASE_URL` nor `DATABASE_URL_UNPOOLED` is ever logged.
- The structured JSON logging middleware strips connection credentials and never includes database DSN strings in request logs or traces.

---

## 4. Production-Only Migration & Initialization Safety

A critical risk in continuous deployment pipelines is accidental schema mutation or test data injection against production databases during preview/PR builds.

### Build Hook Architecture (`apps/backend/scripts/vercel-build.sh`)
During Vercel build execution, the build script inspects `VERCEL_ENV`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "[deployment] backend build initialization started"

if [[ "${VERCEL_ENV:-}" != "production" ]]; then
    echo "[deployment] non-production environment; skipping production DB migration"
    exit 0
fi

if [[ -z "${DATABASE_URL_UNPOOLED:-}" ]]; then
    echo "[deployment] DATABASE_URL_UNPOOLED is required"
    exit 1
fi

echo "[deployment] applying Alembic migrations"
PYTHONPATH=. alembic upgrade head
echo "[deployment] Alembic migration complete"

echo "[deployment] running seed_if_empty"
PYTHONPATH=. python -m app.scripts.seed_if_empty
echo "[deployment] backend database initialization complete"
```

### Safety Guarantees:
1. **Preview Deployments:** Never mutate the production Neon database. Migrations only execute if an isolated preview database DSN is explicitly provided.
2. **Direct Connection for Migrations:** Alembic prioritizes `DATABASE_URL_UNPOOLED` over `DATABASE_URL`. Transaction-level DDL migrations (e.g., table creation, enum modifications, schema index locks) bypass pgBouncer connection multiplexers to prevent transaction pinning failures.
3. **Idempotent Seed-If-Empty:** Unlike `/api/demo/reset` (which resets synthetic demo state for evaluation), `seed_if_empty` is strictly non-destructive:
   - Checks if the canonical policy `DEMO-AUTO-1024` exists in the target database.
   - If present: exits immediately (`0` records modified). Preserves all existing vehicle states, claims, and audit logs.
   - If absent (first deployment on a fresh Neon database): inserts the initial baseline records and initial audit events.

---

## 5. Unified Vercel Configuration (`vercel.json`)

The application defines two coordinated services and single-origin rewrite routing in root `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "frontend": {
      "root": "apps/frontend/",
      "framework": "vite",
      "installCommand": "npm ci",
      "buildCommand": "npm run build",
      "outputDirectory": "dist"
    },
    "backend": {
      "root": "apps/backend/",
      "framework": "fastapi",
      "entrypoint": "app.main:app",
      "buildCommand": "bash scripts/vercel-build.sh"
    }
  },
  "rewrites": [
    {
      "source": "/health",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api/(.*)",
      "destination": { "service": "backend" }
    },
    {
      "source": "/(.*)",
      "destination": { "service": "frontend" }
    }
  ]
}
```

### Local Multi-Service Simulation
Local development and CI environments can simulate the entire Vercel edge rewrite layer using:
```bash
npx vercel dev --local --listen 3000
```
This serves the React frontend and FastAPI backend behind a single reverse proxy on port 3000.

---

## 6. Environment Variables Reference

| Variable | Description | Required in Production |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon pooled endpoint (`...-pooler.eastus2.azure.neon.tech/...`) | Yes |
| `DATABASE_URL_UNPOOLED` | Neon direct endpoint (`...eastus2.azure.neon.tech/...`) | Yes |
| `ENVIRONMENT` | Runtime environment name (`production` / `development`) | Yes |
| `VERCEL_ENV` | Provided automatically by Vercel (`production` / `preview`) | Managed by Vercel |
| `DEMO_RESET_ENABLED` | Allows `/api/demo/reset` endpoint in production (`true`) | Optional (defaults `true`) |
| `LOG_LEVEL` | Minimum logging verbosity (`INFO` / `DEBUG`) | Optional (defaults `INFO`) |
| `VITE_API_BASE_URL` | Base URL for frontend API calls (leave empty for same-origin `/api`) | No (production default: `""`) |

---

## 7. Public Deployment Smoke Verification

Post-deployment verification is automated via `scripts/verify-vercel-deployment.mjs`. It executes a 12-point smoke sequence against the public deployment URL:

1. **Step 1 — Health probe verifies database connectivity:** `GET /health` returns status `ok` and database `connected`.
2. **Step 2 — Swagger API docs reachable:** `GET /api/docs` returns Swagger UI HTML with application markers.
3. **Step 3 — Reset demonstration dataset to canonical baseline:** `POST /api/demo/reset` initializes canonical baseline.
4. **Step 4 — Fetch canonical policy DEMO-AUTO-1024 and active vehicle:** `GET /api/policies/1` and `GET /api/policies/1/vehicles` return active 2024 BMW X3.
5. **Step 5 — Soft-remove vehicle effective Jan 15, 2026:** `POST /api/vehicles/{id}/remove` stamps `removed_at` and closes active coverage version.
6. **Step 6 — Evaluate retrospective loss date Jan 10 (returns COVERAGE_FOUND):** `POST /api/coverage/check` returns `COVERAGE_FOUND` and governing Coverage Version 1 ID.
7. **Step 7 — File retrospective claim and verify pinned coverage version:** `POST /api/claims` creates claim permanently pinned to Coverage Version 1.
8. **Step 8 — Evaluate post-removal incident Jan 20 (returns REQUIRES_MANUAL_REVIEW, zero denial):** `POST /api/coverage/check` returns `REQUIRES_MANUAL_REVIEW` and `coverage_version: null`.
9. **Step 9 — Generate point-in-time Proof of Insurance PDF in memory:** `GET /api/coverage/{id}/proof.pdf` returns `application/pdf` with `X-Demo-Notice: DEMO ONLY` header and `%PDF-` binary magic bytes (synthetic demo document; not legally valid proof of insurance).
10. **Step 10 — Inspect immutable domain audit events:** `GET /api/policies/1/audit-events` verifies `VEHICLE_REMOVED` and `CLAIM_CREATED` events exist with correlation IDs.
11. **Step 11 — Verify multi-version interval coverage selection (Jan 5 -> V1, Jan 10 -> V2):** Seeds `scenario=versioned` and asserts Jan 5 selects Version 1 ($1,000 deductible) while Jan 10 selects Version 2 ($500 deductible).
12. **Step 12 — Restore canonical demonstration state at completion:** `POST /api/demo/reset?scenario=canonical` restores pristine demo state.

---

## 8. Verification & Test Metrics

- **Verified Suite:** 58 automated test cases: 39 backend, 14 frontend, 5 Playwright E2E, plus a separate 12-step public deployment verification.
- **Backend Pytest:** 39 passed (88% aggregate backend coverage)
- **Frontend Vitest / RTL:** 14 passed
- **Playwright E2E Browser Journeys:** 5 passed
- **Public Domain:** `https://historical-coverage-explorer.vercel.app`
- **Additional Production Validation — Redeploy Persistence:** Tested separately from the 12 scripted smoke steps; confirmed that soft vehicle removals and pinned claims survive complete Vercel redeployments.
