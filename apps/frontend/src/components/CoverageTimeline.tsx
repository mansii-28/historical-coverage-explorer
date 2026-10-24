// ─── Coverage Timeline Component ──────────────────────────────────────────────
// Visualizes the historical coverage window and point-in-time events.
// Explains clearly why a claim filed on Feb 10 for a loss on Jan 10 is covered
// even though the vehicle was removed on Jan 15.

import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

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
  const lossDateObj = new Date(dateOfLoss)
  const startDateObj = new Date(coverageStart)
  const endDateObj = coverageEnd ? new Date(coverageEnd) : null

  const isLossInCoverage =
    lossDateObj >= startDateObj && (endDateObj === null || lossDateObj < endDateObj)

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-xs ${compact ? 'p-4' : 'p-6'}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#00c2cb]" />
          <div>
            <h4 className="text-xs font-bold tracking-widest text-[#00c2cb] uppercase">
              Temporal Timeline
            </h4>
            <div className="text-base font-bold text-[#0a1128]">
              Date of loss determines historical coverage.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLossInCoverage ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Loss Occurred Inside Coverage Period
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
              <AlertCircle size={13} className="text-amber-600" />
              Loss Occurred Outside Coverage Period
            </span>
          )}
        </div>
      </div>

      {/* Visual Bar Timeline */}
      <div className="relative my-6 px-1">
        {/* Baseline track */}
        <div className="h-3 w-full rounded-full bg-slate-100 relative overflow-hidden flex border border-slate-200">
          {/* Active coverage interval bar (approx 0% to 50%) */}
          <div
            className="h-full bg-gradient-to-r from-[#00c2cb] to-[#10b981]"
            style={{ width: coverageEnd ? '50%' : '100%' }}
          />
          {/* Post-removal interval bar (50% to 100%) */}
          {coverageEnd && (
            <div className="h-full flex-1 bg-slate-200/80 border-l border-amber-400" />
          )}
        </div>

        {/* Timeline Interval Labels */}
        <div className="relative mt-2.5 flex justify-between text-xs font-semibold">
          <div className="text-left">
            <span className="text-emerald-700 font-bold">Active Coverage Interval</span>
            <div className="text-slate-500 font-normal">Jan 1 → {coverageEnd ? 'Jan 15, 2026' : 'Present'}</div>
          </div>
          {coverageEnd && (
            <div className="text-right">
              <span className="text-amber-700 font-bold">Post-Removal (No Active Coverage)</span>
              <div className="text-slate-500 font-normal">After Jan 15, 2026</div>
            </div>
          )}
        </div>

        {/* Milestone Pin Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Milestone 1: Coverage Start */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[#00c2cb]" />
              <span className="text-xs font-bold text-[#0a1128]">Jan 1, 2026</span>
            </div>
            <div className="text-xs font-bold text-emerald-700">Coverage Begins</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Policy & BMW X3 activated</div>
          </div>

          {/* Milestone 2: Date of Loss */}
          <div
            className={`rounded-xl border p-3.5 relative ${
              isLossInCoverage
                ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200'
                : 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isLossInCoverage ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500 ring-2 ring-amber-200'
                }`}
              />
              <span className="text-xs font-bold text-[#0a1128]">{dateOfLoss}</span>
            </div>
            <div
              className={`text-xs font-bold ${
                isLossInCoverage ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              Accident Occurs (Loss)
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {isLossInCoverage ? 'Coverage active on this date' : 'No active coverage on this date'}
            </div>
          </div>

          {/* Milestone 3: Removal Date */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-[#0a1128]">
                {coverageEnd ? coverageEnd : 'Not removed'}
              </span>
            </div>
            <div className="text-xs font-bold text-amber-800">
              {coverageEnd ? 'Vehicle Removed' : 'Vehicle Stays Active'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {coverageEnd ? 'Future active coverage ceases' : 'Ongoing active coverage'}
            </div>
          </div>

          {/* Milestone 4: Claim Filed */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[#1e40af]" />
              <span className="text-xs font-bold text-[#0a1128]">{claimFiledDate}</span>
            </div>
            <div className="text-xs font-bold text-[#1e40af]">Claim Filed</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Evaluated at loss date ({dateOfLoss})
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Narrative Footer */}
      {showExplanation && (
        <div className="mt-4 border-t border-slate-100 pt-3.5 text-xs leading-relaxed text-slate-600">
          <strong className="text-[#0a1128] font-bold">Key Architectural Guarantee: </strong>
          A claim submitted on <span className="font-semibold text-slate-900">{claimFiledDate}</span> evaluates coverage status on the date of loss (<span className="font-semibold text-slate-900">{dateOfLoss}</span>), not the submission date. Removing a vehicle on <span className="font-semibold text-slate-900">{coverageEnd ?? 'Jan 15'}</span> does not invalidate prior legitimate protection.
        </div>
      )}
    </div>
  )
}
