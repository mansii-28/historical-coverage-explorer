// ─── Architecture & About Page ────────────────────────────────────────────────
// Visual overview of system architecture, temporal data model, and foundational product decisions.
// Dark navy section rhythm inspired by Tint's platform architecture visual language.

import {
  Server,
  ShieldCheck,
  Clock,
  Sparkles,
  GitBranch,
  Cpu,
  Lock,
  Database,
  Code2,
  FileCheck,
} from 'lucide-react'

export function ArchitecturePage() {
  return (
    <div className="space-y-12">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb] mb-1">
          SYSTEM DESIGN & STRATEGY
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1128]">
          Architecture & Product Decisions
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-3xl">
          Visualizing the target 3-tier architecture, deterministic temporal evaluation, and architectural safeguards designed for insurance compliance.
        </p>
      </div>

      {/* ─── Dark Navy Architecture Feature Section ───────────────────────────── */}
      <div className="rounded-2xl bg-[#0a1128] text-white p-8 sm:p-10 lg:p-12 shadow-xl space-y-10 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#1e40af]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb]">
            PLATFORM ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            A small system built around historical truth.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Designed for auditability, point-in-time correctness, and immutable claim evidence. Every layer guarantees that past coverage cannot be accidentally mutated by current operational actions.
          </p>
        </div>

        {/* ─── 6 Architecture Cards (Cobalt Cards with White Typography) ──────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {/* Card 1: React */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d] p-5 space-y-2 border-t-2 border-t-[#00c2cb]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00c2cb]">Frontend</span>
              <Code2 size={16} className="text-[#00c2cb]" />
            </div>
            <h3 className="text-lg font-bold text-white">React 19 + TypeScript</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Same-origin client using relative <code className="text-[#00c2cb] font-mono">/api</code> calls. State updates are backed by point-in-time timeline components.
            </p>
          </div>

          {/* Card 2: FastAPI */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d] p-5 space-y-2 border-t-2 border-t-[#10b981]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#10b981]">Application API</span>
              <Server size={16} className="text-[#10b981]" />
            </div>
            <h3 className="text-lg font-bold text-white">FastAPI (Python 3.12)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              High-performance asynchronous REST endpoints with Pydantic contract validation and ReportLab PDF document rendering.
            </p>
          </div>

          {/* Card 3: PostgreSQL */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d] p-5 space-y-2 border-t-2 border-t-[#1e40af]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Persistence</span>
              <Database size={16} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Neon PostgreSQL</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Serverless PostgreSQL with connection pooling multiplexed via external pgBouncer and SQLAlchemy NullPool.
            </p>
          </div>

          {/* Card 4: Coverage Service */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d] p-5 space-y-2 border-t-2 border-t-[#f97316]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f97316]">Domain Service</span>
              <Clock size={16} className="text-[#f97316]" />
            </div>
            <h3 className="text-lg font-bold text-white">Coverage Service</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pure temporal interval arithmetic evaluating <code className="text-[#00c2cb] font-mono">valid_from &le; loss &lt; valid_to</code> against indexed records.
            </p>
          </div>

          {/* Card 5: Claim Service */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d] p-5 space-y-2 border-t-2 border-t-[#ec4899]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ec4899]">Domain Service</span>
              <FileCheck size={16} className="text-[#ec4899]" />
            </div>
            <h3 className="text-lg font-bold text-white">Claim Service</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Locks claims to the resolved <code className="text-[#ec4899] font-mono">coverage_version_id</code>, freezing terms permanently upon submission.
            </p>
          </div>

          {/* Card 6: Audit Events */}
          <div className="rounded-xl border border-slate-800 bg-[#101c3d] p-5 space-y-2 border-t-2 border-t-[#7c3aed]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed]">Compliance</span>
              <ShieldCheck size={16} className="text-[#7c3aed]" />
            </div>
            <h3 className="text-lg font-bold text-white">Audit Events</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Immutable append-only ledger capturing all state transitions, vehicle removals, and coverage queries with request correlation IDs.
            </p>
          </div>
        </div>

        {/* ─── Visual System Flows ────────────────────────────────────────────── */}
        <div className="border-t border-slate-800/80 pt-8 space-y-8 relative z-10">
          {/* Flow 1: Core System Flow */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Application Request Flow
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-[#00c2cb]">
                React SPA
              </div>
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-white">
                &rarr; FastAPI API
              </div>
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-white">
                &rarr; Domain Services
              </div>
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-blue-300">
                &rarr; PostgreSQL
              </div>
            </div>
          </div>

          {/* Flow 2: Temporal Evidence Resolution Flow */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Point-in-Time Evidence Pinning Flow
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-amber-400">
                1. Date of Loss Input
              </div>
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-[#00c2cb]">
                &rarr; 2. Match Coverage Version
              </div>
              <div className="rounded-lg bg-[#101c3d] border border-slate-700 py-3 px-2 text-emerald-400">
                &rarr; 3. Pin Version to Claim
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6 Foundational Product Decisions ─────────────────────────────────── */}
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb] mb-1">
            CORE PRINCIPLES
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0a1128]">
            Six Foundational Product Decisions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Decision 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 border-t-4 border-t-[#00c2cb]">
            <div className="flex items-center gap-2 text-[#00c2cb]">
              <Clock size={16} />
              <h3 className="text-sm font-bold text-[#0a1128]">1. Effective-Dated History</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Coverage versions use half-open intervals (<code className="font-mono text-[#0a1128] font-bold">valid_from &le; t &lt; valid_to</code>). Historical states are never overwritten, allowing exact retrospective reconstruction.
            </p>
          </div>

          {/* Decision 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 border-t-4 border-t-[#10b981]">
            <div className="flex items-center gap-2 text-[#10b981]">
              <ShieldCheck size={16} />
              <h3 className="text-sm font-bold text-[#0a1128]">2. Soft Removal (Never Delete)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Removing a vehicle sets an end timestamp and flips an active flag. The record remains intact forever, preventing legitimate claims from being orphaned.
            </p>
          </div>

          {/* Decision 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 border-t-4 border-t-[#1e40af]">
            <div className="flex items-center gap-2 text-[#1e40af]">
              <Lock size={16} />
              <h3 className="text-sm font-bold text-[#0a1128]">3. Claim Coverage Pinning</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a claim is created, it freezes the matched <code className="font-mono text-[#1e40af] font-bold">coverage_version_id</code>. Future policy modifications never retroactively alter existing claims.
            </p>
          </div>

          {/* Decision 4 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 border-t-4 border-t-[#f97316]">
            <div className="flex items-center gap-2 text-[#f97316]">
              <Cpu size={16} />
              <h3 className="text-sm font-bold text-[#0a1128]">4. Deterministic Lookup</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Point-in-time checks use pure date arithmetic against coverage records. Queries yield 100% reproducible, verifiable outcomes across system boundaries.
            </p>
          </div>

          {/* Decision 5 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 border-t-4 border-t-[#ec4899]">
            <div className="flex items-center gap-2 text-[#ec4899]">
              <GitBranch size={16} />
              <h3 className="text-sm font-bold text-[#0a1128]">5. Manual Review Safeguard</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If automated lookup finds no active coverage on the date of loss, the claim is routed to manual human review. The system never performs automated rejection.
            </p>
          </div>

          {/* Decision 6 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 border-t-4 border-t-[#7c3aed]">
            <div className="flex items-center gap-2 text-[#7c3aed]">
              <Sparkles size={16} />
              <h3 className="text-sm font-bold text-[#0a1128]">6. No AI Adjudication</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Insurance entitlement is a legal and regulatory determination. AI is excluded from the coverage verification path to ensure total auditability and zero hallucination.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
