// ─── Policy Service ───────────────────────────────────────────────────────────
// All interactions with Policy data go through this service.
// Phase 3 will replace mock implementations with real HTTP calls.

import type { Policy } from '../types/domain'
import type { DemoState } from '../types/domain'

const MOCK_DELAY_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/policies/{policy_id}
export async function getPolicy(state: DemoState): Promise<Policy> {
  await delay(MOCK_DELAY_MS)
  return { ...state.policy }
}
