// ─── Reset Confirmation Modal ────────────────────────────────────────────────
// Protects against accidental demo reset and provides a clean restart
// for repeatable interviewer demonstrations.

import { Modal } from './Modal'
import { RotateCcw, AlertCircle } from 'lucide-react'

interface ResetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ResetConfirmModal({ isOpen, onClose, onConfirm }: ResetConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Demonstration State?" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold text-amber-900">Restore Canonical Baseline</strong>
            <p className="text-amber-800 leading-relaxed">
              This resets synthetic demo data only.
            </p>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Returns policy, BMW X3 vehicle state, coverage records, and audit events to the canonical baseline.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Are you sure you want to restart the walkthrough from the initial state?
        </p>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a1128] hover:bg-[#1a2952] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} className="text-[#00c2cb]" />
            Confirm Reset
          </button>
        </div>
      </div>
    </Modal>
  )
}
