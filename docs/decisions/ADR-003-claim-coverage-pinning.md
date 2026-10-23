# ADR-003: Pin Historical Coverage Version to Claims at Creation Time

**Status:** Accepted
**Date:** 2026-10-22
**Deciders:** Prototype architecture

---

## Context

When a claim is created with a `date_of_loss`, the system performs a historical coverage lookup to find the `CoverageVersion` that was active on that date.

The question is: how should this coverage reference be handled over time?

Options:
1. **Re-evaluate on every request** — look up coverage dynamically whenever the claim is viewed.
2. **Pin the reference at creation time** — store the `coverage_version_id` on the claim record and never change it.

---

## Decision

We **pin the `coverage_version_id` to the claim at creation time**.

At the moment a claim is created:
1. The system queries the historical coverage for the given `date_of_loss`.
2. If a match is found, `coverage_version_id` is set on the claim record.
3. This reference is **never automatically changed** after creation.

If the policy is later modified, amended, or re-rated, the existing claim's `coverage_version_id` remains unchanged.

---

## Consequences

**Positive:**
- The claim's coverage context is **immutable** after creation. It reflects the world as it existed at the time of loss.
- Future policy changes cannot silently alter the coverage basis of an existing claim.
- Auditors and adjusters can trust that the `coverage_version_id` on a claim accurately represents what was active on the date of loss — no re-evaluation needed.
- Reduces query complexity: claim coverage context is always a direct record lookup, not a dynamic date-range query.

**Negative / Trade-offs:**
- If a coverage record is corrected retroactively (e.g., due to data entry error), existing claims will not automatically reflect the correction. A manual administrative action would be required.
- The system must handle the `coverage_version_id = NULL` case (no automated match) cleanly.

---

## Rejected Alternative: Dynamic Re-evaluation

Re-querying coverage every time a claim is accessed:

- Creates a risk that policy changes after loss silently alter the apparent coverage basis for a claim.
- Violates the principle that a claim's coverage context should be stable and auditable.
- Makes it harder to explain to adjusters and auditors what coverage was in effect at the time of loss.
- Can produce different results depending on when the query is executed — a non-deterministic outcome for a question that should have a deterministic answer.

---

## Related

- ADR-001: Effective-dated coverage records are the source of truth.
- ADR-002: Soft removal preserves historical records.
- FR-004: Claim coverage pinning requirement.
