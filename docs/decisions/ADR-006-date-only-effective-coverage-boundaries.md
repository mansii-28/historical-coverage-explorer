# ADR-006: Date-Only Effective Coverage Boundaries and Half-Open Intervals

> **Status:** Accepted  
> **Date:** 2026-10-23  
> **Deciders:** Engineering Team, Product Team  
> **Technical Story:** Phase 3 — Backend, PostgreSQL, and Domain Logic  

---

## Context

Insurance policies and vehicle coverage terms are conventionally defined with calendar effective dates rather than microsecond timestamps. When a policyholder removes a vehicle effective January 15, or when terms transition from Version 1 to Version 2 on January 8, the system must deterministically establish whether an incident occurring on a specific date is covered.

Two critical questions arise:
1. **Interval boundary semantics:** If coverage is effective from January 1 to January 15, is an incident on January 15 covered?
2. **Boundary representation:** Should effective periods be modeled as timestamps with timezone offsets or as date-only fields, and how should interval non-overlap be validated?

---

## Decision

We adopt **half-open interval semantics** `[valid_from, valid_to)` with **SQL `DATE` types** for coverage boundaries, enforced through application validation and database check constraints.

### 1. Half-Open Interval Semantics: `[valid_from, valid_to)`
- Coverage is active on date `d` if and only if:
  $$\text{valid\_from} \le d < \text{valid\_to}$$
- If `valid_to` is `NULL`, coverage is active indefinitely:
  $$\text{valid\_from} \le d$$
- **Example:** Coverage from `2026-01-01` to `2026-01-15` covers January 1 through January 14 inclusive. An incident on January 15 is **not** covered by this interval.

### 2. Date-Only Granularity (`DATE` type)
- Effective dates are stored as SQL `DATE` (calendar dates), not timestamps with arbitrary hours/minutes/seconds.
- This prevents timezone conversion bugs (e.g., UTC vs EST midnight boundary shifts) that frequently cause off-by-one errors when querying point-in-time coverage.
- Application logs and `audit_events.event_timestamp` continue to use full UTC `TIMESTAMP WITH TIME ZONE` for precise temporal event sequencing.

### 3. Application-Level Overlap Validation and Database Constraints
- **Database CHECK Constraint:** `valid_to IS NULL OR valid_to > valid_from` prevents invalid inverted ranges.
- **Composite Index:** `ix_coverage_lookup (vehicle_id, valid_from, valid_to)` enables $O(\log N)$ point-in-time index range scans.
- **Application Validation:** `validate_no_coverage_overlap()` evaluates prospective intervals against all existing versions for the vehicle to prevent overlapping active periods.

---

## Consequences

### Positive
- **Deterministic and auditable:** Clear, non-overlapping coverage boundaries prevent ambiguous dual-coverage states on boundary transition dates.
- **Simplicity:** Date-only arithmetic eliminates timezone edge cases in temporal queries across distributed clients and servers.
- **Clear communication:** Customer notices and agent UIs clearly articulate "effective through January 14" when `valid_to = 2026-01-15`.

### Negative / Trade-offs
- Time-of-day precision (e.g., coverage starting at 12:01 PM after purchase) is not modeled in this prototype; in production, endorsements with mid-day effective timestamps would require fractional-day or timestamp interval extensions (e.g., PostgreSQL `tsrange` or `daterange` GiST exclusion constraints).
