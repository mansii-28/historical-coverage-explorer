// ─── Mock Fixtures ────────────────────────────────────────────────────────────
// Deterministic seed data for the canonical Jordan Lee / DEMO-AUTO-1024 scenario.
// These are the base fixtures. DemoContext clones these on init/reset.
// Components must NOT import these directly — use the service layer instead.

import type {
  Policy,
  Vehicle,
  CoverageVersion,
  AuditEvent,
  DemoState,
} from '../types/domain'

// ─── Policy ──────────────────────────────────────────────────────────────────

export const SEED_POLICY: Policy = {
  id: 1,
  policy_number: 'DEMO-AUTO-1024',
  customer_name: 'Jordan Lee',
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export const SEED_VEHICLE: Vehicle = {
  id: 1,
  policy_id: 1,
  vin: 'DEMO-VIN-001',
  make: 'BMW',
  model: 'X3',
  year: 2024,
  added_at: '2026-01-01',
  removed_at: null, // active in initial state
  is_active: true,
}

// ─── Coverage Versions ────────────────────────────────────────────────────────
// Default scenario: single version covering Jan 1 → Jan 15

export const SEED_COVERAGE_VERSION_1: CoverageVersion = {
  id: 1,
  policy_id: 1,
  vehicle_id: 1,
  valid_from: '2026-01-01',
  valid_to: null, // null = currently active (before removal)
  coverage_type: 'Comprehensive',
  liability_limit: '100000.00',
  deductible: '500.00',
  version_label: 'Version 1',
  created_at: '2026-01-01T00:00:00Z',
}

// ─── Advanced Versioning Fixtures ─────────────────────────────────────────────
// Used in the "Show Advanced Versioning Example" toggle.
// Two versions: Jan 1–8 with $1,000 deductible, Jan 8–15 with $500 deductible.

export const ADVANCED_COVERAGE_VERSION_1: CoverageVersion = {
  id: 10,
  policy_id: 1,
  vehicle_id: 1,
  valid_from: '2026-01-01',
  valid_to: '2026-01-08',
  coverage_type: 'Comprehensive',
  liability_limit: '100000.00',
  deductible: '1000.00',
  version_label: 'Version 1',
  created_at: '2026-01-01T00:00:00Z',
}

export const ADVANCED_COVERAGE_VERSION_2: CoverageVersion = {
  id: 11,
  policy_id: 1,
  vehicle_id: 1,
  valid_from: '2026-01-08',
  valid_to: '2026-01-15',
  coverage_type: 'Comprehensive',
  liability_limit: '100000.00',
  deductible: '500.00',
  version_label: 'Version 2',
  created_at: '2026-01-08T00:00:00Z',
}

// ─── Audit Events (Initial State) ─────────────────────────────────────────────

export const SEED_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 1,
    policy_id: 1,
    vehicle_id: null,
    claim_id: null,
    event_type: 'POLICY_CREATED',
    event_timestamp: '2026-01-01T00:00:00Z',
    metadata_json: { policy_number: 'DEMO-AUTO-1024', customer_name: 'Jordan Lee' },
    created_at: '2026-01-01T00:00:00Z',
    category: 'policy',
    human_label: 'Policy Created',
  },
  {
    id: 2,
    policy_id: 1,
    vehicle_id: 1,
    claim_id: null,
    event_type: 'VEHICLE_ADDED',
    event_timestamp: '2026-01-01T00:01:00Z',
    metadata_json: { vin: 'DEMO-VIN-001', make: 'BMW', model: 'X3', year: 2024 },
    created_at: '2026-01-01T00:01:00Z',
    category: 'vehicle',
    human_label: 'Vehicle Added',
  },
  {
    id: 3,
    policy_id: 1,
    vehicle_id: 1,
    claim_id: null,
    event_type: 'COVERAGE_ACTIVATED',
    event_timestamp: '2026-01-01T00:02:00Z',
    metadata_json: {
      coverage_type: 'Comprehensive',
      liability_limit: '100000.00',
      deductible: '500.00',
      valid_from: '2026-01-01',
    },
    created_at: '2026-01-01T00:02:00Z',
    category: 'coverage',
    human_label: 'Coverage Activated',
  },
]

// ─── Initial Demo State ───────────────────────────────────────────────────────

export function createInitialDemoState(): DemoState {
  return {
    policy: { ...SEED_POLICY },
    vehicles: [{ ...SEED_VEHICLE }],
    coverageVersions: [{ ...SEED_COVERAGE_VERSION_1 }],
    claims: [],
    auditEvents: [...SEED_AUDIT_EVENTS.map((e) => ({ ...e }))],
  }
}
