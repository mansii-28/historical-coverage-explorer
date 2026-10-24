"""
Structured Logging Configuration.
=================================
Configures structlog with standard library logging integration.
Outputs structured JSON logs with correlation IDs, timestamps, and log levels.
Provides utilities for sensitive data masking (e.g. VIN masking).
"""

import logging
import sys
from typing import Any

import structlog


def mask_vin(vin: str | None) -> str | None:
    """Mask vehicle identification number (e.g., 'DEMO-VIN-001' -> '••••-001')."""
    if not vin:
        return None
    clean = str(vin).strip()
    if len(clean) <= 4:
        return "••••"
    return f"••••-{clean[-3:]}"


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structlog and standard library logging to emit structured JSON."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Configure standard library root logger
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=numeric_level,
        force=True,
    )

    # Structlog processor pipeline
    processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True, key="timestamp"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ]

    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Retrieve a bound structured logger."""
    return structlog.get_logger(name or "historical-coverage-explorer")
