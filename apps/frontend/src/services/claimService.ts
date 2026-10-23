// ─── Claim Service ────────────────────────────────────────────────────────────
// All interactions with Claim data go through this service.
// Phase 3 will replace mock implementations with real HTTP calls to:
//   POST /api/claims
//   GET  /api/claims/{claim_id}

import type { Claim, CoverageLookupResult, DemoState, AuditEvent } from '../types/domain'

const MOCK_DELAY_MS = 400

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/claims (all claims for a policy)
export async function getClaims(state: DemoState): Promise<Claim[]> {
  await delay(MOCK_DELAY_MS)
  return state.claims.map((c) => ({ ...c }))
}

// POST /api/claims
// Creates a mock claim pinned to the provided coverage lookup result.
// The coverage_version_id is frozen at creation and never changes.
export async function createClaim(
  state: DemoState,
  vehicleId: number,
  dateOfLoss: string,
  filedAt: string,
  lookupResult: CoverageLookupResult,
): Promise<{
  claim: Claim
  auditEvents: Omit<AuditEvent, 'id'>[]
}> {
  await delay(MOCK_DELAY_MS)

  const now = new Date().toISOString()
  const claimCount = state.claims.length + 1
  const newId = state.claims.length > 0 ? Math.max(...state.claims.map((c) => c.id)) + 1 : 1

  const claim: Claim = {
    id: newId,
    claim_number: `DEMO-CLM-${String(claimCount).padStart(3, '0')}`,
    policy_id: state.policy.id,
    vehicle_id: vehicleId,
    date_of_loss: dateOfLoss,
    filed_at: filedAt,
    coverage_version_id: lookupResult.coverage_version?.id ?? null,
    coverage_verification_status: lookupResult.verification_status,
    status: 'OPEN',
    created_at: now,
  }

  const auditEvents: Omit<AuditEvent, 'id'>[] = [
    {
      policy_id: state.policy.id,
      vehicle_id: vehicleId,
      claim_id: newId,
      event_type: 'CLAIM_CREATED',
      event_timestamp: now,
      metadata_json: {
        claim_number: claim.claim_number,
        date_of_loss: dateOfLoss,
        filed_at: filedAt,
        coverage_verification_status: lookupResult.verification_status,
      },
      created_at: now,
      category: 'claim',
      human_label: 'Claim Created',
    },
  ]

  if (lookupResult.coverage_version) {
    auditEvents.push({
      policy_id: state.policy.id,
      vehicle_id: vehicleId,
      claim_id: newId,
      event_type: 'CLAIM_LINKED_TO_COVERAGE_VERSION',
      event_timestamp: new Date(new Date(now).getTime() + 100).toISOString(),
      metadata_json: {
        claim_number: claim.claim_number,
        coverage_version_id: lookupResult.coverage_version.id,
        version_label: lookupResult.coverage_version.version_label,
      },
      created_at: now,
      category: 'claim',
      human_label: 'Claim Linked to Coverage Version',
    })
  }

  return { claim, auditEvents }
}

// GET /api/claims/{claim_id}
export async function getClaim(state: DemoState, claimId: number): Promise<Claim | null> {
  await delay(MOCK_DELAY_MS)
  const found = state.claims.find((c) => c.id === claimId)
  return found ? { ...found } : null
}
