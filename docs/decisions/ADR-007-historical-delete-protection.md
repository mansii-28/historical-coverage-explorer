# ADR-007: Historical Delete Protection and Restrictive Foreign Keys

> **Status:** Accepted  
> **Date:** 2026-10-23  
> **Deciders:** Engineering Team, Product Team  
> **Technical Story:** Phase 3 — Backend Pre-Commit Hardening  

---

## Context

In an insurance policy administration system, historical records (vehicles removed from active policies, closed coverage intervals, settled or submitted claims, and audit logs) serve as immutable evidentiary artifacts. The central product principle is:

> **Removing something from the active customer experience is not the same as destroying its history.**

In initial prototyping, traditional relational ORM conventions often configure `ON DELETE CASCADE` foreign keys and `cascade="all, delete-orphan"` collection mappings so that child entities are automatically deleted when a parent row is removed.

However, in an effective-dated historical architecture:
1. Active policy changes should **never** cascade into destructive deletion of past vehicle associations or closed coverage intervals.
2. A `Claim` pinned to a specific `CoverageVersion` on its date of loss must **never** silently lose its foreign key link (e.g., via `ON DELETE SET NULL`) or be deleted if someone attempts to purge the coverage version.
3. Domain changes (such as vehicle removal) must occur via explicit state transitions (`vehicle.removed_at`, `coverage_version.valid_to`), not `DELETE` statements.

---

## Decision

We replace all destructive `ON DELETE CASCADE` foreign keys and ORM `delete-orphan` cascades on historical entities with **`ON DELETE RESTRICT`** constraints:

### 1. Foreign Key Hardening: `ON DELETE RESTRICT`
- **`vehicles.policy_id` → `policies.id` (`RESTRICT`)**: A policy record cannot be deleted if vehicles exist under it.
- **`coverage_versions.policy_id` → `policies.id` (`RESTRICT`)** and **`coverage_versions.vehicle_id` → `vehicles.id` (`RESTRICT`)**: Coverage versions cannot be deleted if their parent policy or vehicle exists.
- **`claims.policy_id` → `policies.id` (`RESTRICT`)** and **`claims.vehicle_id` → `vehicles.id` (`RESTRICT`)**: Historical claims are protected against parent deletion.
- **`claims.coverage_version_id` → `coverage_versions.id` (`RESTRICT`)**: Crucially, any claim that has pinned a coverage version acts as a lock against the deletion of that coverage version. Attempting to delete the coverage version is rejected by the database.

### 2. Removal of ORM `delete-orphan` Cascades
- SQLAlchemy `relationship()` definitions for `vehicles`, `coverage_versions`, `claims`, and `audit_events` omit `cascade="all, delete-orphan"`.
- Removing an item from a Python collection does not issue a SQL `DELETE`.

### 3. Audit Event Preservation
- `audit_events` foreign keys (`policy_id`, `vehicle_id`, `claim_id`) use `ON DELETE SET NULL`.
- If a referenced entity is ever cleaned up, the audit event itself survives intact, preserving its immutable timestamp and JSONB audit payload.

### 4. Explicit Demo Reset
- Synthetic prototype reset (`POST /api/demo/reset`) does not rely on cascading foreign keys; it uses explicit table truncation (`TRUNCATE TABLE audit_events, claims, coverage_versions, vehicles, policies RESTART IDENTITY CASCADE;`).
- This operation is strictly isolated to prototype demonstration environments.

---

## Consequences

### Positive
- **Database-enforced integrity:** Historical coverage and claims cannot be deleted by rogue application bugs, accidental cascading deletions, or ORM lifecycle events.
- **Claim pinning guarantee:** The database engine itself enforces Rule 4: a pinned coverage version referenced by a claim cannot be removed.
- **Audit preservation:** Audit logs remain durable and independent of active-tier entity lifecycles.

### Negative / Trade-offs
- Manual test cleanups or data migrations require explicit order of operations (child records must be cleaned before parents if ever purging non-synthetic data). In practice, this aligns perfectly with regulatory data retention policies.
