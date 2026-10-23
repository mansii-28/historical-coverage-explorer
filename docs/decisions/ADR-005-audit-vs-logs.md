# ADR-005: Separate Audit Events from Application Logs

**Status:** Accepted
**Date:** 2026-10-22
**Deciders:** Prototype architecture

---

## Context

The prototype needs to record two different kinds of information:

1. **What did the software do?** — e.g., "A database query was executed; it took 12ms."
2. **What happened to the business entity?** — e.g., "Vehicle DEMO-VIN-001 was removed from policy DEMO-AUTO-1024 on January 15, 2026."

These are fundamentally different concerns and should not be conflated.

---

## Decision

We maintain **two separate mechanisms**:

### Application Logs
- **What they are:** Structured technical log output from the running application.
- **Consumers:** Developers, DevOps, SREs, log aggregation systems (future).
- **Storage:** Written to stdout/stderr; captured by log aggregation (future: Loki, CloudWatch, etc.).
- **Retention:** Operational — may be rotated or discarded after a configurable period.
- **Contents:** Request IDs, endpoint called, DB query duration, errors, warnings.
- **NOT stored in:** The PostgreSQL database.

### Audit Events
- **What they are:** Durable, domain-level records of material business events.
- **Consumers:** Claims adjusters, compliance teams, customer service, product analytics.
- **Storage:** PostgreSQL `audit_events` table — treated as a durable record.
- **Retention:** Business-determined — must survive application restarts, log flushes, and potentially years of retention.
- **Contents:** Event type, policy/vehicle/claim references, timestamp, metadata JSON.
- **NOT stored in:** Application log files.

---

## Consequences

**Positive:**
- Audit events survive infrastructure changes (unlike log files).
- Application logs can be verbose without polluting the business audit trail.
- Audit events are queryable via SQL — adjusters and compliance teams can use standard tooling.
- The two concerns evolve independently.
- Sensitive data handling rules can be applied differently: logs may be filtered or masked in ways audit events are not (and vice versa).

**Negative / Trade-offs:**
- Slightly more engineering effort — audit events require a database model and write path; they are not "free" like log statements.
- Must ensure audit events are written within the same database transaction as the business action they record (to prevent orphaned audit records if the transaction rolls back).

---

## What Each Answers

| Question | Answered By |
|----------|-------------|
| "Did the request complete in under 200ms?" | Application logs |
| "What SQL queries ran during this request?" | Application logs |
| "Was there an unhandled exception?" | Application logs |
| "When was this vehicle removed from the policy?" | Audit events |
| "What coverage version was pinned to this claim?" | Audit events |
| "Was there a historical coverage lookup for Jan 10?" | Audit events |
| "Who filed claim CLM-2026-001?" | Audit events |

---

## Implementation Plan

**Application logs (Phase 3/4):**
- Use `structlog` or Python's standard `logging` module with structured output.
- Include correlation/request IDs on every log line.
- Do not log full VINs or customer names — use masked identifiers.

**Audit events (Phase 3):**
- Write to `audit_events` table within the same database transaction as the triggering operation.
- Include `event_type`, `event_timestamp` (UTC), `policy_id`, `vehicle_id`, `claim_id`, `metadata_json`.
- `metadata_json` contains context but never sensitive raw data.

---

## Related

- FR-007: Audit event recording requirement.
- docs/07-observability.md (Phase 4).
