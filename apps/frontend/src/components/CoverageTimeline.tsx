// ─── Coverage Timeline Component ──────────────────────────────────────────────
// Visualizes the historical coverage window and point-in-time events.
// Explains clearly why a claim filed on Feb 10 for a loss on Jan 10 is covered
// even though the vehicle was removed on Jan 15.

import { Calendar, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'

interface CoverageTimelineProps {
  coverageStart?: string // default: '2026-01-01'
  coverageEnd?: string | null // default: '2026-01-15' (null = active)
  dateOfLoss?: string // default: '2026-01-10'
  claimFiledDate?: string // default: '2026-02-10'
  isCovered?: boolean
  compact?: boolean
  showExplanation?: boolean
}

export function CoverageTimeline({
  coverageStart = '2026-01-01',
  coverageEnd = '2026-01-15',
  dateOfLoss = '2026-01-10',
  claimFiledDate = '2026-02-10',
  compact = false,
  showExplanation = true,
}: CoverageTimelineProps) {
  // Check if loss date is between start and end
  const lossDateObj = new Date(dateOfLoss)
  const startDateObj = new Date(coverageStart)
  const endDateObj = coverageEnd ? new Date(coverageEnd) : null

  const isLossInCoverage =
    lossDateObj >= startDateObj && (endDateObj === null || lossDateObj < endDateObj)

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/80 ${compact ? 'p-4' : 'p-6'}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-400" />
          <h4 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
            Effective Coverage & Lifecycle Timeline
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {isLossInCoverage ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 size={13} />
              Loss Occurred Inside Coverage Period
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
              <XCircle size={13} />
              Loss Occurred Outside Coverage Period
            </span>
          )}
        </div>
      </div>

      {/* Visual Bar Timeline */}
      <div className="relative my-6 px-4">
        {/* Baseline track */}
        <div className="h-3 w-full rounded-full bg-slate-800 relative overflow-hidden">
          {/* Active coverage interval bar (approx 0% to 50%) */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full"
            style={{ width: coverageEnd ? '50%' : '100%' }}
          />
          {/* Post-removal interval bar (50% to 100%) */}
          {coverageEnd && (
            <div className="absolute top-0 bottom-0 left-[50%] right-0 bg-slate-800/80 border-l border-amber-500/50" />
          )}
        </div>

        {/* Timeline Interval Labels */}
        <div className="relative mt-2 flex justify-between text-[11px] font-medium text-slate-400">
          <div className="text-left">
            <span className="text-emerald-400 font-semibold">Active Coverage Interval</span>
            <div className="text-slate-500">Jan 1 → {coverageEnd ? 'Jan 15, 2026' : 'Present'}</div>
          </div>
          {coverageEnd && (
            <div className="text-right">
              <span className="text-amber-400/90 font-semibold">Post-Removal (No Active Coverage)</span>
              <div className="text-slate-500">After Jan 15, 2026</div>
            </div>
          )}
        </div>

        {/* Milestone Pin Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Milestone 1: Coverage Start */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
              <span className="text-xs font-bold text-slate-300">Jan 1, 2026</span>
            </div>
            <div className="text-xs font-medium text-emerald-400">Coverage Begins</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Policy & BMW X3 activated</div>
          </div>

          {/* Milestone 2: Date of Loss */}
          <div
            className={`rounded-lg p-3 relative border ${
              isLossInCoverage
                ? 'border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                : 'border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isLossInCoverage
                      ? 'bg-emerald-400 ring-4 ring-emerald-500/30'
                      : 'bg-amber-400 ring-4 ring-amber-500/30'
                  }`}
                />
                <span className="text-xs font-bold text-slate-200">
                  {dateOfLoss === '2026-01-10'
                    ? 'Jan 10, 2026'
                    : dateOfLoss === '2026-01-20'
                    ? 'Jan 20, 2026'
                    : dateOfLoss}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isLossInCoverage ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                Date of Loss
              </span>
            </div>
            <div
              className={`text-xs font-semibold ${
                isLossInCoverage ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isLossInCoverage ? 'Accident Occurred' : 'Incident Date (Uncovered)'}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {isLossInCoverage
                ? 'Happened while coverage was active'
                : 'Happened after vehicle removal'}
            </div>
          </div>

          {/* Milestone 3: Vehicle Removal */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-amber-500/20" />
              <span className="text-xs font-bold text-slate-300">
                {coverageEnd ? 'Jan 15, 2026' : 'Ongoing'}
              </span>
            </div>
            <div className="text-xs font-medium text-amber-400">
              {coverageEnd ? 'Vehicle Removed' : 'Active on Policy'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {coverageEnd
                ? 'Soft-removed; coverage closed'
                : 'Currently receiving active coverage'}
            </div>
          </div>

          {/* Milestone 4: Claim Filed */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-500/20" />
              <span className="text-xs font-bold text-slate-300">
                {claimFiledDate === '2026-02-10' ? 'Feb 10, 2026' : claimFiledDate}
              </span>
            </div>
            <div className="text-xs font-medium text-indigo-400">Claim Filed</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Submitted 26 days after vehicle removal
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory callout banner */}
      {showExplanation && (
        <div className="mt-4 rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-3.5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-indigo-300">Core Domain Principle: </span>
            Historical coverage lookup evaluates <strong className="text-white">Date of Loss ({dateOfLoss})</strong> against
            the effective coverage interval ({coverageStart} → {coverageEnd ?? 'Present'}). Even though the claim was filed on{' '}
            <strong className="text-white">{claimFiledDate}</strong> after the vehicle was removed,{' '}
            {isLossInCoverage ? (
              <span className="text-emerald-300 font-semibold">
                the loss date falls inside the active coverage window, so historical coverage is validly matched.
              </span>
            ) : (
              <span className="text-amber-300 font-semibold">
                the loss date falls outside the active coverage window, triggering manual review rather than automated matching.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
