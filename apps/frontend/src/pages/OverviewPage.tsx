// ─── Overview / Dashboard Page ────────────────────────────────────────────────
// Product landing/dashboard hybrid inspired by Tint's editorial aesthetic:
// Two-column hero, canonical state product card, scenario timeline,
// and a contrasting dark navy feature section.

import {
  Car,
  Clock,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  FileCheck,
  AlertTriangle,
} from 'lucide-react'
import type { DemoState } from '../types/domain'
import { CoverageTimeline } from '../components/CoverageTimeline'
import { StatCard } from '../components/ui'

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
  const coverageVersion = state.coverageVersions[0]

  return (
    <div className="space-y-12">
      {/* ─── Hero: Two-Column Editorial Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-200/80 px-3 py-1 text-[11px] font-bold tracking-widest uppercase text-cyan-900">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00c2cb]" />
            HISTORICAL COVERAGE PROTOTYPE
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#0a1128] leading-[1.08]">
            Coverage history should survive active-state changes.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
            A vehicle can be removed today while a future claim still depends on what coverage existed on the date of loss. This prototype proves how point-in-time policy records guarantee non-destructive retrospective claims.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate('policy')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00c2cb] hover:bg-[#0891b2] px-5 py-3 text-sm font-bold text-[#0a1128] shadow-xs transition-all cursor-pointer"
            >
              <span>Explore the scenario</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('architecture')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition-all cursor-pointer"
            >
              <span>View architecture</span>
            </button>
          </div>
        </div>

        {/* Right Column: Polished Product Card (Tint-Inspired UI Card) */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-hidden border-t-4 border-t-[#00c2cb]">
            {/* Header / Insured Info */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00c2cb] block mb-0.5">
                  CANONICAL POLICY RECORD
                </span>
                <div className="text-xl font-bold text-[#0a1128]">{state.policy.customer_name}</div>
                <div className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                  {state.policy.policy_number}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={12} className="text-emerald-600" />
                {state.policy.status}
              </span>
            </div>

            {/* Vehicle Details */}
            <div className="py-4 space-y-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Covered Vehicle</span>
                <span className="text-sm font-bold text-[#0a1128]">2024 BMW X3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Vehicle Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  hasRemovedVehicle
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {hasRemovedVehicle ? 'Historical (Soft-Removed Jan 15)' : 'Active on Policy'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Effective Coverage</span>
                <span className="text-xs font-bold text-slate-900">Active since Jan 1, 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Deductible</span>
                <span className="text-xs font-mono font-bold text-[#1e40af]">
                  ${coverageVersion ? Math.round(Number(coverageVersion.deductible)).toLocaleString() : '500'} deductible
                </span>
              </div>
            </div>

            {/* Micro Scenario Guidance */}
            <div className="pt-4 flex items-center justify-between text-xs">
              <span className="text-slate-500">Point-in-time lookup ready</span>
              <button
                type="button"
                onClick={() => onNavigate('claim')}
                className="text-xs font-bold text-[#1e40af] hover:text-[#00c2cb] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                Test claim match &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Policy Status */}
        <StatCard
          icon={<ShieldCheck size={18} className="text-emerald-700" />}
          label="Policy Status"
          value={state.policy.status}
          subtext={state.policy.policy_number}
          accentColor="bg-emerald-50 text-emerald-700"
        />

        {/* Active Vehicles */}
        <StatCard
          icon={<Car size={18} className="text-[#00c2cb]" />}
          label="Active Vehicles"
          value={activeVehicles.length}
          subtext={activeVehicles.length > 0 ? '2024 BMW X3' : 'None active'}
          accentColor="bg-cyan-50 text-cyan-800"
        />

        {/* Historical Vehicles */}
        <StatCard
          icon={<Clock size={18} className="text-amber-700" />}
          label="Historical Vehicles"
          value={historicalVehicles.length}
          subtext={historicalVehicles.length > 0 ? 'Soft-removed records' : 'No past vehicles yet'}
          accentColor="bg-amber-50 text-amber-700"
        />

        {/* Claims Filed */}
        <StatCard
          icon={<FileText size={18} className="text-[#1e40af]" />}
          label="Claims Filed"
          value={state.claims.length}
          subtext={state.claims.length > 0 ? 'Pinned version history' : 'Zero filed'}
          accentColor="bg-blue-50 text-[#1e40af]"
        />

        {/* Audit Lookups */}
        <StatCard
          icon={<Search size={18} className="text-[#7c3aed]" />}
          label="Audit Lookups"
          value={lookupEvents.length}
          subtext="Immutable audit events"
          accentColor="bg-purple-50 text-[#7c3aed]"
        />
      </div>

      {/* ─── The Canonical Scenario Timeline ─────────────────────────────────── */}
      <div className="space-y-4">
        <CoverageTimeline
          coverageStart="2026-01-01"
          coverageEnd={hasRemovedVehicle ? '2026-01-15' : null}
          dateOfLoss="2026-01-10"
          claimFiledDate="2026-02-10"
          isCovered={true}
        />
      </div>

      {/* ─── Dark Feature Section: Tint-Inspired Contrast Rhythm ─────────────── */}
      <div className="rounded-2xl bg-[#0a1128] text-white p-8 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00c2cb]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4 mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb]">
            ARCHITECTURAL PILLARS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Historical truth, not current state.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Insurance software requires point-in-time deterministic evaluation. Current active state answers what is true now; temporal records answer what was true when the incident occurred.
          </p>
        </div>

        {/* 4 Cobalt/Dark Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d]/90 p-5 space-y-2.5 transition-all hover:border-[#00c2cb]/50">
            <div className="h-8 w-8 rounded-lg bg-[#00c2cb]/15 flex items-center justify-center text-[#00c2cb]">
              <Layers size={18} />
            </div>
            <h3 className="text-base font-bold text-white">Effective-dated coverage</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every term is bounded by half-open intervals (<code className="text-[#00c2cb] font-mono">valid_from &le; loss &lt; valid_to</code>), never overwritten.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d]/90 p-5 space-y-2.5 transition-all hover:border-[#10b981]/50">
            <div className="h-8 w-8 rounded-lg bg-[#10b981]/15 flex items-center justify-center text-[#10b981]">
              <Clock size={18} />
            </div>
            <h3 className="text-base font-bold text-white">Soft removal</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ceasing active coverage caps the interval but permanently protects the record for retrospective audits and claims.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d]/90 p-5 space-y-2.5 transition-all hover:border-[#f97316]/50">
            <div className="h-8 w-8 rounded-lg bg-[#f97316]/15 flex items-center justify-center text-[#f97316]">
              <FileCheck size={18} />
            </div>
            <h3 className="text-base font-bold text-white">Pinned claim context</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Claims lock to the exact coverage version in effect at the date of loss so subsequent policy changes cannot mutate claim evidence.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d]/90 p-5 space-y-2.5 transition-all hover:border-[#ec4899]/50">
            <div className="h-8 w-8 rounded-lg bg-[#ec4899]/15 flex items-center justify-center text-[#ec4899]">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-white">Manual review safety</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When no automated match is found, claims route to human review rather than causing immediate and erroneous claim denial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
