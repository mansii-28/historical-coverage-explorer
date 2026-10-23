// ─── Coverage History Page ───────────────────────────────────────────────────
// Explores effective-dated coverage versions, version timeline, and the
// advanced multi-version demonstration.

import { useState } from 'react'
import {
  Layers,
  CheckCircle,
  Clock,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle,
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
      {/* Page Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Temporal Coverage Records
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Coverage Version History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Vehicle: <strong className="text-slate-200">2024 BMW X3</strong> (VIN: ••••-001) • Policy: DEMO-AUTO-1024
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                showAdvanced
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'border border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40'
              }`}
            >
              <Sparkles size={14} />
              {showAdvanced ? 'Hide Advanced Versioning' : 'Show Advanced Versioning Example'}
            </button>
          </div>
        </div>

        {/* Core Principle Banner */}
        <div className="mt-5 rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3.5 flex items-start gap-3">
          <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-indigo-300">Effective-Dated Intervals: </span>
            Coverage versions are evaluated using half-open intervals:{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-indigo-200">
              valid_from &le; date_of_loss &lt; valid_to
            </code>
            . When policy terms change or vehicles are removed, existing versions are closed with an end date and never deleted.
          </div>
        </div>
      </div>

      {/* Main Canonical Scenario Section */}
      {!showAdvanced ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Canonical Coverage Versions
            </h2>
            <span className="text-xs text-slate-400">
              {currentVersions.length} version{currentVersions.length > 1 ? 's' : ''} on record
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentVersions.map((cv) => (
              <div
                key={cv.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-white">{cv.version_label}</span>
                    {cv.valid_to === null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                        <CheckCircle size={11} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                        <Clock size={11} />
                        Historical (Closed)
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Version ID: #{cv.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Effective Start</span>
                    <span className="font-semibold text-slate-200">{cv.valid_from}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Effective End</span>
                    <span className="font-semibold text-amber-300">
                      {cv.valid_to ?? 'Open / Ongoing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Coverage Type</span>
                    <span className="font-semibold text-slate-200">{cv.coverage_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Liability / Deductible</span>
                    <span className="font-mono text-slate-200 font-semibold">
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
        /* Advanced Versioning Demo (# 18) */
        <div className="space-y-6">
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-purple-200">
                  Multiple Coverage Versions Demonstration
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Real insurance policies often change terms over time (e.g., policyholder lowers their deductible).
                  Here, Version 1 had a <strong>$1,000 deductible</strong> (Jan 1 → Jan 8), and Version 2 had a{' '}
                  <strong>$500 deductible</strong> (Jan 8 → Jan 15).
                </p>
              </div>
            </div>
          </div>

          {/* Version Cards side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version 1 */}
            <div
              className={`rounded-xl border p-5 transition-all ${
                matchedAdvancedVersion?.id === 10
                  ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm">Version 1 (Jan 1 → Jan 8)</span>
                {matchedAdvancedVersion?.id === 10 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                    Active on {testDate}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Effective Interval:</span>
                  <span className="font-mono text-slate-200">2026-01-01 &le; t &lt; 2026-01-08</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage Type:</span>
                  <span className="text-slate-200">Comprehensive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Liability Limit:</span>
                  <span className="text-slate-200 font-mono">$100,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deductible:</span>
                  <span className="text-amber-300 font-bold font-mono">$1,000.00</span>
                </div>
              </div>
            </div>

            {/* Version 2 */}
            <div
              className={`rounded-xl border p-5 transition-all ${
                matchedAdvancedVersion?.id === 11
                  ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm">Version 2 (Jan 8 → Jan 15)</span>
                {matchedAdvancedVersion?.id === 11 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                    Active on {testDate}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Effective Interval:</span>
                  <span className="font-mono text-slate-200">2026-01-08 &le; t &lt; 2026-01-15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage Type:</span>
                  <span className="text-slate-200">Comprehensive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Liability Limit:</span>
                  <span className="text-slate-200 font-mono">$100,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deductible:</span>
                  <span className="text-emerald-400 font-bold font-mono">$500.00 (Lowered)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Date-of-Loss Tester */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Interactive Date-of-Loss Evaluator
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="test-date-input" className="text-xs text-slate-300 font-medium">
                  Test Date of Loss:
                </label>
                <input
                  id="test-date-input"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <button
                onClick={() => setTestDate('2026-01-05')}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  testDate === '2026-01-05'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Preset: Jan 5 (Version 1)
              </button>
              <button
                onClick={() => setTestDate('2026-01-10')}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  testDate === '2026-01-10'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Preset: Jan 10 (Version 2)
              </button>
            </div>

            {/* Evaluation Result Card */}
            {matchedAdvancedVersion ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-emerald-300">
                    Evaluated Match: {matchedAdvancedVersion.version_label}
                  </span>
                  <p className="mt-0.5">
                    For an incident on <strong className="text-white">{testDate}</strong>, the policy applied{' '}
                    <strong className="text-white">{matchedAdvancedVersion.version_label}</strong> with a{' '}
                    <strong className="text-emerald-300">${Number(matchedAdvancedVersion.deductible).toLocaleString()} deductible</strong>.
                    Because coverage is deterministic and pinned to the incident date, future changes never mutate this entitlement.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <strong className="font-bold">No Version Active on {testDate}</strong>
                  <p className="mt-0.5">
                    Date {testDate} falls outside both coverage version intervals [2026-01-01 → 2026-01-15].
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
