# Problem Statement

> **Prototype:** Historical Coverage Explorer
> **Document:** docs/01-problem-statement.md
> **Status:** Phase 1

---

## Customer Problem

When a customer insures a vehicle, a coverage record is created. If that vehicle is involved in an accident and is later removed from the policy — possibly before the customer even files a claim — the system must still be able to answer:

> **"What coverage existed for this vehicle on the date the accident occurred?"**

If the system only stores the *current* state of a policy, this question becomes unanswerable after the vehicle is removed.

The customer has a legitimate claim rooted in a real coverage relationship that existed on the date of loss. Without a historical record, that relationship cannot be verified, and the claim cannot be properly evaluated.

---

## Example Timeline

| Date | Event |
|------|-------|
| **Jan 1, 2026** | Jordan Lee insures a 2024 BMW X3 under policy DEMO-AUTO-1024. Coverage begins. |
| **Jan 10, 2026** | The BMW X3 is in an accident. This is the **date of loss**. |
| **Jan 15, 2026** | Jordan removes the BMW X3 from the active policy. Coverage ends. |
| **Feb 10, 2026** | Jordan files a claim for the January 10 accident. |

**The problem:** If removing the vehicle also destroyed its coverage records, the system on February 10 would have no way to verify coverage existed on January 10.

**The question the system must answer:**
_"What coverage existed for DEMO-VIN-001 on January 10, 2026?"_

**The expected answer:** Comprehensive coverage, $100,000 liability limit, $500 deductible, valid Jan 1 – Jan 15, 2026.

---

## Why Deleting History Is Dangerous

Destroying historical records when a customer modifies their active policy creates several serious problems:

1. **Claim verification fails.** Without historical coverage records, the system cannot confirm what was covered on the date of loss — even if the customer had valid coverage.

2. **Audit trails are broken.** Regulatory and compliance requirements often mandate that insurers retain coverage records for years. Deleting records on customer action could create legal exposure.

3. **Customer trust is undermined.** A customer who had coverage and then files a legitimate claim should not be denied simply because the record was deleted.

4. **Fraud detection is impaired.** Historical records are necessary to detect attempts to backdate changes or retroactively alter coverage.

5. **Operational investigation is blocked.** Customer service and claims teams need to see the full lifecycle of a policy to resolve disputes or questions.

---

## Product Goals

1. **Preserve historical coverage records durably** — even after a vehicle is removed from the active policy.

2. **Support effective-dated querying** — "What coverage existed on date X?" must return a deterministic, auditable answer.

3. **Separate active state from historical state** — the customer's active policy view hides removed vehicles; historical views do not.

4. **Pin claims to the correct historical coverage version** — at the time a claim is created, the system records which coverage version was active on the date of loss. This reference does not change.

5. **Surface manual review gracefully** — if automated coverage lookup returns no result, the claim is routed for human review, not automatically rejected.

6. **Provide proof of insurance from historical records** — a demonstration PDF can be generated from preserved historical data.

7. **Maintain a durable audit trail** — all material lifecycle events are recorded as audit events.

---

## Non-Goals

This prototype does **not**:

- Perform real insurance underwriting or adjudication
- Integrate with real carrier systems
- Process real payments
- Handle real customer data
- Implement production-grade security or authentication
- Represent any specific company's architecture or process
- Make final legal coverage determinations

---

## Success Criteria

The prototype succeeds if it demonstrates:

| # | Criterion |
|---|-----------|
| 1 | A vehicle removed from the active policy disappears from the active view |
| 2 | The vehicle's historical coverage is still retrievable after removal |
| 3 | A claim filed with date-of-loss = Jan 10 finds the correct coverage version |
| 4 | A claim filed with date-of-loss = Jan 20 finds no automated coverage (vehicle removed Jan 15) |
| 5 | The coverage version attached to a claim does not change when the policy later changes |
| 6 | The audit trail captures the full lifecycle of the policy and claim |
| 7 | A DEMO-ONLY proof of insurance can be generated from historical records |
| 8 | The difference between date-of-loss and claim-filing-date is visually clear in the UI |

---

## Assumptions

1. The canonical demo data (Jordan Lee, DEMO-AUTO-1024, DEMO-VIN-001) is entirely synthetic.
2. Coverage effective dates are represented as calendar dates (not timestamps) for this prototype.
3. A valid coverage period is: `valid_from <= date_of_loss < valid_to` (end date exclusive).
4. A single active coverage version per vehicle at any time is enforced as a simplifying assumption.
5. This prototype does not model multi-vehicle policies, multi-driver policies, or endorsements.
6. The prototype does not model premium calculations.

---

## Open Questions

See [ASSUMPTIONS_AND_OPEN_QUESTIONS.md](ASSUMPTIONS_AND_OPEN_QUESTIONS.md) for the full list.
