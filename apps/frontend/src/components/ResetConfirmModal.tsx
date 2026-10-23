// ─── Reset Confirmation Modal ────────────────────────────────────────────────
// Protects against accidental demo reset and provides a clean restart
// for repeatable interviewer demonstrations.

import { Modal } from './Modal'
import { RotateCcw, AlertTriangle } from 'lucide-react'

interface ResetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ResetConfirmModal({ isOpen, onClose, onConfirm }: ResetConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Demonstration State?" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="block font-semibold">Restore Initial Canonical Baseline</strong>
            This will return all vehicles, coverage versions, claims, and audit logs to the baseline state (BMW X3 active, no claims filed).
          </div>
        </div>

        <p className="text-xs text-slate-300">
          Are you sure you want to restart the interactive walkthrough?
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <RotateCcw size={13} />
            Confirm Reset
          </button>
        </div>
      </div>
    </Modal>
  )
}
