// ─── Policy Dashboard Page ───────────────────────────────────────────────────
// Manages policy view, active vehicles, soft removal workflow, and past vehicles.

import React, { useState } from 'react'
import {
  Car,
  Trash2,
  Clock,
  FileText,
  FileCheck,
  CheckCircle,
  Info,
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
      {/* Policy Header Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Personal Auto Policy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                <CheckCircle size={11} />
                {state.policy.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              {state.policy.policy_number}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Named Insured: <strong className="text-slate-200">{state.policy.customer_name}</strong> • Effective since Jan 1, 2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('coverage')}
              className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              View Full Coverage Terms
            </button>
          </div>
        </div>
      </div>

      {/* Active Vehicles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Active Vehicles ({activeVehicles.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Currently insured on active policy</span>
        </div>

        {activeVehicles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-all hover:border-slate-700"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                        <CheckCircle size={11} />
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 pt-1">
                      <div>
                        <span className="block text-slate-400">Masked VIN</span>
                        <span className="font-mono text-slate-200">••••-001</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Coverage</span>
                        <span className="font-medium text-slate-200">
                          {coverageVersion?.coverage_type ?? 'Comprehensive'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Effective Interval</span>
                        <span className="font-medium text-emerald-400">
                          Jan 1, 2026 → Present
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Limits & Deductible</span>
                        <span className="text-slate-200 font-mono">
                          $100,000 / $500 ded.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 md:pt-0">
                    <button
                      onClick={() => onNavigate('coverage')}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors"
                    >
                      View Coverage
                    </button>
                    <button
                      onClick={() => setSelectedVehicleForRemoval(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={13} />
                      Remove Vehicle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
            <Car className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No Active Vehicles</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All vehicles on this policy have been removed or archived. Historical coverage and vehicle records are preserved below.
            </p>
          </div>
        )}
      </div>

      {/* Past / Historical Vehicles Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Past Vehicles ({pastVehicles.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Historical records preserved for retrospective lookups</span>
        </div>

        {pastVehicles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {pastVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-xl border border-amber-500/20 bg-slate-900/70 p-5 relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-200">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                        <Clock size={11} />
                        Historical
                      </span>
                      <span className="text-xs text-slate-400">
                        Removed: <span className="text-amber-300 font-medium">Jan 15, 2026</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 pt-1">
                      <div>
                        <span className="block text-slate-400">Masked VIN</span>
                        <span className="font-mono text-slate-300">••••-001</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Historical Coverage</span>
                        <span className="font-medium text-slate-300">Comprehensive</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Covered Period</span>
                        <span className="font-medium text-emerald-400">
                          Jan 1, 2026 → Jan 15, 2026
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Preserved Terms</span>
                        <span className="text-slate-300 font-mono">$100,000 / $500 ded.</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2 text-[11px] text-indigo-300">
                      <Info size={12} />
                      <span>
                        Soft-removed record. Claims with date of loss on or before Jan 15, 2026 remain covered.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                    <button
                      onClick={() => onNavigate('coverage')}
                      className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      View Coverage History
                    </button>
                    <button
                      onClick={() => setProofVehicle(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 px-3 py-2 text-xs font-semibold text-indigo-300 transition-colors"
                    >
                      <FileCheck size={13} />
                      View Proof of Insurance
                    </button>
                    <button
                      onClick={() => onNavigate('claim')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                    >
                      <FileText size={13} />
                      File Historical Claim
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 p-6 text-center text-xs text-slate-400">
            No past vehicles. When an active vehicle is removed, it transitions into this section with full historical coverage preserved.
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

      {/* Proof of Insurance Preview Modal */}
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
