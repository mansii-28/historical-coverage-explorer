// ─── Audit Service ────────────────────────────────────────────────────────────
// All interactions with audit event data go through this service.
// Phase 3 will replace mock implementations with real HTTP calls to:
//   GET /api/policies/{policy_id}/audit-events

import type { AuditEvent, AuditEventCategory, DemoState } from '../types/domain'

const MOCK_DELAY_MS = 250

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/policies/{policy_id}/audit-events
export async function getAuditEvents(
  state: DemoState,
  category?: AuditEventCategory | 'all',
): Promise<AuditEvent[]> {
  await delay(MOCK_DELAY_MS)
  const events = state.auditEvents
    .map((e) => ({ ...e }))
    .sort((a, b) => a.event_timestamp.localeCompare(b.event_timestamp))

  if (!category || category === 'all') {
    return events
  }
  return events.filter((e) => e.category === category)
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
  PROOF_OF_INSURANCE_GENERATED: 'Proof of Insurance Generated',
}
