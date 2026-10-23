// ─── Shared UI Components ─────────────────────────────────────────────────────
// Reusable building blocks for the Historical Coverage Explorer UI.

import React from 'react'
import { CheckCircle, Clock, AlertTriangle, XCircle, Info } from 'lucide-react'

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'active' | 'historical' | 'success' | 'warning' | 'error' | 'neutral' | 'info'

interface BadgeProps {
  variant: BadgeVariant
  label: string
  icon?: React.ReactNode
  className?: string
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  historical: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  error: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  neutral: 'bg-slate-700/50 text-slate-400 ring-1 ring-slate-600/50',
  info: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
}

export function Badge({ variant, label, icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[variant]} ${className}`}
      aria-label={label}
    >
      {icon}
      {label}
    </span>
  )
}

export function ActiveBadge() {
  return <Badge variant="active" label="Active" icon={<CheckCircle size={11} />} />
}

export function HistoricalBadge() {
  return <Badge variant="historical" label="Historical" icon={<Clock size={11} />} />
}

export function CoverageFoundBadge() {
  return <Badge variant="success" label="Coverage Found" icon={<CheckCircle size={11} />} />
}

export function ManualReviewBadge() {
  return <Badge variant="warning" label="Requires Manual Review" icon={<AlertTriangle size={11} />} />
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function Card({ children, className = '', id }: CardProps) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-b border-slate-800 px-6 py-4 ${className}`}>{children}</div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  variant?: BadgeVariant
  id?: string
}

export function StatCard({ icon, label, value, subtext, id }: StatCardProps) {
  return (
    <Card id={id} className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-400">{label}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </Card>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Loading States ───────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-indigo-400"
      style={{ width: size, height: size }}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function PageLoading() {
  return (
    <div className="flex h-48 items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={28} />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-600">{description}</p>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center" role="alert">
      <div className="flex items-center justify-center gap-2 text-red-400">
        <XCircle size={16} />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

// ─── Info Banner ──────────────────────────────────────────────────────────────

export function InfoBanner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 ${className}`}>
      <Info size={16} className="mt-0.5 shrink-0 text-blue-400" />
      <div className="text-sm text-blue-300">{children}</div>
    </div>
  )
}

export function WarningBanner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 ${className}`}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
      <div className="text-sm text-amber-300">{children}</div>
    </div>
  )
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

export function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50',
  secondary: 'border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50',
  danger: 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50',
  ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50',
}

const BUTTON_SIZES: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size={14} /> : icon}
      {children}
    </button>
  )
}
