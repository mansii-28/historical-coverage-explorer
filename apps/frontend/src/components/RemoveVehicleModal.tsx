// ─── Remove Vehicle Modal ─────────────────────────────────────────────────────
// Handles soft removal of a vehicle with an effective date.
// Educates user that historical coverage records remain preserved for past claims.

import React, { useState } from 'react'
import { Modal } from './Modal'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import type { Vehicle } from '../types/domain'

interface RemoveVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle
  onConfirm: (effectiveDate: string) => Promise<void>
  isLoading?: boolean
}

export function RemoveVehicleModal({
  isOpen,
  onClose,
  vehicle,
  onConfirm,
  isLoading = false,
}: RemoveVehicleModalProps) {
  const [effectiveDate, setEffectiveDate] = useState('2026-01-15')
  const [acknowledged, setAcknowledged] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acknowledged || isLoading) return
    await onConfirm(effectiveDate)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Remove ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Highlighted Product Note Callout */}
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#00c2cb] shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-slate-800">
              <p className="font-bold text-[#0a1128]">
                Historical coverage records will be preserved.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Removing this vehicle ceases active protection moving forward, but retains all historical effective-dated records. Future claims for incidents prior to this effective date will resolve without issue.
              </p>
            </div>
          </div>
        </div>

        {/* Effective Removal Date Input */}
        <div>
          <label
            htmlFor="effective-removal-date"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Effective Removal Date
          </label>
          <div className="relative">
            <input
              id="effective-removal-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0a1128] font-medium shadow-xs focus:border-[#00c2cb] focus:outline-none focus:ring-2 focus:ring-[#00c2cb]/20"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Canonical scenario date: <strong className="text-slate-800 font-semibold">January 15, 2026</strong>
          </p>
        </div>

        {/* Impact Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs space-y-1.5 text-slate-700">
          <div className="font-bold text-[#0a1128]">Expected Lifecycle Updates:</div>
          <ul className="space-y-1 text-slate-600 list-disc list-inside">
            <li>Vehicle status transitions to <span className="font-semibold text-amber-700">Historical</span></li>
            <li>Coverage end date closed at <span className="font-semibold text-slate-900">{effectiveDate}</span></li>
            <li>Appends immutable events to compliance audit log</li>
          </ul>
        </div>

        {/* Required Acknowledgment Checkbox */}
        <div className="flex items-start gap-3 pt-1">
          <input
            id="ack-checkbox"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#00c2cb] focus:ring-[#00c2cb] cursor-pointer"
          />
          <label htmlFor="ack-checkbox" className="text-xs text-slate-700 select-none cursor-pointer leading-normal">
            I understand historical records will remain available for retrospective coverage lookups and claims.
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!acknowledged || isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00c2cb] hover:bg-[#0891b2] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-[#0a1128] transition-all shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0a1128] border-t-transparent" />
                Processing…
              </span>
            ) : (
              <>
                Confirm Removal
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
