// ─── Audit Trail Page ────────────────────────────────────────────────────────
// Immutable timeline and log of all policy, vehicle, coverage, and claim lifecycle events.
// Styled with a clean white editorial header, refined category filters, and high-contrast event rows.

import { useState } from 'react'
import {
  Filter,
  Shield,
  Car,
  Layers,
  FileText,
  ChevronDown,
  ChevronRight,
  Code,
} from 'lucide-react'
import type { DemoState, AuditEventCategory } from '../types/domain'

interface AuditTrailPageProps {
  state: DemoState
}

export function AuditTrailPage({ state }: AuditTrailPageProps) {
  const [filter, setFilter] = useState<AuditEventCategory | 'all'>('all')
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null)

  const filteredEvents = state.auditEvents
    .filter((e) => (filter === 'all' ? true : e.category === filter))
    .slice()
    .reverse() // Most recent first for audit log

  const categoryCounts = {
    all: state.auditEvents.length,
    policy: state.auditEvents.filter((e) => e.category === 'policy').length,
    vehicle: state.auditEvents.filter((e) => e.category === 'vehicle').length,
    coverage: state.auditEvents.filter((e) => e.category === 'coverage').length,
    claim: state.auditEvents.filter((e) => e.category === 'claim').length,
  }

  const getCategoryBadge = (category: AuditEventCategory) => {
    switch (category) {
      case 'policy':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
            <Shield size={10} className="text-blue-600" /> Policy
          </span>
        )
      case 'vehicle':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-900">
            <Car size={10} className="text-[#00c2cb]" /> Vehicle
          </span>
        )
      case 'coverage':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            <Layers size={10} className="text-emerald-600" /> Coverage
          </span>
        )
      case 'claim':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
            <FileText size={10} className="text-purple-600" /> Claim
          </span>
        )
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedEventId(expandedEventId === id ? null : id)
  }

  return (
    <div className="space-y-8">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#00c2cb] mb-1">
            COMPLIANCE & VERIFICATION LOG
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0a1128]">
            System Audit Trail
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Immutable append-only ledger tracking all mutations, lookups, and claim links.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Logged Events: <span className="font-mono text-[#0a1128] font-bold text-sm">{state.auditEvents.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Filter size={13} className="text-slate-400" /> Filter:
        </span>
        {(['all', 'policy', 'vehicle', 'coverage', 'claim'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all capitalize cursor-pointer shadow-xs ${
              filter === cat
                ? 'bg-[#0a1128] text-white'
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat} ({categoryCounts[cat]})
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const isExpanded = expandedEventId === event.id
            return (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
              >
                <div
                  onClick={() => toggleExpand(event.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-[#0a1128] cursor-pointer"
                      aria-label="Expand event details"
                    >
                      {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-extrabold text-[#0a1128]">
                          {event.human_label}
                        </span>
                        <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                          {event.event_type}
                        </code>
                        {getCategoryBadge(event.category)}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        {new Date(event.event_timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-bold text-slate-400">ID #{event.id}</span>
                  </div>
                </div>

                {/* Expanded Metadata JSON Viewer */}
                {isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Code size={13} />
                      Event Payload Metadata (JSON)
                    </div>
                    <pre className="rounded-xl bg-[#0a1128] p-4 text-xs font-mono text-[#00c2cb] overflow-x-auto shadow-inner">
                      {JSON.stringify(event.metadata_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No audit events found for category "{filter}".
          </div>
        )}
      </div>
    </div>
  )
}
