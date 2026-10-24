// ─── File Claim Page ─────────────────────────────────────────────────────────
// Implements point-in-time coverage lookup, covered vs manual review results,
// and claim creation with pinned coverage version.
// Two-column layout, cyan/mint positive treatment for COVERAGE_FOUND,
// warm amber for REQUIRES_MANUAL_REVIEW (never red denial), and strong pinned version block.

import React, { useState } from 'react'
import {
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
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb]">
            CLAIM EVIDENCE
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            File Historical Claim
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1128]">
          Resolve coverage from the date of loss.
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">
          Evaluate point-in-time insurance terms for the reported incident timestamp.
        </p>
      </div>

      {/* Main Flow: Two-Column Claim Form & Verification Result */}
      {!createdClaim ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Claim Parameters Input Form */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5 border-t-4 border-t-[#00c2cb]">
            <h2 className="text-sm font-bold text-[#0a1128] uppercase tracking-wider flex items-center gap-2">
              <Search className="h-4 w-4 text-[#00c2cb]" />
              1. Incident Details
            </h2>

            <form onSubmit={handleCheckCoverage} className="space-y-4">
              {/* Vehicle Selection */}
              <div>
                <label
                  htmlFor="claim-vehicle-select"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-[#0a1128] font-medium shadow-xs focus:border-[#00c2cb] focus:outline-none focus:ring-2 focus:ring-[#00c2cb]/20"
                >
                  {state.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.is_active ? 'Active' : 'Historical — Removed Jan 15'})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {selectedVehicle?.is_active
                    ? 'Vehicle is active on policy.'
                    : 'Vehicle is historical (soft-removed Jan 15). Historical records remain searchable.'}
                </p>
              </div>

              {/* Date of Loss */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="date-of-loss-input"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Date of Loss (Incident)
                  </label>
                  <span className="text-[11px] text-[#1e40af] font-bold">Determines Coverage</span>
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-[#0a1128] font-mono font-medium shadow-xs focus:border-[#00c2cb] focus:outline-none focus:ring-2 focus:ring-[#00c2cb]/20"
                />

                {/* Scenario Quick Presets */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateOfLoss('2026-01-10')
                      setLookupResult(null)
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                      dateOfLoss === '2026-01-10'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
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
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                      dateOfLoss === '2026-01-20'
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 ring-1 ring-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
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
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Date Claim Filed
                </label>
                <input
                  id="date-filed-input"
                  type="date"
                  value={dateFiled}
                  onChange={(e) => setDateFiled(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-[#0a1128] font-mono font-medium shadow-xs focus:border-[#00c2cb] focus:outline-none focus:ring-2 focus:ring-[#00c2cb]/20"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Default scenario date: <strong className="text-slate-900 font-mono">February 10, 2026</strong> (retrospective filing).
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#00c2cb] hover:bg-[#0891b2] disabled:bg-slate-200 disabled:text-slate-400 px-4 py-3 text-xs font-bold text-[#0a1128] transition-all shadow-xs cursor-pointer"
                >
                  {isChecking ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0a1128] border-t-transparent" />
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

          {/* Right Column: Verification Results Panel */}
          <div className="lg:col-span-7 space-y-4">
            {lookupResult ? (
              lookupResult.coverage_found ? (
                /* ─── Coverage Found Result (Jan 10) ────────────────────────── */
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-7 shadow-xs space-y-5 border-t-4 border-t-[#10b981] animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        COVERAGE_FOUND
                      </div>
                      <h3 className="text-2xl font-extrabold text-[#0a1128]">
                        Historical Coverage Found
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        The 2024 BMW X3 had verified active coverage on <strong className="text-slate-900">{dateOfLoss}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Matched Coverage Details */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-500 font-medium">Coverage Version:</span>
                      <span className="font-bold text-[#0a1128]">
                        {lookupResult.coverage_version?.version_label ?? 'Version 1'} (ID #{lookupResult.coverage_version?.id})
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-500 font-medium">Effective Dates:</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {lookupResult.coverage_version?.valid_from} &rarr; {lookupResult.coverage_version?.valid_to ?? 'Present'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-500 font-medium">Coverage Type:</span>
                      <span className="font-bold text-slate-900">
                        {lookupResult.coverage_version?.coverage_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Liability / Deductible:</span>
                      <span className="font-mono text-[#1e40af] font-bold">
                        ${Number(lookupResult.coverage_version?.liability_limit).toLocaleString()} limit / ${Number(lookupResult.coverage_version?.deductible).toLocaleString()} ded.
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
                  <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-700">Disclaimer: </span>
                    This prototype verifies point-in-time record existence and does not determine legal adjudication or claim approval.
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProofModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                      <FileCheck size={14} className="text-[#00c2cb]" />
                      View Historical Proof
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateClaim('OPEN')}
                      disabled={isSubmittingClaim}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0a1128] hover:bg-[#1a2952] disabled:bg-slate-200 disabled:text-slate-400 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                    >
                      {isSubmittingClaim ? 'Creating Claim…' : 'Continue Claim'}
                      <ArrowRight size={14} className="text-[#00c2cb]" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── Manual Review Result (Jan 20) ─────────────────────────── */
                <div className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-7 shadow-xs space-y-5 border-t-4 border-t-[#f97316] animate-in fade-in">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 mb-2">
                      <AlertTriangle size={13} className="text-amber-600" />
                      REQUIRES_MANUAL_REVIEW
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#0a1128]">
                      No Automated Coverage Match
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                      No deterministic historical match was found. Route for manual review.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-slate-700 leading-relaxed">
                    <p className="font-bold text-amber-900 mb-1">
                      Non-Destructive Routing Safeguard:
                    </p>
                    No deterministic match was found for {dateOfLoss}. This does not reject or deny the claim; the request routes directly to human review for endorsement verification.
                  </div>

                  {/* Embedded Timeline */}
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
                      className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] disabled:bg-slate-200 disabled:text-slate-400 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                    >
                      {isSubmittingClaim ? 'Submitting…' : 'Continue to Manual Review'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Awaiting User Check */
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Search size={22} />
                </div>
                <h3 className="text-base font-bold text-[#0a1128]">
                  Ready to Evaluate Coverage
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Select a date of loss and click "Check Historical Coverage" to query point-in-time coverage across effective date intervals.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Step 3: Claim Confirmation with Pinned Coverage Version */
        <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-200 bg-white p-8 space-y-6 shadow-md animate-in fade-in border-t-4 border-t-[#10b981]">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/50">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#0a1128]">
              Claim Successfully Created & Pinned
            </h2>
            <p className="text-xs text-slate-500">
              Claim Reference: <strong className="font-mono text-emerald-800 text-sm font-bold">{createdClaim.claim_number}</strong>
            </p>
          </div>

          {/* Frozen / Pinned Explanation Card */}
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4.5 flex items-start gap-3">
            <Shield className="h-5 w-5 text-[#00c2cb] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-[#0a1128] font-bold block mb-0.5">Immutable Historical Context:</strong>
              Coverage Version {createdClaim.coverage_version_id ?? 'None'} has been{' '}
              <strong className="text-slate-900 font-bold">pinned</strong> to this claim so subsequent policy updates or vehicle removals cannot silently alter its evidence.
            </div>
          </div>

          {/* Claim Summary Table */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4.5 text-xs space-y-2.5">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Claim Number:</span>
              <span className="font-mono font-bold text-[#0a1128]">{createdClaim.claim_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Date of Loss:</span>
              <span className="font-mono font-bold text-[#0a1128]">{createdClaim.date_of_loss}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Date Filed:</span>
              <span className="font-mono font-bold text-[#0a1128]">{createdClaim.filed_at}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Verification Status:</span>
              <span className="font-bold text-emerald-800">
                {createdClaim.coverage_verification_status}
              </span>
            </div>
            <div className="flex justify-between py-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-700 font-bold">Pinned Coverage Version:</span>
              <span className="font-mono text-[#1e40af] font-bold text-sm">
                {createdClaim.coverage_version_id ? `Version #${createdClaim.coverage_version_id}` : 'None (Manual Review)'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreatedClaim(null)
                setLookupResult(null)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} />
              File Another Claim
            </button>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a1128] hover:bg-[#1a2952] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              View in Audit Trail
              <ArrowRight size={14} className="text-[#00c2cb]" />
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
