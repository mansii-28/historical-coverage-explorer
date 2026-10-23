// ─── Architecture & About Page ────────────────────────────────────────────────
// Visual overview of the system architecture, implementation phases,
// and key product design decisions.

import {
  Layers,
  Server,
  ArrowDown,
  ShieldCheck,
  Clock,
  Sparkles,
  GitBranch,
  Cpu,
  Lock,
} from 'lucide-react'

export function ArchitecturePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            System Design & Strategy
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Architecture & Product Decisions
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Visualizing the target 3-tier architecture, Phase 2 mock abstraction, and architectural
          safeguards designed for insurance compliance.
        </p>
      </div>

      {/* Visual 3-Tier Pipeline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="h-4 w-4 text-indigo-400" />
          Target System Pipeline
        </h2>

        <div className="max-w-xl mx-auto space-y-3 text-center">
          {/* Tier 1: Frontend */}
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-300">Tier 1: Web Interface</span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                Phase 2 Complete
              </span>
            </div>
            <div className="text-sm font-semibold text-white">React 19 + TypeScript + Tailwind CSS</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Interactive timeline, claim verification workflow, and service-layer mock abstraction.
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown size={20} />
          </div>

          {/* Tier 2: FastAPI */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400">Tier 2: Application API</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                Phase 1 Scaffolding &rarr; Phase 3 Backend
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200">FastAPI REST API (Python 3.12)</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Point-in-time SQL evaluations, PDF document rendering, and idempotency protection.
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown size={20} />
          </div>

          {/* Tier 3: PostgreSQL */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400">Tier 3: Persistence Store</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                Phase 1 Ready &rarr; Phase 3 Domain Models
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200">PostgreSQL 14+ (Temporal Schema)</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Effective-dated tables (valid_from/valid_to), soft-deletion flags, and immutable audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* 6 Core Product Decisions */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Six Foundational Product Decisions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Decision 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Clock size={16} />
              <h3 className="text-sm font-bold text-white">1. Effective-Dated History</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coverage versions use half-open intervals (<code className="text-indigo-300">valid_from &le; t &lt; valid_to</code>). Historical states are never overwritten, allowing exact retrospective reconstruction.
            </p>
          </div>

          {/* Decision 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck size={16} />
              <h3 className="text-sm font-bold text-white">2. Soft Removal (Never Delete)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Removing a vehicle sets an end timestamp and flips an active flag. The record remains intact forever, preventing legitimate claims from being orphaned.
            </p>
          </div>

          {/* Decision 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-teal-400">
              <Lock size={16} />
              <h3 className="text-sm font-bold text-white">3. Claim Coverage Pinning</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a claim is created, it freezes the matched <code className="text-teal-300">coverage_version_id</code>. Future policy modifications never retroactively alter existing claims.
            </p>
          </div>

          {/* Decision 4 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu size={16} />
              <h3 className="text-sm font-bold text-white">4. Deterministic Lookup</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Point-in-time checks use pure date arithmetic against coverage records. Queries yield 100% reproducible, verifiable outcomes across system boundaries.
            </p>
          </div>

          {/* Decision 5 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <GitBranch size={16} />
              <h3 className="text-sm font-bold text-white">5. Manual Review Safeguard</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If automated lookup finds no active coverage on the date of loss, the claim is routed to manual human review. The system never performs automated rejection.
            </p>
          </div>

          {/* Decision 6 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles size={16} />
              <h3 className="text-sm font-bold text-white">6. No AI Adjudication</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Insurance entitlement is a legal and regulatory determination. AI is excluded from the coverage verification path to ensure total auditability and zero hallucination.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
