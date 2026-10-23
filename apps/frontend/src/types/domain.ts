// ─── Domain Types ────────────────────────────────────────────────────────────
// Pure domain model — no UI dependencies.
// These mirror the backend data model and API contract.

// ─── Enumerations ────────────────────────────────────────────────────────────

export type PolicyStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED'

export type VehicleStatus = 'ACTIVE' | 'HISTORICAL'

export type CoverageVerificationStatus =
  | 'COVERAGE_FOUND'
  | 'NO_COVERAGE_FOUND'
  | 'REQUIRES_MANUAL_REVIEW'

export type ClaimStatus = 'OPEN' | 'UNDER_REVIEW' | 'CLOSED'

export type AuditEventType =
  | 'POLICY_CREATED'
  | 'VEHICLE_ADDED'
  | 'COVERAGE_ACTIVATED'
  | 'COVERAGE_CHANGED'
  | 'VEHICLE_REMOVAL_REQUESTED'
  | 'VEHICLE_REMOVED'
  | 'COVERAGE_CLOSED'
  | 'HISTORICAL_COVERAGE_LOOKUP'
  | 'HISTORICAL_COVERAGE_FOUND'
  | 'HISTORICAL_COVERAGE_NOT_FOUND'
  | 'CLAIM_CREATED'
  | 'CLAIM_LINKED_TO_COVERAGE_VERSION'
  | 'PROOF_OF_INSURANCE_GENERATED'

export type AuditEventCategory = 'policy' | 'vehicle' | 'coverage' | 'claim'

// ─── Entities ────────────────────────────────────────────────────────────────

export interface Policy {
  id: number
  policy_number: string
  customer_name: string
  status: PolicyStatus
  created_at: string // ISO date string
  updated_at: string
}

export interface Vehicle {
  id: number
  policy_id: number
  vin: string
  make: string
  model: string
  year: number
  added_at: string // ISO date string (YYYY-MM-DD)
  removed_at: string | null // null if still active
  is_active: boolean
}

export interface CoverageVersion {
  id: number
  policy_id: number
  vehicle_id: number
  valid_from: string // ISO date string (YYYY-MM-DD), inclusive
  valid_to: string | null // exclusive; null = currently active
  coverage_type: string
  liability_limit: string // decimal as string (e.g. "100000.00")
  deductible: string // decimal as string (e.g. "500.00")
  version_label: string // e.g. "Version 1"
  created_at: string
}

export interface Claim {
  id: number
  claim_number: string
  policy_id: number
  vehicle_id: number
  date_of_loss: string // YYYY-MM-DD — the critical date
  filed_at: string // ISO timestamp — when claim was submitted
  coverage_version_id: number | null // pinned at creation, never changes
  coverage_verification_status: CoverageVerificationStatus
  status: ClaimStatus
  created_at: string
}

export interface AuditEvent {
  id: number
  policy_id: number | null
  vehicle_id: number | null
  claim_id: number | null
  event_type: AuditEventType
  event_timestamp: string // ISO timestamp
  metadata_json: Record<string, unknown>
  created_at: string
  // Frontend-only: category for filtering
  category: AuditEventCategory
  // Frontend-only: human-readable label
  human_label: string
}

// ─── Service Response Types ───────────────────────────────────────────────────

export interface CoverageLookupResult {
  coverage_found: boolean
  coverage_version: CoverageVersion | null
  verification_status: CoverageVerificationStatus
  date_queried: string // the date_of_loss used in the lookup
  vehicle_id: number
}

export interface VehicleRemovalResult {
  message: string
  vehicle_id: number
  removed_at: string
  closed_coverage_version_id: number
}

export interface DemoResetResult {
  message: string
  policy_id: number
  vehicle_id: number
  coverage_version_id: number
}

// ─── Application State ───────────────────────────────────────────────────────

export interface DemoState {
  policy: Policy
  vehicles: Vehicle[]
  coverageVersions: CoverageVersion[]
  claims: Claim[]
  auditEvents: AuditEvent[]
}
