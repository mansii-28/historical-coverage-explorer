// ─── Policy Service ───────────────────────────────────────────────────────────
// All interactions with Policy data go through this service.
// Real HTTP calls to FastAPI /api/policies endpoints with mock fallback.

import type { Policy, DemoState } from '../types/domain'
import { apiFetch, USE_MOCK } from './apiClient'

// GET /api/policies/{policy_id}
export async function getPolicy(state?: DemoState, policyId: number = 1): Promise<Policy> {
  if (USE_MOCK && state) {
    return { ...state.policy }
  }
  return apiFetch<Policy>(`/api/policies/${policyId}`)
}
