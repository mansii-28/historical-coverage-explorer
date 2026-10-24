# Observability, Structured Logging, and Telemetry

## 1. Overview & Architectural Goals

The observability subsystem in **Historical Coverage Explorer** provides structured, machine-parsable JSON telemetry for every HTTP request and domain service operation. It achieves:
1. **Request Tracing:** Correlation IDs bound at the edge and propagated across logs and HTTP responses.
2. **Performance Telemetry:** High-resolution request timing (`duration_ms`) on every completed request.
3. **Data Privacy & Compliance:** Automatic Vehicle Identification Number (VIN) masking (`••••-001`) in all log output.
4. **Architectural Separation:** A clean division between operational diagnostic logs and persistent domain audit events.

---

## 2. Structured JSON Logging Architecture

Logging is implemented using [`structlog`](https://www.structlog.org/) configured with standard library integration:

```python
# apps/backend/app/core/logging.py
import structlog

def setup_logging():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
```

Every emitted log line is a single-line JSON object (`.jsonl`) compatible with ELK, Loki, CloudWatch, or Datadog ingestion:

```json
{
  "method": "POST",
  "path": "/api/claims",
  "status_code": 201,
  "duration_ms": 9.73,
  "event": "request_completed",
  "correlation_id": "demo-trace-canonical-001",
  "timestamp": "2026-10-24T02:25:01.535894Z",
  "logger": "http.access",
  "level": "info"
}
```

---

## 3. Correlation ID Propagation & Middleware

Correlation IDs are managed by `CorrelationIdMiddleware` registered in `apps/backend/app/main.py`:

```
Client HTTP Request
   │ (optional X-Correlation-ID header)
   ▼
CorrelationIdMiddleware
   ├─► Read incoming header or generate new uuid4()
   ├─► Set contextvar: correlation_id_var
   ├─► Bind to structlog contextvars
   ├─► Measure request start time (perf_counter)
   ├─► Pass to router & domain services (logs inherit correlation_id)
   ├─► Measure duration_ms = (end - start) * 1000
   └─► Inject X-Correlation-ID into HTTP response headers
```

### Request-Scoped by Default vs. Demonstration Traces
- **Default Production Behavior:** If the client does not provide an `X-Correlation-ID` header, a fresh UUID4 is generated for that request. Unrelated requests never share a correlation ID.
- **Demonstration Walkthroughs:** For testing or demo walkthroughs, the client can pass an explicit `X-Correlation-ID: demo-trace-canonical-001` across a sequence of calls so that the entire multi-step scenario can be searched and reviewed as a unified trace.

---

## 4. Sensitive Data Masking (VIN Masking)

To protect synthetic or real vehicle identifiers from leaking into unencrypted logging backends, `mask_vin` sanitizes VIN strings before they are logged:

```python
# apps/backend/app/core/logging.py
def mask_vin(vin: str | None) -> str:
    """Mask VIN for safe logging, exposing only the last 4 characters."""
    if not vin:
        return "••••"
    if len(vin) <= 4:
        return "••••"
    return f"••••-{vin[-3:]}"
```

Example domain log output:
```json
{
  "vehicle_id": 1,
  "masked_vin": "••••-001",
  "policy_id": 1,
  "removed_at": "2026-01-15",
  "closed_coverage_version_id": 1,
  "event": "vehicle_removal_completed",
  "correlation_id": "demo-trace-canonical-001",
  "logger": "service.vehicle"
}
```

---

## 5. Domain Audit Events vs. Operational Logs

| Characteristic | Operational Logs (`structlog`) | Domain Audit Trail (`audit_events` table) |
|----------------|--------------------------------|------------------------------------------|
| **Primary Audience** | DevOps, SREs, developers | Claims adjusters, underwriters, compliance |
| **Output Location** | `stdout` / log aggregation services | PostgreSQL relational table |
| **Lifecycle** | Ephemeral; rotated after 14–30 days | Permanent; retained for policy lifetime |
| **Integrity** | Best effort | Guaranteed ACID transactional commit |
| **Query Mechanism** | Grep / log search index | Relational SQL / REST API (`/api/policies/{id}/audit-events`) |
| **Identifiers** | `correlation_id`, `duration_ms` | `policy_id`, `vehicle_id`, `claim_id`, `event_type` |
