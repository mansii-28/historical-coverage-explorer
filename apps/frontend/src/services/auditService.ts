// ─── Audit Service ────────────────────────────────────────────────────────────
// All interactions with audit event data go through this service.
// Real HTTP calls to FastAPI /api/policies/{policy_id}/audit-events with mock fallback.

import type { AuditEvent, AuditEventCategory, DemoState } from '../types/domain'
import { apiFetch, USE_MOCK } from './apiClient'

// GET /api/policies/{policy_id}/audit-events
export async function getAuditEvents(
  state?: DemoState,
  category?: AuditEventCategory | 'all',
): Promise<AuditEvent[]> {
  if (USE_MOCK && state) {
    const events = state.auditEvents
      .map((e) => ({ ...e }))
      .sort((a, b) => a.event_timestamp.localeCompare(b.event_timestamp))

    if (!category || category === 'all') {
      return events
    }
    return events.filter((e) => e.category === category)
  }

  const policyId = state?.policy?.id ?? 1
  const query = category && category !== 'all' ? `?category=${category}` : ''
  return apiFetch<AuditEvent[]>(`/api/policies/${policyId}/audit-events${query}`)
}

// Human-readable labels for audit event types
export const AUDIT_EVENT_LABELS: Record<string, string> = {
  POLICY_CREATED: 'Policy Created',
  VEHICLE_ADDED: 'Vehicle Added',
  COVERAGE_ACTIVATED: 'Coverage Activated',
  COVERAGE_CHANGED: 'Coverage Terms Updated',
  VEHICLE_REMOVAL_REQUESTED: 'Vehicle Removal Requested',
  VEHICLE_REMOVED: 'Vehicle Removed',
  COVERAGE_CLOSED: 'Coverage Closed',
  HISTORICAL_COVERAGE_LOOKUP: 'Historical Coverage Lookup',
  HISTORICAL_COVERAGE_FOUND: 'Historical Coverage Found',
  HISTORICAL_COVERAGE_NOT_FOUND: 'Historical Coverage Not Found',
  CLAIM_CREATED: 'Claim Created',
  CLAIM_LINKED_TO_COVERAGE_VERSION: 'Claim Linked to Coverage Version',
  CLAIM_SENT_TO_MANUAL_REVIEW: 'Claim Routed to Manual Review',
  PROOF_OF_INSURANCE_GENERATED: 'Proof of Insurance Generated',
}
