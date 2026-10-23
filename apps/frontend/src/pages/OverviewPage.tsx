// ─── Overview / Dashboard Page ────────────────────────────────────────────────
// Executive summary designed to explain the canonical scenario in 15 seconds.

import {
  Shield,
  Car,
  Clock,
  FileText,
  Search,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import type { DemoState } from '../types/domain'
import { CoverageTimeline } from '../components/CoverageTimeline'

interface OverviewPageProps {
  state: DemoState
  onNavigate: (tab: string) => void
}

export function OverviewPage({ state, onNavigate }: OverviewPageProps) {
  const activeVehicles = state.vehicles.filter((v) => v.is_active)
  const historicalVehicles = state.vehicles.filter((v) => !v.is_active)
  const lookupEvents = state.auditEvents.filter(
    (e) => e.event_type === 'HISTORICAL_COVERAGE_LOOKUP',
  )
  const hasRemovedVehicle = historicalVehicles.length > 0

  return (
    <div className="space-y-8">
      {/* Top Hero / Scenario Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
            <Shield size={12} />
            Point-in-Time Temporal Architecture
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Historical Coverage Explorer
          </h1>
          <p className="text-sm md:text-base leading-relaxed text-slate-300">
            Demonstrating how effective-dated policy records enable retrospective claim verification.
            When a vehicle is removed from an active policy, its historical coverage remains preserved for
            incidents that occurred prior to removal.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('policy')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all"
            >
              <Car size={15} />
              {hasRemovedVehicle ? 'View Policy & Past Vehicles' : 'Start Walkthrough: Remove Vehicle'}
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('claim')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all"
            >
              <FileText size={15} />
              Test Claim Verification
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Policy Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Policy Status</span>
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white">{state.policy.status}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{state.policy.policy_number}</div>
        </div>

        {/* Active Vehicles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Vehicles</span>
            <Car className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white">{activeVehicles.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {activeVehicles.length > 0 ? '2024 BMW X3' : 'None active'}
          </div>
        </div>

        {/* Historical Vehicles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Historical Vehicles</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">{historicalVehicles.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {historicalVehicles.length > 0 ? 'Soft-removed records' : 'No past vehicles yet'}
          </div>
        </div>

        {/* Claims */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Claims Filed</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">{state.claims.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {state.claims.length > 0 ? 'Pinned version history' : 'Zero filed'}
          </div>
        </div>

        {/* Historical Lookups */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Audit Lookups</span>
            <Search className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white">{lookupEvents.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Immutable audit events</div>
        </div>
      </div>

      {/* The Scenario Lifecycle Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">The Canonical Scenario</h2>
            <p className="text-xs text-slate-400">
              Jordan Lee's 2024 BMW X3: accident on Jan 10, vehicle removed Jan 15, claim submitted Feb 10.
            </p>
          </div>
          <span className="text-xs font-medium text-indigo-400">DEMO-AUTO-1024</span>
        </div>

        <CoverageTimeline
          coverageStart="2026-01-01"
          coverageEnd={hasRemovedVehicle ? '2026-01-15' : null}
          dateOfLoss="2026-01-10"
          claimFiledDate="2026-02-10"
          isCovered={true}
        />
      </div>

      {/* Emphasized Principle Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Rule */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-300">
                Coverage Evaluates Date of Loss, Not Filing Date
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                In traditional CRUD applications, removing a vehicle deletes or overwrites the record,
                causing legitimate past claims to fail. With temporal versioning, queries evaluate coverage as of
                the exact timestamp when the loss occurred.
              </p>
            </div>
          </div>
        </div>

        {/* Product Insight */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-indigo-300">
                Product Design Insight
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Removing an entity from an active experience must never destroy historical evidence needed for
                downstream workflows like claims, audits, regulatory reporting, or proof of insurance generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
