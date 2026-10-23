"""
Audit Service.
==============
Manages durable, immutable audit events for all domain mutations and queries.
"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditEvent
from app.schemas import EVENT_CATEGORY_MAP


async def record_audit_event(
    session: AsyncSession,
    event_type: str,
    metadata_json: dict[str, Any],
    policy_id: int | None = None,
    vehicle_id: int | None = None,
    claim_id: int | None = None,
    event_timestamp: datetime | None = None,
) -> AuditEvent:
    """Create and persist an immutable domain audit event."""
    if event_timestamp is None:
        event_timestamp = datetime.now(UTC)

    event = AuditEvent(
        policy_id=policy_id,
        vehicle_id=vehicle_id,
        claim_id=claim_id,
        event_type=event_type,
        event_timestamp=event_timestamp,
        metadata_json=metadata_json,
    )
    session.add(event)
    await session.flush()
    return event


async def get_audit_events_for_policy(
    session: AsyncSession,
    policy_id: int,
    category: str | None = None,
) -> list[AuditEvent]:
    """Retrieve audit events for a policy ordered chronologically."""
    query = (
        select(AuditEvent)
        .where(AuditEvent.policy_id == policy_id)
        .order_by(AuditEvent.event_timestamp.asc(), AuditEvent.id.asc())
    )
    result = await session.execute(query)
    events = list(result.scalars().all())

    if category and category != "all":
        events = [e for e in events if EVENT_CATEGORY_MAP.get(e.event_type) == category]

    return events
