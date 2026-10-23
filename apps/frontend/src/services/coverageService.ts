// ─── Coverage Service ─────────────────────────────────────────────────────────
// All interactions with coverage data go through this service.
// Real HTTP calls to FastAPI /api/coverage and /api/vehicles coverage endpoints.

import type { CoverageVersion, CoverageLookupResult, DemoState, AuditEvent } from '../types/domain'
import { ADVANCED_COVERAGE_VERSION_1, ADVANCED_COVERAGE_VERSION_2 } from '../data/fixtures'
import { apiFetch, USE_MOCK } from './apiClient'
import { getAuditEvents } from './auditService'

// Helper for mock mode interval evaluation
function isCoverageActiveOnDate(cv: CoverageVersion, dateString: string): boolean {
  const d = new Date(dateString)
  const from = new Date(cv.valid_from)
  const to = cv.valid_to ? new Date(cv.valid_to) : null

  if (d < from) return false
  if (to !== null && d >= to) return false
  return true
}

// GET /api/vehicles/{vehicle_id}/coverage-history
export async function getCoverageHistory(
  state?: DemoState,
  vehicleId: number = 1,
): Promise<CoverageVersion[]> {
  if (USE_MOCK && state) {
    return state.coverageVersions
      .filter((cv) => cv.vehicle_id === vehicleId)
      .map((cv) => ({ ...cv }))
      .sort((a, b) => a.valid_from.localeCompare(b.valid_from))
  }
  return apiFetch<CoverageVersion[]>(`/api/vehicles/${vehicleId}/coverage-history`)
}

// GET /api/vehicles/{vehicle_id}/coverage-history (advanced versioning example)
export async function getAdvancedCoverageVersions(): Promise<CoverageVersion[]> {
  if (USE_MOCK) {
    return [{ ...ADVANCED_COVERAGE_VERSION_1 }, { ...ADVANCED_COVERAGE_VERSION_2 }]
  }
  return [{ ...ADVANCED_COVERAGE_VERSION_1 }, { ...ADVANCED_COVERAGE_VERSION_2 }]
}

// POST /api/coverage/check
// Core: evaluates historical coverage for a given date-of-loss.
export async function checkCoverage(
  state: DemoState,
  vehicleId: number,
  dateOfLoss: string,
): Promise<{
  lookup: CoverageLookupResult
  auditEvents: Omit<AuditEvent, 'id'>[]
}> {
  if (USE_MOCK) {
    const now = new Date().toISOString()
    const vehicleCoverages = state.coverageVersions.filter((cv) => cv.vehicle_id === vehicleId)
    const matched = vehicleCoverages.find((cv) => isCoverageActiveOnDate(cv, dateOfLoss)) ?? null

    const coverageFound = matched !== null
    const verificationStatus = coverageFound ? 'COVERAGE_FOUND' : 'REQUIRES_MANUAL_REVIEW'

    const auditEvents: Omit<AuditEvent, 'id'>[] = [
      {
        policy_id: state.policy.id,
        vehicle_id: vehicleId,
        claim_id: null,
        event_type: 'HISTORICAL_COVERAGE_LOOKUP',
        event_timestamp: now,
        metadata_json: { vehicle_id: vehicleId, date_of_loss: dateOfLoss },
        created_at: now,
        category: 'coverage',
        human_label: 'Historical Coverage Lookup',
      },
      {
        policy_id: state.policy.id,
        vehicle_id: vehicleId,
        claim_id: null,
        event_type: coverageFound ? 'HISTORICAL_COVERAGE_FOUND' : 'HISTORICAL_COVERAGE_NOT_FOUND',
        event_timestamp: new Date(new Date(now).getTime() + 50).toISOString(),
        metadata_json: {
          vehicle_id: vehicleId,
          date_of_loss: dateOfLoss,
          coverage_version_id: matched?.id ?? null,
          result: verificationStatus,
        },
        created_at: now,
        category: 'coverage',
        human_label: coverageFound ? 'Historical Coverage Found' : 'Historical Coverage Not Found',
      },
    ]

    return {
      lookup: {
        coverage_found: coverageFound,
        coverage_version: matched ? { ...matched } : null,
        verification_status: verificationStatus,
        date_queried: dateOfLoss,
        vehicle_id: vehicleId,
      },
      auditEvents,
    }
  }

  // ─── Real Backend Call ───────────────────────────────────────────────────
  const lookup = await apiFetch<CoverageLookupResult>('/api/coverage/check', {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: vehicleId, date_of_loss: dateOfLoss }),
  })

  // Retrieve updated audit events from the server
  const auditEvents = await getAuditEvents(state)

  return { lookup, auditEvents }
}

// Check against advanced versioning fixtures (for the demo toggle)
export async function checkAdvancedCoverage(
  dateOfLoss: string,
): Promise<CoverageLookupResult> {
  const versions = [ADVANCED_COVERAGE_VERSION_1, ADVANCED_COVERAGE_VERSION_2]
  const matched = versions.find((cv) => isCoverageActiveOnDate(cv, dateOfLoss)) ?? null

  return {
    coverage_found: matched !== null,
    coverage_version: matched ? { ...matched } : null,
    verification_status: matched !== null ? 'COVERAGE_FOUND' : 'REQUIRES_MANUAL_REVIEW',
    date_queried: dateOfLoss,
    vehicle_id: 1,
  }
}
