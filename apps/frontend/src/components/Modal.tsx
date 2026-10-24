// ─── Modal ────────────────────────────────────────────────────────────────────
// Accessible modal dialog with clean editorial design and keyboard support (Escape to close).

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  id?: string
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
  size,
  id,
}: ModalProps) {
  const isVisible = open ?? isOpen ?? false
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const resolvedMaxWidth = maxWidth ?? (size ? SIZE_MAP[size] : 'max-w-md')

  // Close on Escape
  useEffect(() => {
    if (!isVisible) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  // Trap focus when open and focus the dialog
  useEffect(() => {
    if (isVisible && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [isVisible])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1128]/70 backdrop-blur-xs"
      role="presentation"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        ref={dialogRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`w-full ${resolvedMaxWidth} rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-2xl focus:outline-none animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden`}
      >
        {/* Subtle top cyan rule */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#00c2cb]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 id="modal-title" className="text-lg font-bold tracking-tight text-[#0a1128]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0a1128] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="pt-5 text-slate-700">{children}</div>
      </div>
    </div>
  )
}
