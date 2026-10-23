# Product Requirements

> **Prototype:** Historical Coverage Explorer
> **Document:** docs/02-product-requirements.md
> **Status:** Phase 1

---

## Personas

### Jordan Lee — Insured Customer
- Has a vehicle on an active insurance policy
- May remove a vehicle and later file a claim for a prior loss
- Expects the system to know what coverage they had, even after removing the vehicle

### Claims Adjuster — Insurance Operations Staff
- Investigates claims after they are filed
- Needs to verify what coverage existed on the date of loss
- Needs an auditable, immutable record — not a best-guess reconstruction
- Must be able to generate proof-of-insurance documentation from historical data

### Policy Administrator — Insurance Operations Staff
- Manages active policies
- Needs to remove vehicles without accidentally destroying historical records
- Needs a complete audit trail for compliance and investigation purposes

---

## User Stories

### Active Policy Management

**US-001**
> As Jordan Lee, I want to view my active policy and see the vehicles currently covered, so I know what is insured today.

**US-002**
> As Jordan Lee, I want to remove a vehicle from my active policy with an effective date, so that coverage stops from that date forward.

**US-003**
> As Jordan Lee, I want to see a clear confirmation that removing a vehicle preserves my historical coverage records, so I understand that my history is not destroyed.

---

### Historical Coverage

**US-004**
> As a Claims Adjuster, I want to query coverage for a specific vehicle on a specific date, so I can determine what was covered on the date of loss.

**US-005**
> As a Claims Adjuster, I want to see all coverage versions that existed for a vehicle over time, so I can understand how coverage changed.

**US-006**
> As a Claims Adjuster, I want to generate a proof-of-insurance document from historical coverage data, so I have a formal record to attach to a claim file.

---

### Claims

**US-007**
> As Jordan Lee, I want to file a claim by specifying the date of loss, so the system finds the correct historical coverage automatically.

**US-008**
> As Jordan Lee, I want to see which coverage version was matched to my claim, so I understand the basis for coverage evaluation.

**US-009**
> As a Claims Adjuster, I want claims with no automated coverage match to be routed to manual review — not automatically rejected — so eligible customers are not unfairly denied.

**US-010**
> As a Claims Adjuster, I want the coverage version attached to a claim to remain stable, so future policy changes do not silently alter an existing claim's coverage context.

---

### Audit and Transparency

**US-011**
> As a Policy Administrator, I want to see a full audit trail of lifecycle events for a policy, so I can investigate any dispute or question.

**US-012**
> As a Claims Adjuster, I want to see which audit events are related to a specific claim, so I can reconstruct the decision context.

---

## Functional Requirements

### FR-001: Effective-Dated Coverage Records
- Coverage records must carry `valid_from` and `valid_to` dates.
- A coverage record is considered active on a date `d` if: `valid_from <= d < valid_to`.
- If `valid_to` is NULL, coverage is still active.
- Only one active coverage version per vehicle at a time (enforced by service logic).

### FR-002: Soft Vehicle Removal
- When a vehicle is removed from an active policy, it must **not** be hard-deleted.
- The vehicle record must have `removed_at` set to the effective removal date.
- The active coverage version for that vehicle must have `valid_to` set to the effective removal date.
- Removed vehicles must be hidden from the active policy view by default.
- Removed vehicles must remain visible in historical views.

### FR-003: Historical Coverage Query
- The system must support querying: "What coverage existed for vehicle X on date D?"
- This query must use the date-of-loss, not the date the query is executed.
- The query must return a deterministic, single matching coverage version.

### FR-004: Claim Coverage Pinning
- When a claim is created with a date of loss:
  - The system performs a historical coverage lookup.
  - If coverage is found: store `coverage_version_id` and set `coverage_verification_status = COVERAGE_FOUND`.
  - If no coverage is found: `coverage_version_id = NULL` and `coverage_verification_status = REQUIRES_MANUAL_REVIEW`.
- The `coverage_version_id` on a claim must not change after claim creation.

### FR-005: Manual Review Safety
- The system must not automatically reject a claim when no automated coverage match is found.
- Claims without a match proceed to `REQUIRES_MANUAL_REVIEW` status.
- This state is distinct from `COVERAGE_FOUND` and must be clearly communicated in the UI.

### FR-006: Proof of Insurance
- The system must generate a DEMO ONLY PDF proof-of-insurance document from historical coverage data.
- Every generated PDF must visibly contain: `DEMO ONLY - NOT A REAL INSURANCE DOCUMENT`.

### FR-007: Audit Events
- All material lifecycle events must be recorded durably as audit events.
- Events must include: policy created, vehicle added, coverage activated, vehicle removed, historical coverage lookup, claim created, claim linked to coverage version, proof of insurance generated.

### FR-008: Seed / Reset
- A demo reset endpoint (`POST /api/demo/reset`) must restore the system to a known, deterministic state.
- The seed scenario uses only synthetic data (Jordan Lee, DEMO-AUTO-1024, DEMO-VIN-001).

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | All timestamps stored in UTC |
| NFR-002 | No real customer data, no real VINs, no real policy numbers |
| NFR-003 | No secrets committed to version control |
| NFR-004 | All Python code passes ruff linting |
| NFR-005 | TypeScript strict mode enabled |
| NFR-006 | API returns appropriate HTTP status codes |
| NFR-007 | Database mutations that span multiple records use transactions |
| NFR-008 | Application logs and audit events are separate concerns |
| NFR-009 | UI clearly communicates active vs. historical state |
| NFR-010 | Prototype disclaimer is visible in the UI |

---

## Acceptance Criteria (MVP)

| # | Criterion | Phase |
|---|-----------|-------|
| AC-001 | Removed vehicle disappears from active view | 3 |
| AC-002 | Removed vehicle remains in historical view | 3 |
| AC-003 | Jan 10 claim finds correct coverage version | 3 |
| AC-004 | Jan 20 claim returns no automated match | 3 |
| AC-005 | Coverage version on a claim does not change after policy update | 3 |
| AC-006 | Audit trail records all lifecycle events | 3 |
| AC-007 | Proof-of-insurance PDF is generated with DEMO ONLY watermark | 3 |
| AC-008 | Manual review path is distinct from rejection | 3 |
| AC-009 | /health returns ok with DB connected | 1 ✅ |

---

## MVP Scope

Phase 1–3 MVP includes:
- Policy dashboard (active vehicles)
- Vehicle removal with effective date
- Past vehicles view
- Coverage history view
- File a claim with date-of-loss lookup
- Coverage found / no match / manual review states
- Historical timeline visualization
- Audit event view
- Proof-of-insurance DEMO PDF
- Demo reset/seed

---

## Out of Scope

- Real carrier integrations
- Authentication / authorization
- Payment processing
- Multi-vehicle accident claims
- Retroactive policy corrections
- Multiple drivers per policy
- Endorsements and mid-term changes
- Production regulatory compliance
- PII handling / encryption at rest
- Production-grade error handling for all edge cases
