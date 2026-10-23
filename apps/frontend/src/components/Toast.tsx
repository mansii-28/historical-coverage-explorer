// ─── Toast Notification ───────────────────────────────────────────────────────
// A lightweight, self-dismissing toast for user feedback.

import React, { useEffect, useState } from 'react'
import { CheckCircle, X, AlertTriangle, Info } from 'lucide-react'

export type ToastType = 'success' | 'warning' | 'info' | 'error'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const TOAST_STYLES: Record<ToastType, { container: string; icon: React.ReactNode }> = {
  success: {
    container: 'border-emerald-500/30 bg-slate-900',
    icon: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  },
  warning: {
    container: 'border-amber-500/30 bg-slate-900',
    icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
  },
  info: {
    container: 'border-blue-500/30 bg-slate-900',
    icon: <Info size={16} className="text-blue-400 shrink-0" />,
  },
  error: {
    container: 'border-red-500/30 bg-slate-900',
    icon: <AlertTriangle size={16} className="text-red-400 shrink-0" />,
  },
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10)
    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, 4000)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [toast.id, onDismiss])

  const style = TOAST_STYLES[toast.type]

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex w-80 items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 ${style.container} ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {style.icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs text-slate-400">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-500 hover:text-slate-300"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
