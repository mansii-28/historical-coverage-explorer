// ─── Coverage History Page ───────────────────────────────────────────────────
// Explores effective-dated coverage versions, version timeline, and the
// advanced multi-version demonstration with colored temporal bands.

import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react'
import type { DemoState, CoverageVersion } from '../types/domain'
import { CoverageTimeline } from '../components/CoverageTimeline'
import { ADVANCED_COVERAGE_VERSION_1, ADVANCED_COVERAGE_VERSION_2 } from '../data/fixtures'

interface CoverageHistoryPageProps {
  state: DemoState
}

export function CoverageHistoryPage({ state }: CoverageHistoryPageProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [testDate, setTestDate] = useState('2026-01-05')

  const vehicle = state.vehicles[0]
  const currentVersions = state.coverageVersions.filter(
    (cv) => cv.vehicle_id === vehicle.id,
  )

  // Advanced version lookup logic for tester
  const testDateObj = new Date(testDate)
  let matchedAdvancedVersion: CoverageVersion | null = null

  if (testDateObj >= new Date('2026-01-01') && testDateObj < new Date('2026-01-08')) {
    matchedAdvancedVersion = ADVANCED_COVERAGE_VERSION_1
  } else if (testDateObj >= new Date('2026-01-08') && testDateObj < new Date('2026-01-15')) {
    matchedAdvancedVersion = ADVANCED_COVERAGE_VERSION_2
  }

  return (
    <div className="space-y-8">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb] mb-1">
            COVERAGE TIMELINE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1128]">
            Coverage over time.
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Resolve what was true on any date, not only what is active today.
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
              showAdvanced
                ? 'bg-[#7c3aed] text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={14} className={showAdvanced ? 'text-white' : 'text-[#7c3aed]'} />
            {showAdvanced ? 'Hide Advanced Versioning' : 'Show Advanced Versioning Example'}
          </button>
        </div>
      </div>

      {/* Principle Banner */}
      <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4.5 flex items-start gap-3">
        <Info className="h-5 w-5 text-[#00c2cb] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-[#0a1128] font-bold">Effective-Dated Intervals: </strong>
          Coverage versions are evaluated using half-open intervals:{' '}
          <code className="rounded bg-white border border-slate-200 px-1.5 py-0.5 font-mono text-[#0a1128] font-bold">
            valid_from &le; date_of_loss &lt; valid_to
          </code>
          . When policy terms evolve or vehicles are removed, existing versions are closed with an explicit end date and never overwritten.
        </div>
      </div>

      {/* Main Canonical Scenario Section */}
      {!showAdvanced ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0a1128] uppercase tracking-wider">
              Canonical Coverage Versions
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {currentVersions.length} version{currentVersions.length > 1 ? 's' : ''} on record
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentVersions.map((cv) => (
              <div
                key={cv.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 border-t-4 border-t-[#00c2cb]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-[#0a1128]">{cv.version_label}</span>
                    {cv.valid_to === null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle size={11} className="text-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        <Clock size={11} className="text-amber-600" />
                        Historical (Closed)
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-500">
                    Version ID: #{cv.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Effective Start</span>
                    <span className="font-bold text-[#0a1128] font-mono">{cv.valid_from}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Effective End</span>
                    <span className="font-bold text-amber-800 font-mono">
                      {cv.valid_to ?? 'Open / Ongoing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Coverage Type</span>
                    <span className="font-bold text-slate-900">{cv.coverage_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Liability / Deductible</span>
                    <span className="font-mono text-[#1e40af] font-bold">
                      ${Number(cv.liability_limit).toLocaleString()} / ${Number(cv.deductible).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Integrated Timeline */}
          <div className="pt-2">
            <CoverageTimeline
              coverageStart="2026-01-01"
              coverageEnd={vehicle.removed_at ?? currentVersions[0]?.valid_to}
              dateOfLoss="2026-01-10"
              claimFiledDate="2026-02-10"
              isCovered={true}
            />
          </div>
        </div>
      ) : (
        /* Advanced Versioning Demo */
        <div className="space-y-6">
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-[#7c3aed] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-[#7c3aed]">
                  Multiple Coverage Versions Demonstration
                </h3>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                  Real insurance policies often change terms over time (e.g., policyholder lowers their deductible).
                  Here, Version 1 had a <strong className="text-slate-900 font-bold">$1,000 deductible</strong> (Jan 1 &rarr; Jan 8), and Version 2 had a{' '}
                  <strong className="text-slate-900 font-bold">$500 deductible</strong> (Jan 8 &rarr; Jan 15).
                </p>
              </div>
            </div>
          </div>

          {/* Temporal Bands Visual Representation */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Temporal Bands Comparison
            </div>
            <div className="flex h-10 w-full rounded-lg overflow-hidden border border-slate-200 text-xs font-bold">
              <div className="w-1/2 bg-[#1e40af] text-white flex items-center justify-center gap-2 px-3">
                <span>Version 1</span>
                <span className="font-mono opacity-80">(Jan 1 → Jan 8: $1,000 Ded.)</span>
              </div>
              <div className="w-1/2 bg-[#00c2cb] text-[#0a1128] flex items-center justify-center gap-2 px-3">
                <span>Version 2</span>
                <span className="font-mono opacity-80">(Jan 8 → Jan 15: $500 Ded.)</span>
              </div>
            </div>
          </div>

          {/* Version Cards side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version 1 */}
            <div
              className={`rounded-xl border p-6 transition-all ${
                matchedAdvancedVersion?.id === 10
                  ? 'border-[#1e40af] bg-blue-50/50 ring-2 ring-[#1e40af]/30 shadow-md border-t-4 border-t-[#1e40af]'
                  : 'border-slate-200 bg-white border-t-4 border-t-[#1e40af]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-[#0a1128] text-base">Version 1 (Jan 1 → Jan 8)</span>
                {matchedAdvancedVersion?.id === 10 && (
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Active on {testDate}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Effective Interval:</span>
                  <span className="font-mono font-bold text-[#0a1128]">2026-01-01 &le; t &lt; 2026-01-08</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Coverage Type:</span>
                  <span className="font-semibold text-slate-900">Comprehensive</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Liability Limit:</span>
                  <span className="font-mono font-bold text-slate-900">$100,000</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Deductible:</span>
                  <span className="font-mono text-amber-700 font-extrabold text-sm">$1,000.00</span>
                </div>
              </div>
            </div>

            {/* Version 2 */}
            <div
              className={`rounded-xl border p-6 transition-all ${
                matchedAdvancedVersion?.id === 11
                  ? 'border-[#00c2cb] bg-cyan-50/50 ring-2 ring-[#00c2cb]/30 shadow-md border-t-4 border-t-[#00c2cb]'
                  : 'border-slate-200 bg-white border-t-4 border-t-[#00c2cb]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-[#0a1128] text-base">Version 2 (Jan 8 → Jan 15)</span>
                {matchedAdvancedVersion?.id === 11 && (
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    Active on {testDate}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Effective Interval:</span>
                  <span className="font-mono font-bold text-[#0a1128]">2026-01-08 &le; t &lt; 2026-01-15</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Coverage Type:</span>
                  <span className="font-semibold text-slate-900">Comprehensive</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Liability Limit:</span>
                  <span className="font-mono font-bold text-slate-900">$100,000</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Deductible:</span>
                  <span className="font-mono text-emerald-700 font-extrabold text-sm">$500.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Date Query Tester */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#7c3aed]" />
                <h4 className="text-sm font-bold text-[#0a1128]">Test Date-of-Loss Version Resolution</h4>
              </div>
              <span className="text-xs text-slate-500">Simulate lookup query</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="test-date-input" className="block text-xs font-semibold text-slate-600 mb-1">
                  Query Date of Loss:
                </label>
                <input
                  id="test-date-input"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#0a1128] font-mono shadow-xs focus:border-[#7c3aed] focus:outline-none"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setTestDate('2026-01-05')}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs"
                >
                  Jan 5 ($1,000 ded)
                </button>
                <button
                  type="button"
                  onClick={() => setTestDate('2026-01-10')}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs"
                >
                  Jan 10 ($500 ded)
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Resolved Version</span>
                  <span className="font-bold text-[#0a1128]">
                    {matchedAdvancedVersion?.version_label ?? 'No Match'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deductible</span>
                  <span className="font-bold font-mono text-[#1e40af]">
                    {matchedAdvancedVersion ? `$${Number(matchedAdvancedVersion.deductible).toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
