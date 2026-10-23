# Historical Coverage Explorer

> **Effective-Dated Insurance Coverage Prototype**

> ⚠️ _Concept prototype built as a product and engineering thought exercise. Uses synthetic data only and does not represent any company's production architecture._

---

## What This Is

This prototype demonstrates a core product principle in insurance policy management:

**Removing a vehicle from an active policy is not the same as destroying its history.**

When a customer removes a vehicle from their policy, then later files a claim for a loss that occurred *while the vehicle was covered*, the system must be able to answer:

> "What coverage existed for this vehicle on the date of loss?"

This prototype uses **effective-dated versioning** to make that question answerable, auditable, and reliable.

---

## Business Scenario

| Date | Event |
|------|-------|
| Jan 1, 2026 | Coverage begins for a 2024 BMW X3 |
| Jan 10, 2026 | Accident occurs (date of loss) |
| Jan 15, 2026 | Customer removes BMW from active policy |
| Feb 10, 2026 | Customer files a claim for the Jan 10 accident |

**Expected result:** The system finds coverage for January 10, even though the vehicle was removed on January 15 and the claim was filed on February 10.

---

## Architecture

```
React + TypeScript + Vite (frontend)
         │  HTTP / REST
FastAPI + SQLAlchemy 2.x (backend)
         │  PostgreSQL driver (psycopg)
PostgreSQL 14+ (database; Docker Compose targets 16)
```

All services are orchestrated with Docker Compose.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic |
| Database | PostgreSQL 14+ (validated locally on 14; Docker Compose targets 16) |
| PDF | ReportLab (Phase 3) |
| Testing | pytest, Vitest, Playwright (Phase 4) |
| Containerization | Docker, Docker Compose |

---

## How to Run Locally

### Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Health: http://localhost:8000/health

### Local development (without Docker)

**Prerequisites:** Python 3.12+, Node 22+, PostgreSQL 14+

```bash
# 1. Install all dependencies
make setup

# 2. Start both servers concurrently
make dev
```

Or start individually:

```bash
make backend    # FastAPI on :8000
make frontend   # Vite on :5173
```

### Database migrations

```bash
make db-upgrade           # Apply all migrations
make db-revision MSG="describe your change"  # Create a new migration
```

---

## Project Structure

```
historical-coverage-explorer/
├── apps/
│   ├── backend/           Python FastAPI application
│   │   ├── app/
│   │   │   ├── api/       Route handlers
│   │   │   ├── core/      Configuration
│   │   │   ├── db/        Database session & base
│   │   │   ├── models/    SQLAlchemy ORM models (Phase 3)
│   │   │   ├── schemas/   Pydantic schemas (Phase 3)
│   │   │   └── services/  Business logic (Phase 3)
│   │   ├── alembic/       Database migrations
│   │   └── requirements.txt
│   └── frontend/          React + TypeScript + Vite application
│       └── src/
│           └── lib/api.ts  API abstraction layer
├── docs/                  Product and architecture documentation
│   └── decisions/         Architecture Decision Records (ADRs)
├── evidence/              Validation and test evidence
├── scripts/               Utility scripts
├── .env.example           Environment variable template
├── docker-compose.yml     Local infrastructure
└── Makefile               Development commands
```

---

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | Repository, docs, architecture, foundation |
| **Phase 2** | ✅ Complete | Frontend product design, interactive workflows, mock services |
| **Phase 3** | ✅ Complete | Backend, PostgreSQL 14+, APIs, domain logic, PDF, full frontend integration |
| Phase 4 | ⏳ Pending | Tests, observability, evidence |
| Phase 5 | ⏳ Pending | Handoff and demo package |

---

## Phase 3 Screenshots (Live PostgreSQL & FastAPI Integration)

Live system integration has been fully verified and captured in `evidence/screenshots/`:

| Screenshot | Description |
|---|---|
| `11-live-api-policy.png` | Live Policy view backed by PostgreSQL, showing canonical active 2024 BMW X3 |
| `12-live-api-covered-claim.png` | Live claim creation with date of loss Jan 10 pinned to Coverage Version 1 |
| `13-live-api-manual-review.png` | Live claim submission for Jan 20 routed to REQUIRES_MANUAL_REVIEW |
| `14-live-audit-events.png` | Live immutable audit trail querying PostgreSQL JSONB domain events |

### Phase 2 Reference Screenshots

| Screenshot | Description |
|---|---|
| `01-overview.png` | Executive dashboard & canonical lifecycle timeline |
| `02-active-policy.png` | Active policy view with 2024 BMW X3 |
| `03-remove-vehicle.png` | Soft vehicle removal modal with date & educational acknowledgment |
| `04-past-vehicle.png` | Past Vehicles section with Historical badge and preserved terms |
| `05-coverage-history.png` | Effective-dated coverage version list and timeline |
| `06-covered-claim.png` | Historical coverage lookup returning COVERAGE_FOUND for Jan 10 |
| `07-claim-pinned-coverage.png` | Created claim with pinned coverage version confirmation |
| `08-manual-review.png` | Uncovered Jan 20 lookup routing to REQUIRES_MANUAL_REVIEW |
| `09-audit-trail.png` | Immutable system audit log with category filters and JSON inspector |
| `10-architecture.png` | Visual 3-tier system architecture and 6 foundational product decisions |

---

## Make Commands

```bash
make help         # Show all commands
make setup        # Install backend and frontend dependencies
make dev          # Start both servers concurrently
make backend      # Start FastAPI dev server only
make frontend     # Start Vite dev server only
make up           # Start all services via Docker Compose
make down         # Stop Docker Compose services
make lint         # Run ruff (backend) + oxlint (frontend)
make format       # Format backend (ruff) + frontend (prettier)
make db-upgrade   # Apply Alembic migrations
make test-backend # Run pytest with coverage (Phase 4)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Problem Statement](docs/01-problem-statement.md) | Customer problem, timeline, goals |
| [Product Requirements](docs/02-product-requirements.md) | User stories, acceptance criteria |
| [Architecture](docs/03-architecture.md) | System design with diagrams |
| [Data Model](docs/04-data-model.md) | Domain model and schema |
| [API Contract](docs/05-api-contract.md) | Endpoint documentation |
| [Frontend Design](docs/06-frontend-design.md) | Frontend architecture, design system, and mock abstraction |
| [Backend Integration](docs/07-backend-integration.md) | Backend architecture, database schema, transactions, domain logic & PDF |
| [Phase 3 Validation Evidence](evidence/phase-3-validation.md) | Verification logs, database query evidence, browser persistence proof |
| [Project Plan](docs/PROJECT_PLAN.md) | Five-phase implementation plan |
| [Assumptions](docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md) | Known assumptions and open questions |
| [ADR-001](docs/decisions/ADR-001-effective-dated-history.md) | Why effective-dated records, not cache |
| [ADR-002](docs/decisions/ADR-002-soft-removal.md) | Why soft deletion preserves history |
| [ADR-003](docs/decisions/ADR-003-claim-coverage-pinning.md) | Why claims pin to a coverage version |
| [ADR-004](docs/decisions/ADR-004-deterministic-coverage.md) | Why no AI for coverage decisions |
| [ADR-005](docs/decisions/ADR-005-audit-vs-logs.md) | Why audit events and app logs are separate |
| [ADR-006](docs/decisions/ADR-006-date-only-effective-coverage-boundaries.md) | Half-open date intervals and application overlap validation |
| [ADR-007](docs/decisions/ADR-007-historical-delete-protection.md) | Restrictive foreign keys and historical deletion protection |

---

## Disclaimer

This project uses entirely synthetic data. Customer names, policy numbers, VINs, and all other identifiers are fictional. This prototype does not represent any real company's architecture, data, or business processes. It does not perform real insurance adjudication.
