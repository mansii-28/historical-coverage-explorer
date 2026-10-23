# Architecture

> **Prototype:** Historical Coverage Explorer
> **Document:** docs/03-architecture.md
> **Status:** Phase 3 Complete

---

## Overview

The Historical Coverage Explorer is a monorepo prototype with three layers:

1. **Frontend** — React + TypeScript + Vite SPA
2. **Backend** — Python FastAPI REST API
3. **Database** — PostgreSQL 14+ (psycopg async driver, SQLAlchemy 2.x; validated locally on 14; Docker Compose targets 16)

All three run locally via Docker Compose or natively via Makefile.

---

## Implemented Architecture (Phase 3)

```mermaid
flowchart TD
    subgraph Client["Browser"]
        FE["React SPA\nPolicy Dashboard\nClaim Filing\nAudit Timeline\nCoverage History"]
    end

    subgraph Backend["FastAPI Application"]
        direction TB
        subgraph Routers["API Routers"]
            R_POL["policies"]
            R_VEH["vehicles"]
            R_COV["coverage"]
            R_CLM["claims"]
            R_AUD["audit"]
            R_PDF["proof PDF"]
            R_DEMO["demo/reset"]
        end

        subgraph Services["Services"]
            SVC_COV["CoverageService\neffective-dated lookup"]
            SVC_CLM["ClaimService\ncoverage pinning"]
            SVC_VEH["VehicleService\nsoft removal transaction"]
            SVC_AUD["AuditService\nevent recording"]
            SVC_PDF["PDFService\nReportLab"]
        end

        subgraph Models["ORM Models"]
            M_POL["Policy"]
            M_VEH["Vehicle"]
            M_CV["CoverageVersion"]
            M_CLM["Claim"]
            M_AUD["AuditEvent"]
        end
    end

    subgraph Database["PostgreSQL 14+"]
        PG[("historical_coverage")]
    end

    FE -- "REST API" --> Routers
    Routers --> Services
    Services --> Models
    Models -- "psycopg async" --> PG
```

---

## Coverage Lifecycle Diagram

```mermaid
sequenceDiagram
    participant Customer
    participant API
    participant DB

    Customer->>API: POST /api/demo/reset (seed data)
    API->>DB: Create Policy, Vehicle, CoverageVersion (valid_from=Jan 1, valid_to=NULL)
    API->>DB: Write POLICY_CREATED, VEHICLE_ADDED, COVERAGE_ACTIVATED audit events

    Note over Customer,DB: Accident occurs Jan 10 (no system action yet)

    Customer->>API: POST /api/vehicles/{id}/remove (effective_date=Jan 15)
    API->>DB: Set vehicle.removed_at = Jan 15
    API->>DB: Set CoverageVersion.valid_to = Jan 15
    API->>DB: Write VEHICLE_REMOVED, COVERAGE_CLOSED audit events
    API-->>Customer: Vehicle removed confirmation

    Customer->>API: POST /api/claims (date_of_loss=Jan 10, filed_at=Feb 10)
    API->>DB: SELECT CoverageVersion WHERE vehicle_id=? AND valid_from<=Jan10 AND (valid_to IS NULL OR Jan10 < valid_to)
    DB-->>API: CoverageVersion (Jan 1 – Jan 15)
    API->>DB: Create Claim with coverage_version_id set
    API->>DB: Write CLAIM_CREATED, CLAIM_LINKED_TO_COVERAGE_VERSION audit events
    API-->>Customer: Claim created, COVERAGE_FOUND
```

---

## Key Architectural Decisions

| Decision | Choice | See ADR |
|----------|--------|---------|
| Historical source of truth | Effective-dated DB records (not cache) | ADR-001 |
| Vehicle removal | Soft delete (set removed_at) | ADR-002 |
| Claim coverage reference | Pin to coverage_version_id at creation | ADR-003 |
| Coverage determination | Deterministic SQL query (no AI) | ADR-004 |
| Logging vs. audit | Separate concerns: app logs vs. audit events | ADR-005 |

---

## Layer Responsibilities

### Frontend (`apps/frontend/`)

| File/Folder | Purpose |
|-------------|---------|
| `src/lib/api.ts` | API abstraction layer — all backend calls go here |
| `src/App.tsx` | Root application component |
| `src/index.css` | Global Tailwind + design tokens |

> **Design principle:** All backend calls go through `src/lib/api.ts`. Mock data (Phase 2) and real API calls (Phase 3) swap at this boundary.

### Backend (`apps/backend/app/`)

| Module | Purpose |
|--------|---------|
| `main.py` | FastAPI application, CORS, lifespan |
| `core/config.py` | pydantic-settings — reads .env |
| `db/base.py` | SQLAlchemy DeclarativeBase |
| `db/session.py` | Async engine, session factory, startup check |
| `api/routers/health.py` | GET /health endpoint |
| `models/` | ORM models (Phase 3) |
| `schemas/` | Pydantic request/response schemas (Phase 3) |
| `services/` | Business logic (Phase 3) |

### Database

PostgreSQL 14+ (validated locally on PostgreSQL 14; Docker Compose targets PostgreSQL 16). Migrations via Alembic.

---

## What Is Implemented (Phase 1)

- [x] Monorepo structure
- [x] FastAPI application with CORS
- [x] `GET /health` endpoint (includes DB connectivity check)
- [x] SQLAlchemy 2.x async engine configuration
- [x] pydantic-settings configuration
- [x] Alembic initialized and configured to use app's DATABASE_URL and Base
- [x] React + TypeScript + Vite frontend skeleton
- [x] Tailwind CSS configured
- [x] API abstraction layer (`src/lib/api.ts`)
- [x] Docker Compose with PostgreSQL, backend, frontend
- [x] `.env.example`
- [x] Makefile

## What Is Proposed (Phase 3)

- [ ] ORM models: Policy, Vehicle, CoverageVersion, Claim, AuditEvent
- [ ] Alembic migrations
- [ ] Vehicle removal transaction
- [ ] Effective-dated coverage lookup query
- [ ] Claim creation with coverage pinning
- [ ] Audit event recording
- [ ] Proof-of-insurance PDF generation
- [ ] Demo seed/reset endpoint
- [ ] Full frontend/backend integration

## Deliberately Out of Scope

- Real carrier API integrations
- Authentication / OAuth
- Authorization / RBAC
- Payment processing
- Real customer data
- Production security hardening
- Kubernetes / microservices
- Event streaming (Kafka, Debezium)
- Machine learning / LLMs for coverage determination
