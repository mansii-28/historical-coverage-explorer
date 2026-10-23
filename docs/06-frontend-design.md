# Frontend Design & Product Architecture

> **Prototype:** Historical Coverage Explorer  
> **Document:** `docs/06-frontend-design.md`  
> **Phase:** Phase 2 Complete  
> **Status:** Approved Baseline  

---

## 1. Information Architecture

The Historical Coverage Explorer frontend is organized around an executive-first, interview-ready workflow designed to clarify the principle of **effective-dated insurance coverage**:

```
Application Shell
├── Top Navigation Bar
│   ├── Branding & System Identity
│   ├── Phase 2 Mock Service Indicator
│   ├── Demo Mode Pill
│   └── Reset Demo Trigger (with Confirmation Modal)
├── Left Navigation Sidebar
│   ├── Overview & Lifecycle (Executive summary & baseline timeline)
│   ├── Policy & Vehicles (Active vehicles, soft-removal modal, past vehicles)
│   ├── File Claim (Point-in-time lookup, covered vs. manual review, pinned claim)
│   ├── Coverage History (Version breakdown, multi-version evaluator)
│   ├── Audit Trail (Immutable event ledger, category filtering, JSON inspector)
│   └── Architecture & About (3-tier target pipeline, 6 core product decisions)
└── Persistent Legal & Engineering Disclaimer (Footer)
```

---

## 2. Design Principles

1. **Clarity Over Complexity:** Insurance temporal concepts (point-in-time queries, half-open intervals) are inherently complex. The UI uses visual metaphors (milestone bars, color-coded intervals, and comparison cards) so an interviewer understands the domain scenario in under 15 seconds.
2. **Deterministic & Explainable:** Every result displays *why* an evaluation was made. For Jan 10, the UI highlights that the accident fell inside $[2026\text{-}01\text{-}01, 2026\text{-}01\text{-}15)$. For Jan 20, it explicitly shows that the accident occurred outside the coverage window.
3. **Non-Destructive Workflows:** Visual states distinguish between "Active" and "Historical" entities without burying or destroying past data.
4. **No Automated Claim Rejection:** If coverage is not automatically matched, the system routes the claim to `REQUIRES_MANUAL_REVIEW`. The UI never says "Claim Denied" or "Claim Rejected".
5. **Aesthetic Excellence:** Slate-950 dark background, emerald/amber/indigo semantic color tokens, Inter font hierarchy, micro-interactions, responsive flex/grid layouts, and zero visual clutter.

---

## 3. Page Inventory

| View / Page | Primary Objective | Key Components |
|---|---|---|
| **Overview & Lifecycle** | Rapid executive context and visual lifecycle representation | `OverviewPage`, `CoverageTimeline`, StatCards, Scenario Callouts |
| **Policy & Vehicles** | Active vehicle management, soft-removal workflow, and past vehicles view | `PolicyPage`, `RemoveVehicleModal`, `ProofOfInsuranceModal`, Vehicle Cards |
| **File Claim** | Retrospective point-in-time coverage verification and claim creation | `FileClaimPage`, `CoverageTimeline`, `ProofOfInsuranceModal`, Verification Cards |
| **Coverage History** | Temporal version audit and multi-version interactive simulator | `CoverageHistoryPage`, `CoverageTimeline`, Advanced Versioning Drawer |
| **Audit Trail** | Compliance verification and auditability inspection | `AuditTrailPage`, Event Category Filters, JSON Metadata Inspector |
| **Architecture & About** | Technical architecture visualization and design decision justification | `ArchitecturePage`, 3-Tier Pipeline Flowchart, 6 Decision Cards |

---

## 4. State Management Architecture

State is managed through a central `DemoProvider` React context backed by deterministic seed fixtures (`src/data/fixtures.ts`):

- **Single Source of Truth:** `DemoState` contains `policy`, `vehicles`, `coverageVersions`, `claims`, and `auditEvents`.
- **Decoupled Architecture:** Components do not interact directly with raw fixture constants or state mutations; all mutations pass through the service layer (`src/services/`).
- **Repeatable Demonstrations:** A dedicated `resetDemo()` method restores the state to the initial baseline with zero page reloads.

---

## 5. Mock API Abstraction Layer

The application implements an explicit service layer that mirrors the target REST API:

- `policyService.ts` &rarr; `GET /api/policies/{id}`
- `vehicleService.ts` &rarr; `GET /api/policies/{id}/vehicles`, `POST /api/vehicles/{id}/remove`
- `coverageService.ts` &rarr; `GET /api/vehicles/{id}/coverage-history`, `POST /api/coverage/check`
- `claimService.ts` &rarr; `GET /api/claims`, `POST /api/claims`
- `auditService.ts` &rarr; `GET /api/policies/{id}/audit-events`

Each mock service incorporates realistic asynchronous latency (250ms–400ms) to trigger loading states, spinners, and disable state while requests are in flight.

---

## 6. Key UX Decisions

1. **Soft Removal Modal:**
   - Displays clear educational notices: *"Removing this vehicle stops future active coverage but preserves historical policy and coverage records."*
   - Requires explicit checkbox acknowledgment before enabling the confirm button: *"I understand historical records will remain available for retrospective coverage lookups and claims."*
2. **Claim Coverage Pinning:**
   - Upon claim submission, the matched `coverage_version_id` is frozen onto the claim record.
   - The confirmation screen explicitly highlights: *"Coverage Version 1 has been pinned to this claim so future policy changes or vehicle deletions do not silently alter its historical context."*
3. **Manual Review Route:**
   - For an out-of-interval date of loss (Jan 20, 2026), the system routes to `REQUIRES_MANUAL_REVIEW` rather than rejecting the claim.
4. **Proof of Insurance Preview:**
   - Renders a clean certificate of insurance with an explicit `DEMO ONLY — NOT A REAL INSURANCE DOCUMENT` watermark and a clear note indicating official PDF generation is delivered in Phase 3.

---

## 7. Accessibility (a11y)

- **Semantic HTML:** Native `<main>`, `<aside>`, `<header>`, `<footer>`, `<nav>`, `<button>`, `<form>`, and `<label>` elements.
- **ARIA Standards:** Modals implement `role="dialog"`, `aria-modal="true"`, focus trapping, `Escape` key listeners, and body scroll locking.
- **Color Contrast & Redundancy:** Badges and alerts use both distinct icons and text labels (e.g., `<CheckCircle2 />` for Active/Success, `<Clock />` for Historical, `<AlertTriangle />` for Manual Review) so information is never conveyed by color alone.
- **Keyboard Navigation:** All interactive elements support keyboard tab focus with visible focus rings.

---

## 8. Migration to Phase 3 Backend

To transition from Phase 2 mock mode to Phase 3 live PostgreSQL backend:
1. Replace internal service delay and state modifications in `src/services/*.ts` with real `fetch()` calls to the FastAPI backend (`http://localhost:8000/api/...`).
2. Update `DemoContext.tsx` to fetch initial state from `GET /api/policies/1` and `POST /api/demo/reset`.
3. Wire the "Download PDF" button in `ProofOfInsuranceModal` to trigger `GET /api/coverage/proof.pdf`.
4. The component layer requires zero structural changes because of the strict API abstraction layer.
