# Project Plan — Historical Coverage Explorer

> Five-Phase Implementation Plan
> Status: Phase 1 in progress

---

## Phase 1 — Repository, Product Documentation, Architecture, and Basic Structure
**Goal:** Create a clean engineering foundation before building features.

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Git repository initialized | ✅ |
| 2 | Monorepo structure created | ✅ |
| 3 | FastAPI skeleton with GET /health | ✅ |
| 4 | React + TypeScript + Vite frontend skeleton | ✅ |
| 5 | PostgreSQL via Docker Compose | ✅ |
| 6 | Backend database configuration (SQLAlchemy 2.x async) | ✅ |
| 7 | Alembic initialized and configured | ✅ |
| 8 | Ruff (backend) and oxlint/prettier (frontend) configured | ✅ |
| 9 | Makefile with dev commands | ✅ |
| 10 | README | ✅ |
| 11 | docs/01-problem-statement.md | ✅ |
| 12 | docs/02-product-requirements.md | ✅ |
| 13 | docs/03-architecture.md | ✅ |
| 14 | docs/04-data-model.md | ✅ |
| 15 | ADR-001 through ADR-005 | ✅ |
| 16 | docs/05-api-contract.md | ✅ |
| 17 | docs/PROJECT_PLAN.md | ✅ |
| 18 | docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md | ✅ |
| 19 | Local startup verified | ✅ |
| 20 | evidence/phase-1-validation.md | ✅ |

---

## Phase 2 — Frontend Product Design and Development
**Goal:** Build the complete visual and interaction experience using mock data.

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Polished application shell with sidebar, top bar & disclaimer | ✅ |
| 2 | Executive overview page with 15-second scenario breakdown | ✅ |
| 3 | Policy dashboard with active vehicles view | ✅ |
| 4 | Soft removal modal with educational notice & acknowledgment | ✅ |
| 5 | Past vehicles view with preserved coverage terms | ✅ |
| 6 | Proof of insurance preview modal (with Phase 3 PDF notice) | ✅ |
| 7 | Coverage history page with effective-dated versions | ✅ |
| 8 | Multi-version advanced demonstration with interactive tester | ✅ |
| 9 | Reusable CoverageTimeline component with milestone pins | ✅ |
| 10 | File Claim workflow with point-in-time coverage lookup | ✅ |
| 11 | Jan 10 COVERAGE_FOUND state & pinned version claim creation | ✅ |
| 12 | Jan 20 REQUIRES_MANUAL_REVIEW state & manual review workflow | ✅ |
| 13 | Audit trail with category filters & JSON metadata inspector | ✅ |
| 14 | Architecture & About page with 3-tier pipeline & 6 decisions | ✅ |
| 15 | Reset demo control restoring canonical baseline | ✅ |
| 16 | Decoupled mock service layer (policy, vehicle, coverage, claim, audit) | ✅ |
| 17 | Zero-error TypeScript compilation & oxlint checks | ✅ |
| 18 | Automated browser verification using headless Chrome | ✅ |
| 19 | 10 verified application screenshots in evidence/screenshots/ | ✅ |
| 20 | Frontend documentation (docs/06-frontend-design.md) & validation log | ✅ |

**Status:** ✅ COMPLETE

---

## Phase 3 — Backend, Database, APIs, and Full Integration
**Goal:** Replace mock behavior with real persistence and deterministic historical lookup.

Key deliverables:
- ORM models (Policy, Vehicle, CoverageVersion, Claim, AuditEvent)
- Alembic migration (initial schema)
- Demo seed/reset endpoint
- Vehicle removal transaction (atomic)
- Effective-dated coverage lookup
- Claim creation with coverage pinning
- Manual review path
- Audit event recording
- Proof-of-insurance PDF (ReportLab, DEMO ONLY)
- Frontend/backend integration
- Complete canonical demo scenario

**Status:** NOT STARTED — awaiting authorization

---

## Phase 4 — Testing, Observability, Logs, Audit Evidence, and Demonstration Proof
**Goal:** Prove the product behaves correctly with automated tests and structured observability.

Key deliverables:
- Backend tests (pytest):
  - Coverage found for date during active period
  - Claim filed after removal finds historical coverage
  - Date after removal returns no coverage match
  - Multiple coverage versions select correct historical version
  - Claim coverage_version_id is stable after policy changes
  - Vehicle removal does not delete historical records
  - Invalid date ranges are rejected
- Frontend tests (Vitest + React Testing Library)
- End-to-end tests (Playwright):
  - Scenario A: Covered historical claim
  - Scenario B: Post-removal uncovered date
  - Scenario C: Historical coverage version selection
- Structured application logging (structlog or equivalent)
- Correlation/request IDs on all log lines
- Evidence folder with test results and screenshots

**Status:** NOT STARTED — awaiting authorization

---

## Phase 5 — Handoff, Demo Package, Documentation, and Presentation Support
**Goal:** Make the repository understandable to a recruiter, PM, Tech Lead, or developer.

Key deliverables:
- docs/08-demo-guide.md
- docs/09-handoff.md
- docs/10-future-improvements.md
- HANDOFF.md
- DEMO_SCRIPT.md (2–3 minute walkthrough)
- ONE_PAGER.md
- TECHNICAL_DEEP_DIVE.md
- PRODUCT_DECISIONS.md
- docs/presentation-outline.md
- Screenshot-to-slide mapping

**Status:** NOT STARTED — awaiting authorization
