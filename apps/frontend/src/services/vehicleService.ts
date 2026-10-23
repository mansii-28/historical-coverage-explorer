// ─── Vehicle Service ──────────────────────────────────────────────────────────
// All interactions with Vehicle data go through this service.
// Phase 3 will replace mock implementations with real HTTP calls to:
//   GET  /api/policies/{policy_id}/vehicles?include_removed=true|false
//   POST /api/vehicles/{vehicle_id}/remove

import type { Vehicle, VehicleRemovalResult, DemoState, AuditEvent } from '../types/domain'

const MOCK_DELAY_MS = 300

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GET /api/policies/{policy_id}/vehicles?include_removed=false
export async function getActiveVehicles(state: DemoState): Promise<Vehicle[]> {
  await delay(MOCK_DELAY_MS)
  return state.vehicles.filter((v) => v.is_active).map((v) => ({ ...v }))
}

// GET /api/policies/{policy_id}/vehicles?include_removed=true
export async function getAllVehicles(state: DemoState): Promise<Vehicle[]> {
  await delay(MOCK_DELAY_MS)
  return state.vehicles.map((v) => ({ ...v }))
}

// GET /api/policies/{policy_id}/vehicles (historical only)
export async function getHistoricalVehicles(state: DemoState): Promise<Vehicle[]> {
  await delay(MOCK_DELAY_MS)
  return state.vehicles.filter((v) => !v.is_active).map((v) => ({ ...v }))
}

// POST /api/vehicles/{vehicle_id}/remove
// Returns the result and the new audit events to append.
export async function removeVehicle(
  state: DemoState,
  vehicleId: number,
  effectiveDate: string,
): Promise<{
  result: VehicleRemovalResult
  updatedVehicle: Vehicle
  updatedCoverageVersionId: number
  auditEvents: Omit<AuditEvent, 'id'>[]
}> {
  await delay(MOCK_DELAY_MS)

  const vehicle = state.vehicles.find((v) => v.id === vehicleId)
  if (!vehicle) throw new Error('Vehicle not found')
  if (!vehicle.is_active) throw new Error('Vehicle is already removed')

  // Find the currently active coverage version for this vehicle
  const activeCoverage = state.coverageVersions.find(
    (cv) => cv.vehicle_id === vehicleId && cv.valid_to === null,
  )
  if (!activeCoverage) throw new Error('No active coverage version found')

  const now = new Date().toISOString()

  const updatedVehicle: Vehicle = {
    ...vehicle,
    removed_at: effectiveDate,
    is_active: false,
    updated_at: now,
  } as Vehicle & { updated_at: string }

  const auditEvents: Omit<AuditEvent, 'id'>[] = [
    {
      policy_id: vehicle.policy_id,
      vehicle_id: vehicle.id,
      claim_id: null,
      event_type: 'VEHICLE_REMOVAL_REQUESTED',
      event_timestamp: now,
      metadata_json: { vehicle_id: vehicleId, effective_date: effectiveDate },
      created_at: now,
      category: 'vehicle',
      human_label: 'Vehicle Removal Requested',
    },
    {
      policy_id: vehicle.policy_id,
      vehicle_id: vehicle.id,
      claim_id: null,
      event_type: 'VEHICLE_REMOVED',
      event_timestamp: new Date(new Date(now).getTime() + 100).toISOString(),
      metadata_json: { vehicle_id: vehicleId, removed_at: effectiveDate },
      created_at: now,
      category: 'vehicle',
      human_label: 'Vehicle Removed',
    },
    {
      policy_id: vehicle.policy_id,
      vehicle_id: vehicle.id,
      claim_id: null,
      event_type: 'COVERAGE_CLOSED',
      event_timestamp: new Date(new Date(now).getTime() + 200).toISOString(),
      metadata_json: {
        coverage_version_id: activeCoverage.id,
        valid_to: effectiveDate,
      },
      created_at: now,
      category: 'coverage',
      human_label: 'Coverage Closed',
    },
  ]

  return {
    result: {
      message: 'Vehicle removed successfully.',
      vehicle_id: vehicleId,
      removed_at: effectiveDate,
      closed_coverage_version_id: activeCoverage.id,
    },
    updatedVehicle,
    updatedCoverageVersionId: activeCoverage.id,
    auditEvents,
  }
}
