// ─── File Claim Page ─────────────────────────────────────────────────────────
// Implements point-in-time coverage lookup, covered vs manual review results,
// and claim creation with pinned coverage version.

import React, { useState } from 'react'
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileCheck,
  Check,
  RotateCcw,
} from 'lucide-react'
import type { DemoState, CoverageLookupResult, Claim } from '../types/domain'
import { checkCoverage } from '../services/coverageService'
import { createClaim } from '../services/claimService'
import { CoverageTimeline } from '../components/CoverageTimeline'
import { ProofOfInsuranceModal } from '../components/ProofOfInsuranceModal'

interface FileClaimPageProps {
  state: DemoState
  setState: React.Dispatch<React.SetStateAction<DemoState>>
  onNavigate: (tab: string) => void
  showToast: (title: string, message: string, variant: 'success' | 'warning' | 'error' | 'info') => void
}

export function FileClaimPage({ state, setState, onNavigate, showToast }: FileClaimPageProps) {
  const [vehicleId, setVehicleId] = useState<number>(state.vehicles[0]?.id ?? 1)
  const [dateOfLoss, setDateOfLoss] = useState('2026-01-10')
  const [dateFiled, setDateFiled] = useState('2026-02-10')

  const [isChecking, setIsChecking] = useState(false)
  const [lookupResult, setLookupResult] = useState<CoverageLookupResult | null>(null)
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false)
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null)
  const [showProofModal, setShowProofModal] = useState(false)

  const selectedVehicle = state.vehicles.find((v) => v.id === vehicleId) ?? state.vehicles[0]

  // Step 1: Check Coverage
  const handleCheckCoverage = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChecking(true)
    setCreatedClaim(null)

    try {
      const { lookup, auditEvents } = await checkCoverage(state, vehicleId, dateOfLoss)
      setLookupResult(lookup)

      // Append lookup audit events
      setState((prev) => {
        const maxId = prev.auditEvents.length > 0 ? Math.max(...prev.auditEvents.map((ev) => ev.id)) : 0
        const newEvents = auditEvents.map((ev, i) => ({ ...ev, id: maxId + 1 + i }))
        return {
          ...prev,
          auditEvents: [...prev.auditEvents, ...newEvents],
        }
      })

      if (lookup.coverage_found) {
        showToast('Coverage Found', `Historical coverage verified for ${dateOfLoss}.`, 'success')
      } else {
        showToast(
          'Requires Manual Review',
          `No automated coverage matched for ${dateOfLoss}. Routed to manual review.`,
          'warning',
        )
      }
    } catch (err: unknown) {
      showToast('Error', err instanceof Error ? err.message : 'Lookup failed', 'error')
    } finally {
      setIsChecking(false)
    }
  }

  // Step 2: Create Claim (pinned coverage version)
  const handleCreateClaim = async (statusOverride?: 'OPEN' | 'UNDER_REVIEW') => {
    if (!lookupResult) return
    setIsSubmittingClaim(true)

    try {
      const { claim, auditEvents } = await createClaim(
        state,
        vehicleId,
        dateOfLoss,
        dateFiled,
        lookupResult,
      )

      if (statusOverride) {
        claim.status = statusOverride
      }

      setState((prev) => {
        const maxId = prev.auditEvents.length > 0 ? Math.max(...prev.auditEvents.map((ev) => ev.id)) : 0
        const newEvents = auditEvents.map((ev, i) => ({ ...ev, id: maxId + 1 + i }))
        return {
          ...prev,
          claims: [...prev.claims, claim],
          auditEvents: [...prev.auditEvents, ...newEvents],
        }
      })

      setCreatedClaim(claim)
      showToast(
        'Claim Created',
        `Claim ${claim.claim_number} created with pinned coverage version.`,
        'success',
      )
    } catch (err: unknown) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to file claim', 'error')
    } finally {
      setIsSubmittingClaim(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Retrospective Verification Workflow
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          File Historical Claim
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Evaluate point-in-time insurance coverage for a reported incident date, even if the vehicle
          has since been removed from the active policy.
        </p>
      </div>

      {/* Main Flow: Claim Form */}
      {!createdClaim ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claim Parameters Input Form */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-400" />
              1. Incident Details
            </h2>

            <form onSubmit={handleCheckCoverage} className="space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label
                  htmlFor="claim-vehicle-select"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Covered Vehicle
                </label>
                <select
                  id="claim-vehicle-select"
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(Number(e.target.value))
                    setLookupResult(null)
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {state.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.is_active ? 'Active' : 'Historical — Removed Jan 15'})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  {selectedVehicle?.is_active
                    ? 'Vehicle is currently active on policy.'
                    : 'Vehicle is historical (soft-removed Jan 15, 2026). Historical records remain searchable.'}
                </p>
              </div>

              {/* Date of Loss */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="date-of-loss-input"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    Date of Loss (Incident)
                  </label>
                  <span className="text-[11px] text-indigo-400 font-medium">Critical Date</span>
                </div>
                <input
                  id="date-of-loss-input"
                  type="date"
                  value={dateOfLoss}
                  onChange={(e) => {
                    setDateOfLoss(e.target.value)
                    setLookupResult(null)
                  }}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />

                {/* Scenario Quick Presets */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateOfLoss('2026-01-10')
                      setLookupResult(null)
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      dateOfLoss === '2026-01-10'
                        ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Canonical: Jan 10 (Covered)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateOfLoss('2026-01-20')
                      setLookupResult(null)
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      dateOfLoss === '2026-01-20'
                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Uncovered: Jan 20 (Manual Review)
                  </button>
                </div>
              </div>

              {/* Date Filed */}
              <div>
                <label
                  htmlFor="date-filed-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Date Claim Filed
                </label>
                <input
                  id="date-filed-input"
                  type="date"
                  value={dateFiled}
                  onChange={(e) => setDateFiled(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Default scenario date: <span className="text-slate-200 font-mono">February 10, 2026</span> (after vehicle was removed).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-3 text-xs font-semibold text-white transition-all shadow-md"
                >
                  {isChecking ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Evaluating Point-in-Time Coverage…
                    </span>
                  ) : (
                    <>
                      <Search size={14} />
                      Check Historical Coverage
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Verification Results Panel */}
          <div className="lg:col-span-7 space-y-4">
            {lookupResult ? (
              lookupResult.coverage_found ? (
                /* ─── Coverage Found Result (Jan 10) ────────────────────────── */
                <div className="rounded-xl border border-emerald-500/30 bg-slate-900/90 p-6 space-y-5 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 mb-2">
                        <CheckCircle2 size={13} />
                        COVERAGE_FOUND
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        Historical Coverage Found
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        The 2024 BMW X3 had active coverage on {dateOfLoss}.
                      </p>
                    </div>
                  </div>

                  {/* Matched Coverage Details */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Matched Version:</span>
                      <span className="font-semibold text-slate-200">
                        {lookupResult.coverage_version?.version_label ?? 'Version 1'} (ID #{lookupResult.coverage_version?.id})
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Effective Coverage Period:</span>
                      <span className="font-semibold text-emerald-400">
                        {lookupResult.coverage_version?.valid_from} &rarr; {lookupResult.coverage_version?.valid_to ?? 'Present'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Coverage Type:</span>
                      <span className="font-semibold text-slate-200">
                        {lookupResult.coverage_version?.coverage_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Liability / Deductible:</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        ${Number(lookupResult.coverage_version?.liability_limit).toLocaleString()} / ${Number(lookupResult.coverage_version?.deductible).toLocaleString()} ded.
                      </span>
                    </div>
                  </div>

                  {/* Embedded Timeline */}
                  <CoverageTimeline
                    coverageStart="2026-01-01"
                    coverageEnd={selectedVehicle.removed_at ?? lookupResult.coverage_version?.valid_to}
                    dateOfLoss={dateOfLoss}
                    claimFiledDate={dateFiled}
                    isCovered={true}
                    compact={true}
                    showExplanation={false}
                  />

                  {/* Critical Adjudication Disclaimer */}
                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                    <span className="font-semibold text-slate-300">Disclaimer: </span>
                    This prototype demonstrates historical record retrieval and does not determine legal claim eligibility.
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProofModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
                    >
                      <FileCheck size={14} />
                      View Historical Proof
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateClaim('OPEN')}
                      disabled={isSubmittingClaim}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all"
                    >
                      {isSubmittingClaim ? 'Creating Claim…' : 'Continue Claim'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── Manual Review Result (Jan 20) ─────────────────────────── */
                <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-6 space-y-5 animate-in fade-in">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30 mb-2">
                      <AlertTriangle size={13} />
                      REQUIRES_MANUAL_REVIEW
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      No Automated Coverage Match
                    </h3>
                    <p className="text-xs text-amber-300/90 mt-1">
                      No coverage version was active on {dateOfLoss} based on the available historical records.
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-slate-300 leading-relaxed">
                    <p className="font-semibold text-amber-300 mb-1">
                      Non-Destructive Insurance Safeguard:
                    </p>
                    This result does <strong className="text-white">not</strong> automatically reject the claim. The claim may continue to manual review by an insurance adjuster who can inspect endorsements, grace periods, or special exceptions.
                  </div>

                  {/* Embedded Timeline showing outside boundary */}
                  <CoverageTimeline
                    coverageStart="2026-01-01"
                    coverageEnd={selectedVehicle.removed_at ?? '2026-01-15'}
                    dateOfLoss={dateOfLoss}
                    claimFiledDate={dateFiled}
                    isCovered={false}
                    compact={true}
                    showExplanation={false}
                  />

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCreateClaim('UNDER_REVIEW')}
                      disabled={isSubmittingClaim}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all"
                    >
                      {isSubmittingClaim ? 'Submitting…' : 'Continue to Manual Review'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Awaiting User Check */
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
                <Search className="mx-auto h-8 w-8 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-300">
                  Ready to Evaluate Coverage
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a date of loss and click "Check Historical Coverage" to evaluate point-in-time coverage against effective date intervals.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Step 3: Claim Confirmation with Pinned Coverage Version */
        <div className="max-w-2xl mx-auto rounded-xl border border-emerald-500/40 bg-slate-900/90 p-8 space-y-6 shadow-2xl animate-in fade-in">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Claim Successfully Created & Pinned
            </h2>
            <p className="text-xs text-slate-400">
              Claim Reference: <strong className="font-mono text-emerald-400 text-sm">{createdClaim.claim_number}</strong>
            </p>
          </div>

          {/* Frozen / Pinned Explanation Card */}
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/30 p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-300 block mb-0.5">Immutable Historical Context:</strong>
              Coverage Version {createdClaim.coverage_version_id ?? 'None'} has been{' '}
              <strong className="text-white">pinned</strong> to this claim so future policy changes or vehicle deletions do not silently alter its historical context.
            </div>
          </div>

          {/* Claim Summary Table */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Claim Number:</span>
              <span className="font-mono font-bold text-slate-200">{createdClaim.claim_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Date of Loss:</span>
              <span className="font-mono text-slate-200">{createdClaim.date_of_loss}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Date Filed:</span>
              <span className="font-mono text-slate-200">{createdClaim.filed_at}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Verification Status:</span>
              <span className="font-semibold text-emerald-400">
                {createdClaim.coverage_verification_status}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Pinned Coverage Version:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {createdClaim.coverage_version_id ? `Version #${createdClaim.coverage_version_id}` : 'None (Manual Review)'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                setCreatedClaim(null)
                setLookupResult(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors"
            >
              <RotateCcw size={13} />
              File Another Claim
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              View in Audit Trail
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {showProofModal && selectedVehicle && (
        <ProofOfInsuranceModal
          isOpen={true}
          onClose={() => setShowProofModal(false)}
          policy={state.policy}
          vehicle={selectedVehicle}
          coverageVersion={lookupResult?.coverage_version ?? state.coverageVersions[0]}
          asOfDate={dateOfLoss}
        />
      )}
    </div>
  )
}
