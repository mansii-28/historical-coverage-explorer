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

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Real SQLAlchemy 2.x models (Policy, Vehicle, CoverageVersion, Claim, AuditEvent) | ✅ |
| 2 | PostgreSQL 14+ database and Alembic migration (`create_initial_schema`) | ✅ |
| 3 | Check constraint `valid_to IS NULL OR valid_to > valid_from` & indexes | ✅ |
| 4 | Deterministic canonical demo reset endpoint (`POST /api/demo/reset`) with table truncation & sequence restart | ✅ |
| 5 | Atomic vehicle removal transaction (`POST /api/vehicles/{id}/remove`) with soft-delete & coverage closure | ✅ |
| 6 | Point-in-time deterministic coverage lookup service & endpoints (`GET /api/vehicles/{id}/coverage`, `POST /api/coverage/check`) | ✅ |
| 7 | Coverage history endpoint (`GET /api/vehicles/{id}/coverage-history`) | ✅ |
| 8 | Claim creation service (`POST /api/claims`) with date-of-loss lookup & coverage version pinning | ✅ |
| 9 | Uncovered claim routing to `REQUIRES_MANUAL_REVIEW` / `MANUAL_REVIEW` (no automated denial) | ✅ |
| 10 | Immutable domain audit events service & endpoints (`GET /api/policies/{id}/audit-events`) with JSONB metadata | ✅ |
| 11 | Version-specific proof-of-insurance PDF generator (`GET /api/coverage/{id}/proof.pdf`) via ReportLab with watermark & disclaimer | ✅ |
| 12 | Frontend service abstraction integration (`policyService`, `vehicleService`, `coverageService`, `claimService`, `auditService`) calling real FastAPI endpoints | ✅ |
| 13 | Explicit API mode with error banner and retry UI; zero silent fallbacks to mocks | ✅ |
| 14 | Proof-of-insurance modal updated to download live PDF from API | ✅ |
| 15 | Canonical end-to-end browser walkthrough verified against live PostgreSQL | ✅ |
| 16 | Browser reload persistence tests verified (vehicles, claims, audit trail preserved across reloads) | ✅ |
| 17 | Database state verified with PostgreSQL CLI and saved to `evidence/database/` | ✅ |
| 18 | Live API screenshots saved to `evidence/screenshots/11-14` | ✅ |
| 19 | Zero linter errors (`ruff check .` & `oxlint src/`), clean TypeScript build | ✅ |
| 20 | Comprehensive backend integration documentation (`docs/07-backend-integration.md`) & ADR-006 | ✅ |

**Status:** ✅ COMPLETE

---

## Phase 4 — Testing, Observability, Logs, Audit Evidence, and Demonstration Proof
**Goal:** Prove the product behaves correctly with automated tests and structured observability.

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Isolated PostgreSQL test database (`historical_coverage_test`) with fail-fast safety guard | ✅ |
| 2 | Backend test suite (30 pytest tests, 89% total coverage, domain services at 93%–98%) | ✅ |
| 3 | Temporal boundary coverage tests (inclusive `valid_from`, exclusive `valid_to`, day before) | ✅ |
| 4 | Vehicle soft-removal and 409 conflict tests | ✅ |
| 5 | Claim creation, historical lookup, and version pinning immutability tests | ✅ |
| 6 | Manual review routing tests with verification of zero "Claim Denied" text | ✅ |
| 7 | Foreign key `RESTRICT` delete-protection tests at the database layer | ✅ |
| 8 | Version-specific ReportLab PDF generation and watermark verification tests | ✅ |
| 9 | Structured JSON logging with `structlog` and contextvars | ✅ |
| 10 | Request-scoped correlation IDs & `CorrelationIdMiddleware` with `duration_ms` timing | ✅ |
| 11 | Sensitive data protection with automatic VIN masking (`••••-001`) | ✅ |
| 12 | Frontend component tests (11 vitest tests across 4 test files) | ✅ |
| 13 | Playwright E2E suite (4 core walkthrough scenarios in Chromium) | ✅ |
| 14 | Reload persistence verification across PostgreSQL persistence | ✅ |
| 15 | Live 6-request demonstration correlation trace (`sample-application-logs.jsonl`) | ✅ |
| 16 | Trace explanation & operational logs vs domain audit comparison (`correlation-trace.md`) | ✅ |
| 17 | Comprehensive Testing Strategy documentation (`docs/08-testing-strategy.md`) | ✅ |
| 18 | Comprehensive Observability documentation (`docs/09-observability.md`) | ✅ |
| 19 | Test summary report with metrics table (`evidence/test-summary.md`) | ✅ |
| 20 | Complete validation report (`evidence/phase-4-validation.md`) & updated Makefile targets | ✅ |

**Status:** ✅ COMPLETE

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
