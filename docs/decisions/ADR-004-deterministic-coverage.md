# ADR-004: Use Deterministic SQL for Coverage Lookup (No AI or ML)

**Status:** Accepted
**Date:** 2026-10-22
**Deciders:** Prototype architecture

---

## Context

The system must determine whether a vehicle had active coverage on a specific historical date.

One could imagine using machine learning, a rules engine, or a language model to assist in this determination. This ADR evaluates whether any such approach is appropriate here.

---

## Decision

Coverage determination uses a **deterministic SQL query** against effective-dated database records. No AI, machine learning, or probabilistic scoring is involved.

The query is:
```sql
SELECT *
FROM coverage_versions
WHERE vehicle_id = :vehicle_id
  AND valid_from <= :date_of_loss
  AND (valid_to IS NULL OR :date_of_loss < valid_to)
ORDER BY valid_from DESC
LIMIT 1;
```

This returns a single, unambiguous result.

---

## Why Not AI / LLMs?

| Concern | Why It Matters Here |
|---------|---------------------|
| **Determinism** | Coverage determination must produce the same answer every time for the same inputs. AI systems are probabilistic. |
| **Auditability** | A court, regulator, or adjuster can verify a SQL query. They cannot audit a neural network's decision. |
| **Explainability** | "The record shows valid_from = Jan 1, valid_to = Jan 15, and the date of loss is Jan 10" is a clear explanation. |
| **Regulatory appropriateness** | Insurance coverage decisions require human accountability. AI cannot substitute for licensed underwriter judgment. |
| **Unnecessary complexity** | The problem is a straightforward date-range lookup. AI adds complexity without adding value. |
| **Correctness confidence** | SQL with well-defined date boundaries is provably correct. LLM outputs can hallucinate. |

---

## Consequences

**Positive:**
- Coverage determination is reliable, reproducible, and explainable.
- No model training, versioning, or inference infrastructure needed.
- Results can be verified by any developer, tester, or auditor.
- No probabilistic uncertainty in a high-stakes decision context.

**Negative / Trade-offs:**
- Cannot handle ambiguous edge cases automatically (e.g., overlapping coverage versions). These must be prevented at the data layer or escalated to manual review.
- Assumes clean, well-maintained data. Data quality issues will produce incorrect query results, not graceful degradation.

---

## Manual Review Safety Net

When the SQL query returns no result, the system **does not reject the claim**. Instead:
- `coverage_verification_status = REQUIRES_MANUAL_REVIEW`
- `coverage_version_id = NULL`
- A human adjuster evaluates the claim

This is the appropriate safety net for cases where automated determination is insufficient — not an AI model.

---

## Future Consideration

AI/ML tools might be useful in **adjacent** workflows — e.g., fraud detection, claim triage, or policy recommendation — but not for the deterministic historical coverage lookup at the center of this prototype.

---

## Related

- ADR-001: Effective-dated records are the source of truth.
- FR-005: Manual review safety requirement.
