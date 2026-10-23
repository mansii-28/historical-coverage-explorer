// ─── Claim Service ────────────────────────────────────────────────────────────
// All interactions with Claim data go through this service.
// Real HTTP calls to FastAPI /api/claims endpoints with mock fallback.

import type { Claim, CoverageLookupResult, DemoState, AuditEvent } from '../types/domain'
import { apiFetch, USE_MOCK } from './apiClient'
import { getAuditEvents } from './auditService'

// GET /api/claims (all claims for a policy)
export async function getClaims(state?: DemoState, policyId: number = 1): Promise<Claim[]> {
  if (USE_MOCK && state) {
    return state.claims.map((c) => ({ ...c }))
  }
  return apiFetch<Claim[]>(`/api/claims?policy_id=${policyId}`)
}

// POST /api/claims
// Creates a real claim with pinned coverage version.
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
  if (USE_MOCK) {
    const now = new Date().toISOString()
    const claimCount = state.claims.length + 1
    const newId = state.claims.length > 0 ? Math.max(...state.claims.map((c) => c.id)) + 1 : 1

    const claim: Claim = {
      id: newId,
      claim_number: `DEMO-CLM-${String(claimCount).padStart(4, '0')}`,
      policy_id: state.policy.id,
      vehicle_id: vehicleId,
      date_of_loss: dateOfLoss,
      filed_at: filedAt,
      coverage_version_id: lookupResult.coverage_version?.id ?? null,
      coverage_verification_status: lookupResult.verification_status,
      status: lookupResult.coverage_found ? 'OPEN' : 'UNDER_REVIEW',
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

  // ─── Real Backend Call ───────────────────────────────────────────────────
  let filedAtIso: string
  try {
    filedAtIso = new Date(filedAt).toISOString()
  } catch {
    filedAtIso = new Date().toISOString()
  }

  const claim = await apiFetch<Claim>('/api/claims', {
    method: 'POST',
    body: JSON.stringify({
      policy_id: state.policy.id,
      vehicle_id: vehicleId,
      date_of_loss: dateOfLoss,
      filed_at: filedAtIso,
    }),
  })

  // Retrieve updated audit events from server
  const auditEvents = await getAuditEvents(state)

  return { claim, auditEvents }
}

// GET /api/claims/{claim_id}
export async function getClaim(state?: DemoState, claimId: number = 1): Promise<Claim | null> {
  if (USE_MOCK && state) {
    const found = state.claims.find((c) => c.id === claimId)
    return found ? { ...found } : null
  }
  return apiFetch<Claim>(`/api/claims/${claimId}`)
}
