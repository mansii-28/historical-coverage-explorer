# 12 — Technical Deep Dive: Historical Coverage Explorer

> **Independent Concept Prototype**
> *Built as an advanced product-engineering thought exercise. Uses synthetic data only and does not represent any company's proprietary architecture. Not an official Tint product.*

---

## 1. System Architecture Overview

Historical Coverage Explorer is an end-to-end cloud application designed to solve temporal data consistency and point-in-time policy adjudication.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vercel Public Edge Domain                       │
│                   https://historical-coverage-explorer.vercel.app      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          Rewrite: `/` & `/(.*)`             Rewrite: `/api/(.*)` & `/health`
    ┌───────────────────────────┐       ┌───────────────────────────────┐
    │     Frontend Service      │       │        Backend Service        │
    │      (apps/frontend)      │       │        (apps/backend)         │
    │   React 19 + TypeScript   │       │   FastAPI (Python 3.12)       │
    │   Vite Static Bundle      │       │   Serverless Function runtime │
    └───────────────────────────┘       └───────────────┬───────────────┘
                                                        │
                                     psycopg3 async / NullPool
                                                        │
                                                        ▼
                                        ┌───────────────────────────────┐
                                        │   Neon Serverless PostgreSQL  │
                                        │   pgBouncer Pooled: :5432     │
                                        │   Direct Unpooled:  :5432     │
                                        └───────────────────────────────┘
```

---

## 2. Temporal & Effective-Dated Modeling

### The Relational Schema
Insurance terms must not be stored as mutable single-row attributes on a vehicle. Instead, coverage terms are separated into immutable, effective-dated versions:

```sql
CREATE TABLE policies (
    id BIGSERIAL PRIMARY KEY,
    policy_number VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT NOT NULL REFERENCES policies(id) ONDELETE RESTRICT,
    vin VARCHAR(64) NOT NULL,
    make VARCHAR(64) NOT NULL,
    model VARCHAR(64) NOT NULL,
    year INT NOT NULL,
    added_at DATE NOT NULL,
    removed_at DATE,                    -- NULL = currently active in fleet
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE coverage_versions (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT NOT NULL REFERENCES policies(id) ONDELETE RESTRICT,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ONDELETE RESTRICT,
    valid_from DATE NOT NULL,
    valid_to DATE,                      -- NULL = currently in effect
    coverage_type VARCHAR(64) NOT NULL,
    liability_limit NUMERIC(12, 2) NOT NULL,
    deductible NUMERIC(12, 2) NOT NULL,
    version_label VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
```

### Half-Open Temporal Intervals `[valid_from, valid_to)`
A fundamental temporal modeling design decision is the use of **half-open intervals**:
- `valid_from` is **inclusive**.
- `valid_to` is **exclusive**.
- A `valid_to` value of `NULL` represents an open-ended interval extending to $+\infty$.

#### Why Half-Open Intervals?
When intervals are closed `[from, to]`, representing contiguous time requires discrete date math (e.g., Version 1 ends Jan 7; Version 2 begins Jan 8). This introduces ambiguity:
- Does coverage end at Jan 7 11:59:59 PM or Jan 8 00:00:00 AM?
- What happens if an accident occurs at midnight between two terms?

With half-open intervals:
$$\text{Interval 1: } [2026\text{-}01\text{-}01, 2026\text{-}01\text{-}08)$$
$$\text{Interval 2: } [2026\text{-}01\text{-}08, 2026\text{-}01\text{-}15)$$

Every point in continuous time belongs to **exactly one interval**, with zero gaps and zero mathematical overlap.

---

## 3. Deterministic Coverage Lookup Engine

Coverage resolution is strictly deterministic and implemented in pure SQL/SQLAlchemy logic without probabilistic models or LLMs:

```python
async def find_coverage_for_date(
    session: AsyncSession,
    policy_id: int,
    vehicle_id: int,
    date_of_loss: date,
) -> CoverageVersion | None:
    """
    Deterministic historical coverage resolution using half-open intervals:
    valid_from <= date_of_loss AND (valid_to IS NULL OR date_of_loss < valid_to)
    """
    stmt = (
        select(CoverageVersion)
        .where(
            CoverageVersion.policy_id == policy_id,
            CoverageVersion.vehicle_id == vehicle_id,
            CoverageVersion.valid_from <= date_of_loss,
            or_(
                CoverageVersion.valid_to.is_(None),
                date_of_loss < CoverageVersion.valid_to,
            ),
        )
        .order_by(CoverageVersion.valid_from.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
```

### Resolution Outcome Semantics
When an incident is evaluated:
1. **Match Found:** Returns `COVERAGE_FOUND` along with the exact governing `CoverageVersion` record (deductible, liability limit, effective range).
2. **No Match Found:** Returns `REQUIRES_MANUAL_REVIEW`.
   > **Critical Rule:** The system *never* returns an automated denial (`DENIED`). Automatic rejection based solely on a negative database query creates severe customer and legal exposure. Routing to manual review enables claims adjusters to investigate potential clerical errors, retroactive renewals, or special coverage riders.

---

## 4. Soft Vehicle Removal

When a vehicle is removed from a policy, its operational state is updated without deleting historical data:

```python
async def remove_vehicle(
    session: AsyncSession,
    vehicle_id: int,
    effective_date: date,
) -> Vehicle:
    # 1. Fetch vehicle and validate it is not already removed
    vehicle = await get_vehicle_by_id(session, vehicle_id)
    if vehicle.removed_at is not None:
        raise VehicleAlreadyRemovedError(f"Vehicle {vehicle_id} is already removed.")

    if effective_date < vehicle.added_at:
        raise InvalidRemovalDateError("Removal date cannot precede vehicle addition date.")

    # 2. Mark vehicle soft-removed
    vehicle.removed_at = effective_date
    vehicle.updated_at = datetime.now(UTC)

    # 3. Close open-ended active coverage version
    active_cov = await get_active_coverage_version(session, vehicle.policy_id, vehicle_id)
    if active_cov:
        active_cov.valid_to = effective_date

    # 4. Record immutable audit event
    await record_audit_event(
        session=session,
        event_type="VEHICLE_REMOVED",
        policy_id=vehicle.policy_id,
        vehicle_id=vehicle.id,
        metadata_json={
            "effective_date": effective_date.isoformat(),
            "vin": vehicle.vin,
        },
    )

    await session.commit()
    return vehicle
```

---

## 5. Claim Pinning & Historical Delete Protection

### Claim Model Schema
```sql
CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    claim_number VARCHAR(64) UNIQUE NOT NULL,
    policy_id BIGINT NOT NULL REFERENCES policies(id) ONDELETE RESTRICT,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ONDELETE RESTRICT,
    coverage_version_id BIGINT NOT NULL REFERENCES coverage_versions(id) ONDELETE RESTRICT,
    date_of_loss DATE NOT NULL,
    status VARCHAR(32) NOT NULL,         -- e.g. 'FILED'
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

### Immutable Pinning Guarantee
When a claim is filed, the resolver determines the governing `CoverageVersion` and writes `claims.coverage_version_id = coverage_version.id`:
- **Frozen Legal Terms:** If the customer later alters their deductible or cancels their policy, the claim's relationship to that version is unchanged.
- **Database-Level Constraint Protection:** Every foreign key pointing to `policies`, `vehicles`, and `coverage_versions` is declared with **`ON DELETE RESTRICT`**. A database administrator cannot accidentally run `DELETE FROM coverage_versions WHERE id = 1` if a claim is pinned to it. PostgreSQL strictly rejects the operation with a foreign key violation.

---

## 6. Durable Audit Events vs Operational Observability

A key architectural separation of concerns is maintaining two distinct logging paradigms:

| Dimension | Operational Logging (`http.access`, `app.service`) | Durable Audit Trail (`audit_events` table) |
| :--- | :--- | :--- |
| **Purpose** | Diagnostics, debugging, request performance, error tracing | Legal history, underwriting compliance, regulatory evidence |
| **Storage** | Ephemeral `stdout` (captured by Datadog, Vercel, CloudWatch) | Durable PostgreSQL table (`audit_events`) |
| **Retention** | 7–30 days | Indefinite (regulated insurance record) |
| **Transaction Boundary** | Non-transactional (flushed per HTTP request) | Transactional (committed atomically with domain mutation) |
| **Data Structure** | Structured JSON with correlation IDs, latency ms, HTTP status | JSONB metadata with event type, actor, entity IDs, timestamps |

---

## 7. Point-in-Time PDF Document Generation

To generate proof-of-insurance documents without filesystem side effects or external microservice calls, the system uses ReportLab to assemble PDFs entirely in-memory:

```python
def generate_proof_of_insurance_pdf(
    policy: Policy,
    vehicle: Vehicle,
    coverage: CoverageVersion,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []

    # Render header, policy details, vehicle information, and coverage limits
    ...
    # Draw conspicuous DEMO watermark
    doc.build(story, onFirstPage=draw_watermark_and_disclaimer)
    return buffer.getvalue()
```

- Returns a clean `bytes` buffer directly to the FastAPI route handler.
- Served with `Content-Type: application/pdf` and `Content-Disposition: inline; filename="proof-of-insurance-....pdf"`.
- Features explicit `DEMO ONLY — NOT A REAL INSURANCE DOCUMENT` diagonal background watermarks.
- **Synthetic Demonstration Disclaimer:** The generated PDF is a synthetic demo coverage document created solely for prototype demonstration; it is not a legally valid proof of insurance and does not confer insurance coverage in any jurisdiction.

---

## 8. Cloud Deployment & Serverless Connection Pooling

### The Serverless Scaling Challenge
When running under Vercel Serverless Functions against Neon PostgreSQL:
- Serverless containers scale up and down dynamically based on HTTP traffic.
- Maintaining a traditional application pool (`pool_size=10, max_overflow=20`) across 50 concurrent lambdas would open 500 connections, instantly saturating PostgreSQL's `max_connections`.

### The Architecture: SQLAlchemy `NullPool` + Neon pgBouncer
1. **Runtime API (`DATABASE_URL`):**
   - Connects to Neon's **pgBouncer pooled endpoint** (port 5432).
   - In `apps/backend/app/db/session.py`, SQLAlchemy is configured with `poolclass=NullPool` and `pool_pre_ping=True` when running in serverless/production mode.
   - Every FastAPI dependency session creates a lightweight connection and discards it immediately upon request completion.
2. **Migrations & Build (`DATABASE_URL_UNPOOLED`):**
   - Connects directly to Neon's **unpooled direct endpoint** (port 5432).
   - Transaction-mode pgBouncer does not support table-level DDL locks and advisory locking required by Alembic. Running migrations over the unpooled endpoint guarantees migration safety.

### Safe Build Lifecycle
In `apps/backend/scripts/vercel-build.sh`:
```bash
if [[ "${VERCEL_ENV:-}" != "production" ]]; then
    echo "[deployment] non-production environment; skipping production DB migration"
    exit 0
fi

echo "[deployment] applying Alembic migrations"
PYTHONPATH=. alembic upgrade head

echo "[deployment] running seed_if_empty"
PYTHONPATH=. python -m app.scripts.seed_if_empty
```
- Non-destructive `seed_if_empty` queries for policy `DEMO-AUTO-1024`. If found, it makes **zero modifications**, preserving all mutated vehicle states and submitted claims across continuous production redeployments.

---

## 9. Automated Testing & Verification Suite

The repository implements a comprehensive test pyramid:

```
                  ┌────────────────────────┐
                  │ Playwright E2E (5/5)   │  End-to-end browser journeys
                  ├────────────────────────┤
                  │ Frontend Vitest (14/14)│  Component & RTL interaction
                  ├────────────────────────┤
                  │ Backend Pytest (39/39) │  Domain logic, APIs, migrations
                  └────────────────────────┘
```

- **58 automated test cases: 39 backend, 14 frontend, 5 Playwright E2E, plus a separate 12-step public deployment verification.**
- **88% Aggregate Backend Coverage** (with core domain services &gt; 90%).
- **Dedicated E2E Test Database:** Tests run against an isolated database with an enforced safety guard (`test` must be present in the database name), preventing accidental mutation of development data.
- **12-Step Public Deployment Smoke Suite:** Automated post-deploy verification against live public production (`https://historical-coverage-explorer.vercel.app` via `scripts/verify-vercel-deployment.mjs`).
- **Additional Production Validation — Redeploy Persistence:** Separately verified that vehicle soft removals and pinned claims survive Vercel production redeployments.

---

## 10. Engineering Scope, Limitations & Future Production Roadmap

### Scope & Prototype Limitations
- **Not Load-Tested:** This concept prototype was designed and verified for algorithmic correctness, relational integrity, and product clarity; it was not load-tested or benchmarked for high-concurrency throughput.
- **Prototype Status:** It is presented as a working product-engineering proof-of-concept demonstrating temporal data modeling and claim pinning, not as production-hardened or regulatory-certified insurance infrastructure.
- **Evolutionary Architecture:** The scalability, resilience, and security considerations below describe how the core design could evolve when transitioning toward an enterprise-scale insurance workload:

1. **Read Replicas & CQRS:**
   - Write path: Effective-dated policy mutations on PostgreSQL primary.
   - Read path: Coverage lookup can be served from read replicas or distributed read-only projections.
2. **Time-of-Day Boundary Standards:**
   - Incorporating timezone-aware 12:01 AM statutory carrier inception rules across diverse state jurisdictions.
3. **Mid-Term Multi-Vehicle Endorsements:**
   - Implementing batch endorsement transactions where coverage limits change simultaneously across an entire commercial fleet.
4. **Idempotency Keys for Claims & Removals:**
   - Introducing `Idempotency-Key` HTTP headers to prevent duplicate vehicle removal or claim submissions under erratic network conditions.
5. **Security & Production Hardening:**
   - Enforcing strict mTLS between services, KMS-backed envelope encryption for sensitive fields, enterprise Role-Based Access Control (RBAC), and SOC 2 / HIPAA-compliant audit logging destinations.

---

*Documented as part of the Historical Coverage Explorer system.*
