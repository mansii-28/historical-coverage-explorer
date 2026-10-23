# ADR-002: Use Soft Removal / Historical Preservation Instead of Destructive Deletion

**Status:** Accepted
**Date:** 2026-10-22
**Deciders:** Prototype architecture

---

## Context

When a customer removes a vehicle from their active policy, the system must decide whether to:

1. **Hard-delete** the vehicle and its coverage records from the database.
2. **Soft-delete** the vehicle by setting a `removed_at` date while preserving all records.

---

## Decision

We use **soft removal**: when a vehicle is removed, the system sets `vehicle.removed_at` to the effective removal date. The vehicle record and all associated `CoverageVersion` records remain in the database.

The active policy view filters vehicles using:
```sql
WHERE removed_at IS NULL
```

Historical views query without this filter.

When a vehicle is removed, the currently active `CoverageVersion` is closed by setting its `valid_to` to the effective removal date.

---

## Consequences

**Positive:**
- Historical coverage records are never destroyed by customer actions.
- Claims filed after vehicle removal can still reference the correct historical coverage version.
- The audit trail is complete.
- Compliance with insurance record-retention requirements is supported (future).
- Customer service teams can view the full lifecycle of a policy.
- The separation of "active view" from "historical view" is clean and explicit.

**Negative / Trade-offs:**
- Database rows accumulate over time for removed vehicles (acceptable at prototype scale).
- Active-policy queries must always include the `removed_at IS NULL` filter — failure to do so would surface historical data in the active view.
- Schema-level deletion constraints cannot be used; service-layer logic must enforce consistency.

---

## Rejected Alternative: Hard Delete

Hard-deleting vehicle and coverage records on removal:

- Destroys the historical basis for claims filed after removal.
- Cannot be undone.
- Violates standard insurance record-keeping expectations.
- Would require point-in-time backups or event sourcing to reconstruct history — far more complex than soft deletion.

---

## Related

- ADR-001: Coverage records are stored as effective-dated database rows.
- ADR-003: Claims are pinned to a specific coverage version at creation time.
