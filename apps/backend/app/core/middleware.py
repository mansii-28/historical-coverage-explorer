"""
Request Correlation & Observability Middleware.
==============================================
Assigns or propagates request correlation IDs via X-Correlation-ID headers.
Tracks request latency and emits structured operational request logs.
"""

import time
import uuid
from collections.abc import Callable

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger("http.access")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware that manages X-Correlation-ID propagation and measures request durations.
    Treats correlation IDs as request-scoped by default, but respects inbound X-Correlation-ID
    headers to support multi-request tracing for demonstration and audit trails.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Clear any leftover context from previous requests in the thread/task
        structlog.contextvars.clear_contextvars()

        # Extract inbound correlation ID or generate a fresh UUIDv4
        inbound_corr_id = request.headers.get("X-Correlation-ID")
        correlation_id = inbound_corr_id.strip() if inbound_corr_id else str(uuid.uuid4())

        # Bind correlation ID and request metadata to contextvars
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            method=request.method,
            path=request.url.path,
        )

        start_time = time.perf_counter()
        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
        )

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

            # Propagate correlation ID on response
            response.headers["X-Correlation-ID"] = correlation_id
            return response
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                "request_failed",
                method=request.method,
                path=request.url.path,
                duration_ms=duration_ms,
                exception_type=exc.__class__.__name__,
                error=str(exc),
            )
            raise
        finally:
            structlog.contextvars.clear_contextvars()
