// ─── Remove Vehicle Modal ─────────────────────────────────────────────────────
// Handles soft removal of a vehicle with an effective date.
// Educates user that historical coverage records remain preserved for past claims.

import React, { useState } from 'react'
import { Modal } from './Modal'
import { ShieldAlert, ArrowRight } from 'lucide-react'
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
        {/* Key Product Principle Callout */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-slate-300">
              <p className="font-medium text-indigo-200">
                Removing this vehicle stops future active coverage but preserves historical policy and coverage records.
              </p>
              <p className="text-slate-400">
                This prototype uses <strong className="text-slate-200">soft removal</strong> rather than destructive deletion. Claims filed later for incidents that occurred prior to this date will still match coverage.
              </p>
            </div>
          </div>
        </div>

        {/* Effective Removal Date Input */}
        <div>
          <label
            htmlFor="effective-removal-date"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Canonical scenario date: <span className="text-indigo-300 font-medium">January 15, 2026</span>
          </p>
        </div>

        {/* Impact Summary */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 text-xs space-y-2">
          <div className="font-semibold text-slate-300">Expected Lifecycle Updates:</div>
          <ul className="space-y-1 text-slate-400 list-disc list-inside">
            <li>Vehicle status changes to <span className="text-amber-400 font-medium">Historical</span></li>
            <li>Active coverage version end date capped at <span className="text-slate-200">{effectiveDate}</span></li>
            <li>Vehicle transitions from Active Vehicles to Past Vehicles</li>
            <li>New audit events appended to immutable system log</li>
          </ul>
        </div>

        {/* Required Acknowledgment Checkbox */}
        <div className="flex items-start gap-3 pt-1">
          <input
            id="ack-checkbox"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <label htmlFor="ack-checkbox" className="text-xs text-slate-300 select-none cursor-pointer">
            I understand historical records will remain available for retrospective coverage lookups and claims.
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!acknowledged || isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
