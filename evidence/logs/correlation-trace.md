# End-to-End Correlation Trace & Observability Report

## Overview & Demonstration Trace Context

This document captures a complete end-to-end trace of the canonical user journey through the Historical Coverage Explorer API.

> [!NOTE]
> **Refinement Note on Correlation ID Scope:**
> In production environments, HTTP `X-Correlation-ID` headers are **request-scoped by default**. Each distinct incoming HTTP request receives a unique UUID identifying its single call lifecycle unless passed explicitly.
>
> For this demonstration, the client deliberately supplied the same header `X-Correlation-ID: demo-trace-canonical-001` across the related sequence of 6 API calls. This enables reviewers, auditors, and interviewers to search, filter, and inspect the entire end-to-end journey as a single correlated story without implying that unrelated production transactions share correlation IDs.

---

## 1. Trace Journey Sequence

| Step | HTTP Method | Path | Status | Duration | Emitted Domain Event | Sensitive Data Protection |
|------|-------------|------|--------|----------|----------------------|---------------------------|
| 1 | `POST` | `/api/demo/reset` | `200 OK` | `32.59ms` | Baseline Seeded | N/A |
| 2 | `GET` | `/api/policies/1` | `200 OK` | `1.73ms` | Policy Read | Policy `DEMO-AUTO-1024` |
| 3 | `POST` | `/api/vehicles/1/remove` | `200 OK` | `5.16ms` | `vehicle_removal_completed` | VIN masked to `••••-001` |
| 4 | `POST` | `/api/coverage/check` | `200 OK` | `3.78ms` | `coverage_lookup_found` | Version 1 matched for `2026-01-10` |
| 5 | `POST` | `/api/claims` | `201 Created` | `9.73ms` | `claim_created` | Pinned to Version 1 |
| 6 | `GET` | `/api/coverage/1/proof.pdf` | `200 OK` | `9.93ms` | `proof_generated` | VIN masked to `••••-001`, Watermarked |

---

## 2. Captured JSON Application Logs (`sample-application-logs.jsonl`)

The raw structured logs emitted during this trace:

```json
{"method": "POST", "path": "/api/demo/reset", "event": "request_started", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.479672Z", "logger": "http.access", "level": "info"}
{"method": "POST", "path": "/api/demo/reset", "status_code": 200, "duration_ms": 32.59, "event": "request_completed", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.512269Z", "logger": "http.access", "level": "info"}
{"method": "GET", "path": "/api/policies/1", "event": "request_started", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.513341Z", "logger": "http.access", "level": "info"}
{"method": "GET", "path": "/api/policies/1", "status_code": 200, "duration_ms": 1.73, "event": "request_completed", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.515076Z", "logger": "http.access", "level": "info"}
{"method": "POST", "path": "/api/vehicles/1/remove", "event": "request_started", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.515875Z", "logger": "http.access", "level": "info"}
{"vehicle_id": 1, "effective_date": "2026-01-15", "event": "vehicle_removal_started", "method": "POST", "path": "/api/vehicles/1/remove", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.516245Z", "logger": "service.vehicle", "level": "info"}
{"vehicle_id": 1, "masked_vin": "••••-001", "policy_id": 1, "removed_at": "2026-01-15", "closed_coverage_version_id": 1, "event": "vehicle_removal_completed", "method": "POST", "path": "/api/vehicles/1/remove", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.520811Z", "logger": "service.vehicle", "level": "info"}
{"method": "POST", "path": "/api/vehicles/1/remove", "status_code": 200, "duration_ms": 5.16, "event": "request_completed", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.521041Z", "logger": "http.access", "level": "info"}
{"method": "POST", "path": "/api/coverage/check", "event": "request_started", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.521666Z", "logger": "http.access", "level": "info"}
{"vehicle_id": 1, "requested_date": "2026-01-10", "event": "coverage_lookup_started", "method": "POST", "path": "/api/coverage/check", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.522947Z", "logger": "service.coverage", "level": "info"}
{"vehicle_id": 1, "requested_date": "2026-01-10", "coverage_version_id": 1, "coverage_type": "Comprehensive", "event": "coverage_lookup_found", "method": "POST", "path": "/api/coverage/check", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.523753Z", "logger": "service.coverage", "level": "info"}
{"method": "POST", "path": "/api/coverage/check", "status_code": 200, "duration_ms": 3.78, "event": "request_completed", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.525451Z", "logger": "http.access", "level": "info"}
{"method": "POST", "path": "/api/claims", "event": "request_started", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.526160Z", "logger": "http.access", "level": "info"}
{"policy_id": 1, "vehicle_id": 1, "date_of_loss": "2026-01-10", "filed_at": "2026-02-10T14:30:00+00:00", "event": "claim_creation_started", "method": "POST", "path": "/api/claims", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.526456Z", "logger": "service.claim", "level": "info"}
{"claim_id": 1, "claim_number": "DEMO-CLM-0001", "coverage_version_id": 1, "coverage_verification_status": "COVERAGE_FOUND", "date_of_loss": "2026-01-10", "event": "claim_created", "method": "POST", "path": "/api/claims", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.532485Z", "logger": "service.claim", "level": "info"}
{"method": "POST", "path": "/api/claims", "status_code": 201, "duration_ms": 9.73, "event": "request_completed", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.535894Z", "logger": "http.access", "level": "info"}
{"method": "GET", "path": "/api/coverage/1/proof.pdf", "event": "request_started", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.536720Z", "logger": "http.access", "level": "info"}
{"coverage_version_id": 1, "event": "proof_generation_started", "method": "GET", "path": "/api/coverage/1/proof.pdf", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.536952Z", "logger": "service.document", "level": "info"}
{"coverage_version_id": 1, "vehicle_id": 1, "masked_vin": "••••-001", "size_bytes": 6221, "event": "proof_generated", "method": "GET", "path": "/api/coverage/1/proof.pdf", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.546190Z", "logger": "service.document", "level": "info"}
{"method": "GET", "path": "/api/coverage/1/proof.pdf", "status_code": 200, "duration_ms": 9.93, "event": "request_completed", "correlation_id": "demo-trace-canonical-001", "timestamp": "2026-10-24T02:25:01.546663Z", "logger": "http.access", "level": "info"}
```

---

## 3. Operational Application Logs vs. Domain Audit Events

A key architectural distinction in this system is the clear boundary between **Operational Logs** and **Domain Audit Events**:

| Architectural Dimension | Operational Logs (`structlog` JSON to stdout) | Domain Audit Events (`audit_events` Table in PostgreSQL) |
|-------------------------|-----------------------------------------------|----------------------------------------------------------|
| **Audience** | Software engineers, SREs, telemetry pipelines | Underwriters, claims adjudicators, compliance auditors |
| **Storage Medium** | Stdout / ephemeral container log files (`.jsonl`) | Persistent PostgreSQL table with foreign keys & indices |
| **Lifecycle** | Subject to log rotation, retention windows (e.g. 14–30 days) | Permanent business record preserved alongside policy lifecycle |
| **Security & Privacy** | Masked VIN (`••••-001`), no PII in log text | Structured JSON metadata, role-controlled access |
| **Correlation** | Request-scoped UUID / `X-Correlation-ID` header | Domain entity IDs (`policy_id`, `vehicle_id`, `claim_id`) |
| **Typical Queries** | "Find all requests taking > 50ms" or "grep by correlation ID" | "Show all vehicle changes and coverage terms active in 2026" |
| **Transactional Consistency** | Emitted best-effort outside database transactions | Committed transactionally with business entities |
