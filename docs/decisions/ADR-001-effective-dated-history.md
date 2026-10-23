# ADR-001: Use Effective-Dated Records as Historical Source of Truth (Not Cache)

**Status:** Accepted
**Date:** 2026-10-22
**Deciders:** Prototype architecture

---

## Context

The prototype must answer: "What coverage existed for vehicle X on date D?" — even after that vehicle has been removed from the active policy.

Two candidate approaches were considered:

1. **Cache the current coverage state** and retrieve it on demand.
2. **Store effective-dated coverage records** in the database as the durable source of truth.

---

## Decision

We use **effective-dated database records** as the historical source of truth for coverage.

Each `CoverageVersion` record carries:
- `valid_from` — the date coverage began (inclusive)
- `valid_to` — the date coverage ended (exclusive); NULL if still active

A coverage version is active on date `d` if:
```
valid_from <= d AND (valid_to IS NULL OR d < valid_to)
```

This is a standard **temporal data pattern** used in finance, insurance, and healthcare systems.

---

## Consequences

**Positive:**
- Historical queries are deterministic and reproducible.
- The answer to "what coverage existed on date X" cannot drift over time.
- No cache invalidation logic is needed.
- Audit-friendly: the record itself is the evidence.
- Survives application restarts, cache flushes, and infrastructure changes.
- Can be queried directly by other systems (claims, audit, compliance) without going through a cache layer.

**Negative / Trade-offs:**
- Requires careful management of `valid_from` / `valid_to` boundaries to prevent overlapping versions for the same vehicle.
- Queries require date comparison logic instead of simple key lookup.
- Schema migrations are required when the coverage data model evolves.

---

## Rejected Alternative: Cache as Source of Truth

Caching (e.g., Redis, in-memory) is appropriate for **performance optimization** of frequently-read data. It is **not appropriate** as the source of truth for historical records because:

- Caches are volatile — data can be evicted or invalidated.
- Cache entries may not be retained long enough to satisfy insurance record-keeping requirements.
- Caches cannot reliably answer point-in-time queries across arbitrary historical dates.
- A cache miss would leave the system unable to determine historical coverage.

> **Caching may be introduced in a future phase as a read-through layer on top of the database records.** It must never replace the database as the authoritative source.

---

## Notes

This decision aligns with the SCD Type 2 (Slowly Changing Dimension) pattern from data warehousing, adapted for transactional use.
