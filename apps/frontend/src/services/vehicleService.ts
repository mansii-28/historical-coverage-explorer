// ─── Vehicle Service ──────────────────────────────────────────────────────────
// All interactions with Vehicle data go through this service.
// Real HTTP calls to FastAPI /api/vehicles and /api/policies endpoints.

import type { Vehicle, VehicleRemovalResult, DemoState, AuditEvent } from '../types/domain'
import { apiFetch, USE_MOCK } from './apiClient'
import { getAuditEvents } from './auditService'

// GET /api/policies/{policy_id}/vehicles?include_removed=false
export async function getActiveVehicles(state?: DemoState, policyId: number = 1): Promise<Vehicle[]> {
  if (USE_MOCK && state) {
    return state.vehicles.filter((v) => v.is_active).map((v) => ({ ...v }))
  }
  return apiFetch<Vehicle[]>(`/api/policies/${policyId}/vehicles?include_removed=false`)
}

// GET /api/policies/{policy_id}/vehicles?include_removed=true
export async function getAllVehicles(state?: DemoState, policyId: number = 1): Promise<Vehicle[]> {
  if (USE_MOCK && state) {
    return state.vehicles.map((v) => ({ ...v }))
  }
  return apiFetch<Vehicle[]>(`/api/policies/${policyId}/vehicles?include_removed=true`)
}

// GET /api/policies/{policy_id}/vehicles (historical only)
export async function getHistoricalVehicles(state?: DemoState, policyId: number = 1): Promise<Vehicle[]> {
  if (USE_MOCK && state) {
    return state.vehicles.filter((v) => !v.is_active).map((v) => ({ ...v }))
  }
  const vehicles = await getAllVehicles(state, policyId)
  return vehicles.filter((v) => !v.is_active)
}

// POST /api/vehicles/{vehicle_id}/remove
// Returns the result, updated vehicle, updated coverage version ID, and newly emitted audit events.
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
  if (USE_MOCK) {
    const vehicle = state.vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) throw new Error('Vehicle not found')
    if (!vehicle.is_active) throw new Error('Vehicle is already removed')

    const activeCoverage = state.coverageVersions.find(
      (cv) => cv.vehicle_id === vehicleId && cv.valid_to === null,
    )
    if (!activeCoverage) throw new Error('No active coverage version found')

    const now = new Date().toISOString()
    const updatedVehicle: Vehicle = {
      ...vehicle,
      removed_at: effectiveDate,
      is_active: false,
    }

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

  // ─── Real Backend Call ───────────────────────────────────────────────────
  const removalResponse = await apiFetch<VehicleRemovalResult>(`/api/vehicles/${vehicleId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ effective_date: effectiveDate }),
  })

  // Load updated vehicle from server
  const updatedVehicle = await apiFetch<Vehicle>(`/api/vehicles/${vehicleId}`)

  // Retrieve updated audit events for policy
  const allAuditEvents = await getAuditEvents(state)

  return {
    result: removalResponse,
    updatedVehicle,
    updatedCoverageVersionId: removalResponse.closed_coverage_version_id,
    auditEvents: allAuditEvents,
  }
}
