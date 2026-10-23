# Assumptions and Open Questions

> **Prototype:** Historical Coverage Explorer
> **Document:** docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md
> **Status:** Phase 1

---

## How to Read This Document

**Assumptions** are decisions made in this prototype where ambiguity exists in the real domain. The prototype proceeds with the stated assumption; a production system would require explicit product and legal decisions.

**Open questions** are questions that a real implementation would need to answer before going to production. This prototype deliberately does not answer them — raising them is itself evidence of product thinking.

---

## Prototype Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A-001 | Coverage effective dates are calendar **dates**, not timestamps | Simplifies the demo. Production systems may need timestamp precision for mid-day changes. |
| A-002 | The end date (`valid_to`) of a coverage period is **exclusive** | `valid_from = Jan 1, valid_to = Jan 15` means covered through Jan 14, not Jan 15. |
| A-003 | Only one active `CoverageVersion` per vehicle at a time is enforced | Production may allow overlapping coverage types (e.g., liability + comprehensive as separate records). |
| A-004 | Demo customer data is entirely synthetic | Jordan Lee, DEMO-AUTO-1024, DEMO-VIN-001 are fictional. |
| A-005 | Vehicle removal is the only trigger that closes a coverage version in this prototype | Production would also close versions on policy cancellation, endorsements, etc. |
| A-006 | No authentication is implemented | Acceptable for a local prototype demonstration. |
| A-007 | Claims are not adjudicated — only coverage is verified | The prototype surfaces COVERAGE_FOUND or REQUIRES_MANUAL_REVIEW. Final adjudication is out of scope. |
| A-008 | A VIN is stored as a string — no real VIN validation is performed | DEMO-VIN-001 is not a valid NHTSA VIN. |
| A-009 | The claim filing date does not affect coverage lookup | Only `date_of_loss` is used for historical coverage query. |
| A-010 | PostgreSQL is the only supported database | Phase 1 does not abstract the database layer for portability. |

---

## Open Questions (Not Answered by This Prototype)

### Coverage Timing and Effective Dates

**Q-001:** What constitutes the exact effective moment of vehicle removal in a real insurance system — midnight on the effective date? The moment the request is submitted? The end of the policy period?

> _This prototype uses calendar date granularity. A production system may require timestamp precision._

**Q-002:** Are policy changes allowed retroactively? If a customer changes their deductible on January 20, can they make it effective January 1?

> _This prototype assumes all changes are effective as of the specified date going forward. Retroactive changes are not modeled._

**Q-003:** Can the same vehicle exist under multiple active policies simultaneously (e.g., primary and secondary coverage)?

> _This prototype models a single policy per vehicle._

**Q-004:** Are coverage effective dates dates or timestamps? What timezone is authoritative?

> _This prototype uses UTC calendar dates. A production system may need to account for the policyholder's timezone._

---

### Records and Retention

**Q-005:** How long must historical policy and coverage documents be retained?

> _Varies by jurisdiction. Not addressed in this prototype._

**Q-006:** Which historical documents are legally authoritative for claim adjudication — the database record, the original policy document PDF, or some other form?

> _This prototype generates a DEMO ONLY PDF for illustration purposes. It does not produce a legally authoritative document._

**Q-007:** Are there regulatory requirements around the format or content of proof-of-insurance documents?

> _Not addressed. All PDFs in this prototype are explicitly labeled DEMO ONLY._

---

### Vehicle Lifecycle

**Q-008:** Can a vehicle be re-added to a policy after removal? Would a new coverage version begin?

> _Not modeled in this prototype. A production system would need to handle re-activation._

**Q-009:** What happens if incorrect vehicle information is discovered after a claim exists? Can a VIN be corrected?

> _Data corrections after claims are created are not addressed. This prototype assumes data is correct at creation time._

---

### Claims

**Q-010:** Which party is responsible for final coverage adjudication — the insurer, a third-party adjuster, or a regulatory body?

> _Out of scope. This prototype is not an adjudication system._

**Q-011:** What happens if a customer disputes the automated coverage lookup result?

> _The REQUIRES_MANUAL_REVIEW path exists for this purpose, but the manual review process itself is out of scope._

**Q-012:** Can a claim reference multiple vehicles (e.g., multi-vehicle accident)?

> _Not modeled. This prototype handles one vehicle per claim._

---

### System Correctness

**Q-013:** What prevents two coverage versions for the same vehicle from having overlapping date ranges?

> _In this prototype: service-layer logic during vehicle removal is the guard. A production system would also enforce this with database constraints._

**Q-014:** What happens if policy data is corrected after a claim exists (e.g., a data entry error is fixed)?

> _Under ADR-003, `coverage_version_id` on an existing claim is not automatically changed. An administrative override process would be required._

---

## Disclaimer

This document reflects prototype-level assumptions made to enable a focused demonstration. It does not constitute legal, regulatory, or insurance advice. A production implementation would require input from licensed insurance professionals, legal counsel, and compliance experts.

> ⚠️ Concept prototype built as a product and engineering thought exercise. Uses synthetic data only and does not represent any company's production architecture.
