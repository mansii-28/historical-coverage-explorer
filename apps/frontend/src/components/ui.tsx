// ─── Shared UI Components ─────────────────────────────────────────────────────
// Clean geometric design system: restrained editorial typography,
// flat saturated color fields, minimal borders, and high contrast.

import React from 'react'
import { CheckCircle, Clock, AlertTriangle, XCircle, Info } from 'lucide-react'

// ─── Multicolor Signature Bar Component ───────────────────────────────────────
export function MulticolorBar({ className = '' }: { className?: string }) {
  return (
    <div className={`tint-multicolor-bar ${className}`} role="presentation">
      <span className="tint-bar-cyan" />
      <span className="tint-bar-mint" />
      <span className="tint-bar-orange" />
      <span className="tint-bar-pink" />
      <span className="tint-bar-purple" />
      <span className="tint-bar-cobalt" />
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'active' | 'historical' | 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'cyan'

interface BadgeProps {
  variant: BadgeVariant
  label: string
  icon?: React.ReactNode
  className?: string
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  active: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
  historical: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  error: 'bg-rose-50 text-rose-800 border border-rose-200/80',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  info: 'bg-sky-50 text-sky-800 border border-sky-200/80',
  cyan: 'bg-cyan-50 text-cyan-900 border border-cyan-200/80',
}

export function Badge({ variant, label, icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${BADGE_STYLES[variant]} ${className}`}
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
  topRuleColor?: 'cyan' | 'cobalt' | 'mint' | 'orange' | 'purple' | 'pink' | 'none'
}

export function Card({ children, className = '', id, topRuleColor = 'none' }: CardProps) {
  const topRuleClasses = {
    cyan: 'border-t-4 border-t-[#00c2cb]',
    cobalt: 'border-t-4 border-t-[#1e40af]',
    mint: 'border-t-4 border-t-[#10b981]',
    orange: 'border-t-4 border-t-[#f97316]',
    purple: 'border-t-4 border-t-[#7c3aed]',
    pink: 'border-t-4 border-t-[#ec4899]',
    none: '',
  }

  return (
    <div
      id={id}
      className={`rounded-xl border border-slate-200 bg-white shadow-xs text-slate-900 ${topRuleClasses[topRuleColor]} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-b border-slate-100 px-6 py-4.5 ${className}`}>{children}</div>
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
  accentColor?: string
}

export function StatCard({ icon, label, value, subtext, id, accentColor = 'bg-slate-100 text-slate-700' }: StatCardProps) {
  return (
    <div id={id} className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentColor}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-[#0a1128]">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  eyebrow?: string
}

export function SectionHeader({ title, subtitle, actions, eyebrow }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb] mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#0a1128]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}

// ─── Loading States ───────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-[#00c2cb]"
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
    <div className="flex h-56 items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={32} />
        <p className="text-sm font-medium text-slate-500">Loading system state…</p>
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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
        {icon}
      </div>
      <p className="text-base font-bold text-[#0a1128]">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4.5 text-center" role="alert">
      <div className="flex items-center justify-center gap-2.5 text-rose-800">
        <XCircle size={18} className="text-rose-600" />
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  )
}

// ─── Info Banners ─────────────────────────────────────────────────────────────

export function InfoBanner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sky-950 ${className}`}>
      <Info size={17} className="mt-0.5 shrink-0 text-sky-600" />
      <div className="text-xs leading-relaxed text-sky-900">{children}</div>
    </div>
  )
}

export function WarningBanner({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950 ${className}`}>
      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="text-xs leading-relaxed text-amber-900">{children}</div>
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
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-semibold text-[#0a1128] ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[#00c2cb] hover:bg-[#0891b2] text-[#0a1128] font-bold shadow-xs border border-transparent disabled:opacity-50',
  secondary: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-xs disabled:opacity-50',
  dark: 'bg-[#0a1128] hover:bg-[#1a2952] text-white font-semibold shadow-xs border border-transparent disabled:opacity-50',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-50',
  ghost: 'text-slate-600 hover:text-[#0a1128] hover:bg-slate-100 font-semibold disabled:opacity-50',
}

const BUTTON_SIZES: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-xs rounded-lg',
  lg: 'px-5 py-2.5 text-sm rounded-lg',
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
      className={`inline-flex items-center justify-center gap-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00c2cb] cursor-pointer ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size={14} /> : icon}
      {children}
    </button>
  )
}
