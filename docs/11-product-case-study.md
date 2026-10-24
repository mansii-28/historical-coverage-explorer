# 11 — Product Case Study: Historical Coverage Explorer

> **Independent Concept Prototype**
> *Inspired by a real product-engineering problem discussed during the interview process. Uses synthetic data only and does not represent any company's proprietary architecture, data, or business processes. Not an official Tint product.*

---

## 1. Executive Summary

In embedded insurance and fleet management platforms, vehicles are frequently added and removed from active policies. When an accident occurs on Monday, but the customer removes the vehicle on Wednesday, what happens when a claim is filed three weeks later?

In naive "current-state" architectures, deleting or unlinking the vehicle causes the claims engine to search current active inventory, fail to find the vehicle, and erroneously reject the claim or trigger emergency support escalation.

**Historical Coverage Explorer** is a working concept prototype that solves this challenge through **effective-dated temporal record modeling** and **immutable claim pinning**. It proves that historical coverage can deterministically survive active-state changes, protecting both customer trust and carrier risk.

---

## 2. The Problem & Customer Risk

### The Business Reality
Insurance policy management does not operate in static snapshots. Policies and coverage terms evolve along a continuous timeline:
- Fleets add, replace, and retire vehicles continuously.
- Deductibles and liability limits adjust upon policy renewals or endorsement updates.
- Claims are filed days, weeks, or even months after an incident occurs (the **date of loss**).

### The Customer & Operational Risk
When an engineering system couples *claim eligibility* to *current active fleet state*, severe customer and business failures occur:
1. **Unjustified Claim Denials:** A legitimate claim for an accident that occurred while fully covered is rejected simply because the policyholder updated their fleet before filing.
2. **Support Escalation & Friction:** Customers are forced to submit manual proof-of-insurance documents, contact operations teams, and wait through prolonged investigation cycles.
3. **Audit & Regulatory Non-Compliance:** Insurance regulators and underwriting partners require strict point-in-time proof of what terms governed on any given day. A system that cannot recreate past truth violates carrier compliance covenants.

---

## 3. Product Requirements

A robust historical policy system must satisfy five primary product criteria:

1. **Temporal Determinism:** Given any vehicle identifier and any date of loss, the system must deterministically return the exact coverage terms (coverage type, deductible, liability limit) in effect on that date.
2. **Non-Destructive Fleet Lifecycle:** Removing a vehicle from the active user interface must update its operational status without destroying or mutating historical coverage records.
3. **Immutable Claim Context:** Once a claim is filed, its associated coverage terms must be frozen at the moment of evaluation. Subsequent policy cancellations, renewals, or endorsements must never alter the terms pinned to that claim.
4. **Safe Failure Modes:** If an incident date falls outside verified coverage windows, the system must **route the claim for manual review** rather than executing an automated denial. Automated rejection without human review creates extreme brand and legal risk.
5. **Durable Business Auditability:** Every lifecycle change (policy creation, vehicle addition, vehicle removal, coverage change, claim filing) must be durably recorded in an immutable audit ledger separate from transient server logs.

---

## 4. Options Considered

| Architectural Option | How It Works | Why It Fails or Succeeds |
| :--- | :--- | :--- |
| **Option A: Current-State Only** | Tables store only what is currently active (`is_active = true`). Removing a vehicle sets `deleted_at = now()` or drops the row. | **Rejected:** Completely breaks retrospective claims. Claim filed after removal finds no active record. |
| **Option B: Application Caching Layer** | Store historical states in Redis / Memcached snapshots keyed by date. | **Rejected:** **Cache is not a source of truth.** Caches are ephemeral, susceptible to eviction, cache-invalidation bugs, and lack relational integrity for claims and audit trails. Caching can optimize reads, but durable database records must govern truth. |
| **Option C: Pure Event Sourcing** | Store only raw domain events (`VehicleAdded`, `VehicleRemoved`) and replay the event log to compute coverage on date $T$. | **Considered but deferred:** High conceptual complexity, complex temporal queries, event schema migration overhead, and steep learning curve for operational teams. |
| **Option D: Effective-Dated Versioning (Chosen)** | Relational model with half-open temporal intervals (`valid_from <= date < valid_to`). Pointers freeze historical versions to claims. | **Selected:** Mathematically deterministic, clean SQL indexing, native relational foreign-key integrity, fully auditable, and intuitive for product and engineering stakeholders alike. |

---

## 5. The Chosen Product Architecture

### Core Design Principles
1. **Half-Open Temporal Windows:** Coverage intervals are represented as `[valid_from, valid_to)`, where `valid_from` is inclusive and `valid_to` is exclusive. A `valid_to` value of `NULL` represents active, open-ended coverage. This prevents ambiguous date-boundary overlap while covering every continuous calendar second.
2. **Soft Removal as an Operational Boundary:** Removing a vehicle stamps `removed_at = effective_date` on the vehicle and closes the active coverage version by setting `valid_to = effective_date`. The historical record remains intact in PostgreSQL.
3. **Claim Pinning:** When a claim is created, it stores a foreign key `coverage_version_id` pointing directly to the specific `CoverageVersion` record that governed on the date of loss. Even if the policyholder changes deductibles or cancels the policy later, the claim’s legal context is permanently locked.
4. **Deterministic SQL Engine (No LLM in the Loop):** Coverage determination is executed by deterministic relational SQL queries. AI is not permitted in the core coverage decision path to prevent hallucination and maintain strict regulatory explainability.

---

## 6. Core User Journey: The Canonical Scenario

To demonstrate these principles concretely, the prototype implements an end-to-end real-world user journey:

```text
Jan 1, 2026: Coverage begins for 2024 BMW X3 ($500 deductible, $100K liability).
      ↓
Jan 10, 2026: Accident occurs (Date of Loss).
      ↓
Jan 15, 2026: Customer removes the BMW from their active fleet.
      ↓
Feb 10, 2026: Customer files a claim for the Jan 10 accident.
```

### What the User Experiences:
1. **Active Fleet View:** On Jan 1, the BMW X3 appears in the customer's active vehicle list.
2. **Vehicle Removal:** When the customer removes the BMW on Jan 15, the modal clearly explains: *"Historical coverage records will be preserved."* The BMW moves to a "Past Vehicles" section with an explicit `HISTORICAL` badge.
3. **Coverage Evaluation:** When filing the Feb 10 claim, the user inputs Date of Loss = `2026-01-10`. The system queries temporal tables and immediately returns:
   - **Status:** `COVERAGE_FOUND`
   - **Governing Version:** Version 1 (Effective Jan 1 &rarr; Jan 15)
   - **Terms:** Comprehensive, $500 Deductible, $100,000 Liability
4. **Claim Submission:** The claim is submitted with `claim_number` generated and `coverage_version_id` permanently pinned.
5. **Edge Case Validation (Jan 20 Incident):** If the customer tests an incident date of `2026-01-20` (after removal), the system returns `REQUIRES_MANUAL_REVIEW`. It does not deny the claim outright; it routes it safely for human adjuster verification.

---

## 7. Edge Cases & Product Guardrails

| Edge Case | System Behavior | Rationale |
| :--- | :--- | :--- |
| **Incident on exact removal date (Jan 15)** | `REQUIRES_MANUAL_REVIEW` | Half-open interval `[Jan 1, Jan 15)` excludes Jan 15 midnight onward. Policy terms closed at start of removal day; manual review confirms exact timestamp. |
| **Incident on exact start date (Jan 1)** | `COVERAGE_FOUND` | `valid_from` is inclusive; day 1 coverage is fully honored. |
| **Incident before coverage inception (Dec 31, 2025)** | `REQUIRES_MANUAL_REVIEW` | No deterministic active record exists; routes for human review. Zero automated denial. |
| **Multiple overlapping coverage updates** | Prevented at API & database level | Business logic ensures subsequent versions start exactly when prior versions end. |
| **Attempted deletion of historical records** | Prevented by database constraints | Database foreign keys enforce `RESTRICT` on delete for pinned coverage versions. |

---

## 8. What the Prototype Demonstrates

1. **Product Intuition:** Demonstrates a deep understanding of the insurance domain, where policy history must be decoupled from current operational status.
2. **Engineering Rigor:** Built with modern web technologies (React 19, FastAPI, SQLAlchemy 2.x async, Neon PostgreSQL) and verified with 58 automated test cases: 39 backend, 14 frontend, 5 Playwright E2E, plus a separate 12-step public deployment verification.
3. **Observability & Traceability:** Distinguishes between operational diagnostic logs (stdout JSON with correlation IDs) and legal business history (PostgreSQL JSONB audit ledger).
4. **Cloud Deployment:** Deployed live on Vercel at `https://historical-coverage-explorer.vercel.app` with serverless connection pooling, migration safety, and zero deployment downtime.

---

## 9. Proposed Success Metrics & Hypotheses to Validate

Because this project is a concept prototype validated with synthetic data, business impact cannot be claimed as an achieved historical result. Instead, if deployed into an enterprise insurance platform, I would validate the following core hypotheses:

### Hypothesis 1: Erroneous Retrospective Rejection Rate
- **Metric to Validate:** Percentage of retrospective claims erroneously rejected due to post-incident fleet modifications.
- **Expected Directional Hypothesis:** By decoupling date-of-loss resolution from active fleet status, erroneous rejections on valid retrospective claims should approach zero.
- **Validation Method:** Measure dispute and appeal rates on claims filed after fleet removal dates against pre-deployment baselines.

### Hypothesis 2: Claims Adjuster Handling Time
- **Metric to Validate:** Mean time to verify historical coverage terms during claims intake (First Notice of Loss).
- **Expected Directional Hypothesis:** Deterministic point-in-time term resolution should eliminate manual policy schedule lookups, reducing initial coverage triage time.
- **Validation Method:** Time-motion study tracking claims adjuster intake latency before and after introducing automated historical versioning.

### Hypothesis 3: Operational Support Burden & Escalations
- **Metric to Validate:** Volume of operational support tickets filed by fleet managers regarding "missing" or unlinked vehicles for recent accidents.
- **Expected Directional Hypothesis:** Preserving removed vehicles in historical views with explicit status indicators should reduce customer confusion and inbound escalation calls.
- **Validation Method:** Support ticket categorization tagging "vehicle removed before claim filed" inquiries.

---

## 10. What I Would Validate with Real Stakeholders Next

If moving this concept into an enterprise production roadmap, the next research and validation priorities would be:
- **Underwriting & Carrier Partnerships:** Aligning on exact time-of-day boundary conventions (e.g., standard 12:01 AM local time vs UTC timestamps).
- **Adjuster Experience:** Designing the manual review workflow and exception handling interface for claims flagged as `REQUIRES_MANUAL_REVIEW`.
- **Complex Fleet Endorsements:** Modeling mid-term policy endorsements where retroactive rate adjustments occur across multiple vehicles simultaneously.
- **Enterprise Authorization:** Implementing role-based access control (RBAC) separating customer fleet managers, claims adjusters, and audit compliance officers.

---

*This case study was prepared as part of the Historical Coverage Explorer project. All data and personas are synthetic.*
