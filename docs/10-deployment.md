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
if [ "$VERCEL_ENV" = "production" ]; then
    echo "Production build detected: executing Alembic migrations..."
    .venv/bin/alembic upgrade head
    
    echo "Running non-destructive seed_if_empty..."
    .venv/bin/python -m app.scripts.seed_if_empty
else
    echo "Preview or development build: skipping production database mutation."
fi
```

### Safety Guarantees:
1. **Preview Deployments:** Never mutate the production Neon database. Migrations only execute if an isolated preview database DSN is explicitly provided.
2. **Direct Connection for Migrations:** Alembic prioritizes `DATABASE_URL_UNPOOLED` over `DATABASE_URL`. Transaction-level DDL migrations (e.g., table creation, enum modifications, schema index locks) bypass pgBouncer connection multiplexers to prevent transaction pinning failures.
3. **Idempotent Seed-If-Empty:** Unlike `/api/demo/reset` (which destroys user state and restores factory defaults), `seed_if_empty` is strictly non-destructive:
   - Checks if the canonical policy `DEMO-AUTO-1024` exists in the target database.
   - If present: exits immediately (`0` records modified). Preserves all existing vehicle states, claims, and audit logs.
   - If absent (first deployment on a fresh Neon database): inserts the initial baseline records.

---

## 5. Unified Vercel Configuration (`vercel.json`)

The application defines two coordinated services and single-origin rewrite routing in root `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "frontend": {
      "path": "apps/frontend"
    },
    "backend": {
      "path": "apps/backend"
    }
  },
  "rewrites": [
    {
      "source": "/health",
      "service": "backend"
    },
    {
      "source": "/api/(.*)",
      "service": "backend"
    },
    {
      "source": "/(.*)",
      "service": "frontend"
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

1. **System Health Check:** `GET /health` returns status `healthy` and PostgreSQL `connected`.
2. **OpenAPI Specification:** `GET /api/openapi.json` returns valid OpenAPI documentation schema.
3. **Demo Reset:** `POST /api/demo/reset` successfully initializes canonical demo state.
4. **Policy & Vehicle Inspection:** Verifies `DEMO-AUTO-1024` with active vehicles.
5. **Vehicle Soft Removal:** Removes a vehicle and confirms `removed_at` timestamp is persisted.
6. **Historical Covered Claim Filing:** Files a claim during valid coverage window $\rightarrow$ status `APPROVED`, pinned to Coverage Version 1.
7. **Post-Removal Manual Review Claim:** Files a claim after removal date $\rightarrow$ status `MANUAL_REVIEW`, zero claim denial.
8. **In-Memory PDF Generation:** `GET /api/coverage/1/proof.pdf` returns `application/pdf` with valid binary header `%PDF-`.
9. **Audit Log Trail:** Verifies `VEHICLE_REMOVED` and claim audit events exist with valid correlation IDs.
10. **Versioned Coverage Scenario:** Seeds `scenario=versioned` and proves historical lookup selects Version 1 vs Version 2 based on incident date.
11. **Idempotent Seed Non-Destruction:** Confirms existing state is preserved.
12. **Canonical State Restoration:** Resets back to clean demo state for subsequent users.
