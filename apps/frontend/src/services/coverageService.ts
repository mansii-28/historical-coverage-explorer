// ─── Coverage Service ─────────────────────────────────────────────────────────
// All interactions with coverage data go through this service.
// Phase 3 will replace mock implementations with real HTTP calls to:
//   GET  /api/vehicles/{vehicle_id}/coverage-history
//   GET  /api/vehicles/{vehicle_id}/coverage?as_of={date}
//   POST /api/coverage/check

import type { CoverageVersion, CoverageLookupResult, DemoState, AuditEvent } from '../types/domain'
import { ADVANCED_COVERAGE_VERSION_1, ADVANCED_COVERAGE_VERSION_2 } from '../data/fixtures'

const MOCK_DELAY_MS = 350

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Evaluates whether a coverage version is active on a given date.
// Implements: valid_from <= date_of_loss < valid_to (valid_to exclusive)
function isCoverageActiveOnDate(cv: CoverageVersion, dateString: string): boolean {
  const d = new Date(dateString)
  const from = new Date(cv.valid_from)
  const to = cv.valid_to ? new Date(cv.valid_to) : null

  // d >= valid_from
  if (d < from) return false
  // d < valid_to (if valid_to is set)
  if (to !== null && d >= to) return false
  return true
}

// GET /api/vehicles/{vehicle_id}/coverage-history
export async function getCoverageHistory(
  state: DemoState,
  vehicleId: number,
): Promise<CoverageVersion[]> {
  await delay(MOCK_DELAY_MS)
  return state.coverageVersions
    .filter((cv) => cv.vehicle_id === vehicleId)
    .map((cv) => ({ ...cv }))
    .sort((a, b) => a.valid_from.localeCompare(b.valid_from))
}

// GET /api/vehicles/{vehicle_id}/coverage-history (advanced versioning example)
export async function getAdvancedCoverageVersions(): Promise<CoverageVersion[]> {
  await delay(MOCK_DELAY_MS)
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
  await delay(MOCK_DELAY_MS)

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

// Also check against advanced versioning fixtures (for the demo toggle)
export async function checkAdvancedCoverage(
  dateOfLoss: string,
): Promise<CoverageLookupResult> {
  await delay(MOCK_DELAY_MS)
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
