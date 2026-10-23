import { useEffect, useState } from 'react'
import { api, type HealthResponse } from './lib/api'
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  Database,
  FileText,
  History,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'ok' | 'degraded' | 'unknown' }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
        <CheckCircle size={12} />
        Healthy
      </span>
    )
  }
  if (status === 'degraded') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
        <AlertTriangle size={12} />
        Degraded
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-600/50">
      <Clock size={12} />
      Checking…
    </span>
  )
}

// ─── DB Badge ─────────────────────────────────────────────────────────────────
function DbBadge({ status }: { status: 'connected' | 'unavailable' | 'unknown' }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
        <Database size={12} />
        Connected
      </span>
    )
  }
  if (status === 'unavailable') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
        <XCircle size={12} />
        Unavailable
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-600/50">
      <Clock size={12} />
      Checking…
    </span>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  phase: string
  implemented: boolean
}

function FeatureCard({ icon, title, description, phase, implemented }: FeatureCardProps) {
  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur transition-all duration-200 hover:border-indigo-500/40 hover:bg-slate-900/80">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          {icon}
        </div>
        {implemented ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30">
            Phase 1
          </span>
        ) : (
          <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-600/50">
            {phase}
          </span>
        )}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-100">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthStatus, setHealthStatus] = useState<'ok' | 'degraded' | 'unknown'>('unknown')
  const [dbStatus, setDbStatus] = useState<'connected' | 'unavailable' | 'unknown'>('unknown')

  useEffect(() => {
    api
      .health()
      .then((data: HealthResponse) => {
        setHealth(data)
        setHealthStatus(data.status)
        setDbStatus(data.database)
      })
      .catch(() => {
        setHealthStatus('degraded')
        setDbStatus('unavailable')
      })
  }, [])

  const features: FeatureCardProps[] = [
    {
      icon: <Shield size={20} />,
      title: 'Effective-Dated Coverage',
      description:
        'Coverage records carry valid_from / valid_to dates. Historical queries use date-of-loss, not filing date.',
      phase: 'Phase 3',
      implemented: false,
    },
    {
      icon: <Archive size={20} />,
      title: 'Soft Vehicle Removal',
      description:
        'Removing a vehicle from an active policy sets removed_at. Historical records are fully preserved.',
      phase: 'Phase 3',
      implemented: false,
    },
    {
      icon: <History size={20} />,
      title: 'Historical Coverage Lookup',
      description:
        'Query: "What coverage existed on this specific date?" returns a deterministic, auditable result.',
      phase: 'Phase 3',
      implemented: false,
    },
    {
      icon: <FileText size={20} />,
      title: 'Claim Coverage Pinning',
      description:
        'Claims are pinned to the exact coverage version at date-of-loss. Future policy changes cannot silently alter it.',
      phase: 'Phase 3',
      implemented: false,
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Proof of Insurance PDF',
      description:
        'Generate a DEMO ONLY proof-of-insurance document from preserved historical coverage data.',
      phase: 'Phase 3',
      implemented: false,
    },
    {
      icon: <Activity size={20} />,
      title: 'Audit Event Trail',
      description:
        'Every lifecycle action — coverage activated, vehicle removed, claim filed — is durably recorded as an audit event.',
      phase: 'Phase 3',
      implemented: false,
    },
    {
      icon: <Database size={20} />,
      title: 'API Foundation',
      description:
        'FastAPI backend with health check, PostgreSQL, SQLAlchemy 2.x, and Alembic migrations configured.',
      phase: 'Phase 1',
      implemented: true,
    },
    {
      icon: <CheckCircle size={20} />,
      title: 'Manual Review Safety Net',
      description:
        'When automated lookup returns no coverage, claims route to manual review — not automatic rejection.',
      phase: 'Phase 3',
      implemented: false,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <History size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100">Historical Coverage Explorer</span>
              <p className="text-[10px] text-slate-500">Effective-Dated Insurance Coverage Prototype</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={healthStatus} />
            <DbBadge status={dbStatus} />
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* Gradient accent */}
        <div
          className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, #7c3aed 50%, transparent 70%)' }}
        />

        <div className="relative text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-400">
            <Activity size={12} />
            Phase 1 — Foundation Ready
          </div>

          <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-slate-100 sm:text-6xl">
            Historical Coverage{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Explorer
            </span>
          </h1>

          <p className="mx-auto mb-2 max-w-2xl text-lg leading-relaxed text-slate-400">
            An effective-dated insurance coverage prototype demonstrating that{' '}
            <strong className="text-slate-200">
              removing a vehicle from an active policy is not the same as destroying its history.
            </strong>
          </p>

          <p className="mb-12 text-sm text-slate-500">
            Prototype foundation ready · Backend API online · Database configured
          </p>

          {/* Principle callout */}
          <div className="mx-auto mb-16 max-w-3xl rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-8 text-left backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold text-indigo-300">Core Product Principle</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">
                  Active State
                </p>
                <p className="text-sm text-slate-300">
                  What the customer sees in their policy today — their current vehicles and active coverage.
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  Historical State
                </p>
                <p className="text-sm text-slate-300">
                  The durable, immutable record of what coverage existed on any given date — preserved forever.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-900/60 p-4 text-center">
              <p className="text-sm font-medium text-slate-200">
                "What coverage existed for vehicle X on{' '}
                <span className="text-indigo-400">January 10</span>?"
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This question must be answerable even after the vehicle was removed on January 15.
              </p>
            </div>
          </div>
        </div>

        {/* ─── System Status ──────────────────────────────────────────────── */}
        <div className="mb-16 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            System Status
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="mb-2 text-xs text-slate-500">API Service</p>
              <StatusBadge status={healthStatus} />
              {health && (
                <p className="mt-2 text-xs text-slate-500">
                  v{health.version} · {health.service}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="mb-2 text-xs text-slate-500">PostgreSQL Database</p>
              <DbBadge status={dbStatus} />
              {dbStatus === 'unavailable' && (
                <p className="mt-2 text-xs text-slate-500">
                  Run <code className="text-indigo-400">docker compose up postgres</code> to start DB
                </p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="mb-2 text-xs text-slate-500">Current Phase</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                <Activity size={12} />
                Phase 1 — Foundation
              </span>
              <p className="mt-2 text-xs text-slate-500">Full UI arrives in Phase 2</p>
            </div>
          </div>
        </div>

        {/* ─── Features Grid ──────────────────────────────────────────────── */}
        <div className="mb-16">
          <h2 className="mb-6 text-lg font-semibold text-slate-200">Planned Capabilities</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>

        {/* ─── Demo Scenario ──────────────────────────────────────────────── */}
        <div className="mb-16 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Canonical Demo Scenario
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {[
              { date: 'Jan 1', label: 'Coverage begins', color: 'emerald', detail: 'BMW X3 · DEMO-VIN-001' },
              { date: 'Jan 10', label: 'Date of Loss', color: 'red', detail: 'Accident occurs' },
              { date: 'Jan 15', label: 'Vehicle removed', color: 'amber', detail: 'Coverage closed' },
              { date: 'Feb 10', label: 'Claim filed', color: 'indigo', detail: 'Looks up Jan 10 coverage' },
            ].map((event, i) => (
              <div key={event.date} className="flex flex-1 items-start gap-3">
                {i > 0 && (
                  <div className="mt-5 hidden h-px flex-1 bg-gradient-to-r from-slate-700 to-slate-700 sm:block" />
                )}
                <div className="min-w-0 flex-1 sm:flex-none">
                  <div
                    className={`mb-1 inline-block rounded-lg px-3 py-1 text-xs font-bold ${
                      event.color === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : event.color === 'red'
                          ? 'bg-red-500/20 text-red-400'
                          : event.color === 'amber'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {event.date}
                  </div>
                  <p className="text-sm font-medium text-slate-200">{event.label}</p>
                  <p className="text-xs text-slate-500">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-indigo-500/10 p-4 ring-1 ring-indigo-500/20">
            <p className="text-sm text-indigo-300">
              <strong>Expected result:</strong> Historical coverage is found for January 10, even though the vehicle
              was removed on January 15 and the claim was filed on February 10. Coverage is evaluated using the{' '}
              <strong>date of loss</strong>, not the claim filing date.
            </p>
          </div>
        </div>

        {/* ─── Disclaimer ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-center">
          <p className="text-xs text-slate-500">
            ⚠️ Concept prototype built as a product and engineering thought exercise. Uses synthetic data only
            and does not represent any company's production architecture.
          </p>
        </div>
      </main>
    </div>
  )
}
