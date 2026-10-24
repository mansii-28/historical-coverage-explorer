// ─── Policy Dashboard Page ───────────────────────────────────────────────────
// Manages policy view, active vehicles, soft removal workflow, and past vehicles.
// Editorial design with wide clean policy summary, cyan top rule for active vehicle,
// and soft neutral card with orange top rule for historical vehicles.

import React, { useState } from 'react'
import {
  Car,
  Trash2,
  Clock,
  FileCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import type { DemoState, Vehicle } from '../types/domain'
import { removeVehicle } from '../services/vehicleService'
import { RemoveVehicleModal } from '../components/RemoveVehicleModal'
import { ProofOfInsuranceModal } from '../components/ProofOfInsuranceModal'

interface PolicyPageProps {
  state: DemoState
  setState: React.Dispatch<React.SetStateAction<DemoState>>
  onNavigate: (tab: string) => void
  showToast: (title: string, message: string, variant: 'success' | 'warning' | 'error' | 'info') => void
}

export function PolicyPage({ state, setState, onNavigate, showToast }: PolicyPageProps) {
  const [selectedVehicleForRemoval, setSelectedVehicleForRemoval] = useState<Vehicle | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [proofVehicle, setProofVehicle] = useState<Vehicle | null>(null)

  const activeVehicles = state.vehicles.filter((v) => v.is_active)
  const pastVehicles = state.vehicles.filter((v) => !v.is_active)
  const coverageVersion = state.coverageVersions[0]

  const handleConfirmRemoval = async (effectiveDate: string) => {
    if (!selectedVehicleForRemoval) return
    setIsRemoving(true)
    try {
      const { updatedVehicle, updatedCoverageVersionId, auditEvents } = await removeVehicle(
        state,
        selectedVehicleForRemoval.id,
        effectiveDate,
      )

      setState((prev) => {
        const nextVehicles = prev.vehicles.map((v) =>
          v.id === updatedVehicle.id ? updatedVehicle : v,
        )
        const nextCoverageVersions = prev.coverageVersions.map((cv) =>
          cv.id === updatedCoverageVersionId ? { ...cv, valid_to: effectiveDate } : cv,
        )
        const maxId = prev.auditEvents.length > 0 ? Math.max(...prev.auditEvents.map((e) => e.id)) : 0
        const newEventsWithIds = auditEvents.map((e, idx) => ({ ...e, id: maxId + 1 + idx }))

        return {
          ...prev,
          vehicles: nextVehicles,
          coverageVersions: nextCoverageVersions,
          auditEvents: [...prev.auditEvents, ...newEventsWithIds],
        }
      })

      showToast(
        'Vehicle Removed',
        `${selectedVehicleForRemoval.year} ${selectedVehicleForRemoval.make} ${selectedVehicleForRemoval.model} soft-removed effective ${effectiveDate}. Historical coverage preserved.`,
        'success',
      )
      setSelectedVehicleForRemoval(null)
    } catch (err: unknown) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to remove vehicle', 'error')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Editorial Header & Wide Policy Summary ───────────────────────────── */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb] mb-1">
          POLICY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1128]">
          Current state and historical state.
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">
          Managing insured entities requires preserving their temporal coverage timeline even after removal from active policy schedules.
        </p>
      </div>

      {/* Wide Clean Policy Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Personal Automobile Policy
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                <CheckCircle size={11} className="text-emerald-600" />
                {state.policy.status}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a1128] font-mono">
              {state.policy.policy_number}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Named Insured: <strong className="text-slate-900 font-semibold">{state.policy.customer_name}</strong> • Policy Term Effective since Jan 1, 2026
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('coverage')}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              View Full Coverage Terms
            </button>
          </div>
        </div>

        {/* Policy Summary Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Underwriting Class</span>
            <div className="font-bold text-[#0a1128]">Private Passenger Auto</div>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Liability Limit</span>
            <div className="font-bold text-[#0a1128] font-mono">$100,000 / $300,000 CSL</div>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Default Deductible</span>
            <div className="font-bold text-[#1e40af] font-mono">
              ${coverageVersion ? Math.round(Number(coverageVersion.deductible)).toLocaleString() : '500'} Comprehensive
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">State Jurisdiction</span>
            <div className="font-bold text-[#0a1128]">California (CA)</div>
          </div>
        </div>
      </div>

      {/* ─── Active Vehicles Section ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[#00c2cb]" />
            <h2 className="text-base font-bold text-[#0a1128] uppercase tracking-wider">
              Active Vehicles ({activeVehicles.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Currently insured on active policy</span>
        </div>

        {activeVehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <Car className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active vehicles on policy</p>
            <p className="text-xs text-slate-400 mt-1">
              All vehicles have been removed from active coverage. Past records remain preserved below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden border-t-4 border-t-[#00c2cb] transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                        <CheckCircle size={10} className="text-emerald-600" />
                        Active
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        VIN: <span className="text-slate-700 font-semibold">••••-001</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-[#0a1128]">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Added: <span className="text-slate-700 font-medium">{vehicle.added_at}</span> • Active Coverage since Jan 1, 2026
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setProofVehicle(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                      <FileCheck size={14} className="text-[#00c2cb]" />
                      Proof of Insurance
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedVehicleForRemoval(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#00c2cb] hover:bg-[#0891b2] px-3.5 py-2 text-xs font-bold text-[#0a1128] transition-colors cursor-pointer shadow-xs"
                    >
                      <Trash2 size={13} />
                      Remove Vehicle
                    </button>
                  </div>
                </div>

                {/* Coverage Details Sub-panel */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Coverage Type</span>
                    <span className="font-semibold text-slate-900">Comprehensive & Collision</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Deductible</span>
                    <span className="font-semibold text-[#1e40af] font-mono">
                      ${coverageVersion ? Math.round(Number(coverageVersion.deductible)).toLocaleString() : '500'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Loss History</span>
                    <span className="font-semibold text-emerald-700">0 Prior Open Claims</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Past / Historical Vehicles Section ─────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[#f97316]" />
            <h2 className="text-base font-bold text-[#0a1128] uppercase tracking-wider">
              Past Vehicles ({pastVehicles.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Historical records preserved for retrospective claims</span>
        </div>

        {pastVehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-400 text-xs">
            No vehicles removed yet. Click "Remove Vehicle" above to test the soft-removal lifecycle.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pastVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 shadow-xs relative overflow-hidden border-t-4 border-t-[#f97316]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                        <Clock size={10} className="text-amber-600" />
                        Historical
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        VIN: <span className="text-slate-700 font-semibold">••••-001</span>
                      </span>
                      <span className="text-[11px] text-amber-800 font-semibold">
                        • Soft-removed record
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-[#0a1128]">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1">
                      Removed: <strong className="text-slate-900 font-semibold">Jan 15, 2026</strong> • Added: {vehicle.added_at}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setProofVehicle(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                      <FileCheck size={14} className="text-slate-500" />
                      Historical Proof
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('claim')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a1128] hover:bg-[#1a2952] px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Test Jan 10 Claim
                    </button>
                  </div>
                </div>

                {/* Explanatory Callout Banner */}
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs flex items-start gap-2.5 text-amber-950">
                  <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Removed from active state ≠ deleted: </span>
                    Coverage for this vehicle was active from <span className="font-semibold">Jan 1, 2026 &rarr; Jan 15, 2026</span>. Incidents that occurred within this window remain 100% covered and verifiable.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove Vehicle Modal */}
      {selectedVehicleForRemoval && (
        <RemoveVehicleModal
          isOpen={true}
          onClose={() => setSelectedVehicleForRemoval(null)}
          vehicle={selectedVehicleForRemoval}
          onConfirm={handleConfirmRemoval}
          isLoading={isRemoving}
        />
      )}

      {/* Proof of Insurance Modal */}
      {proofVehicle && (
        <ProofOfInsuranceModal
          isOpen={true}
          onClose={() => setProofVehicle(null)}
          policy={state.policy}
          vehicle={proofVehicle}
          coverageVersion={coverageVersion}
          asOfDate="2026-01-10"
        />
      )}
    </div>
  )
}
