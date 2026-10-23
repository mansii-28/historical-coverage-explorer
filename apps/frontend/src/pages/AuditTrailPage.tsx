// ─── Audit Trail Page ────────────────────────────────────────────────────────
// Immutable timeline and log of all policy, vehicle, coverage, and claim lifecycle events.

import { useState } from 'react'
import {
  History,
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
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-400 ring-1 ring-blue-500/30">
            <Shield size={10} /> Policy
          </span>
        )
      case 'vehicle':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
            <Car size={10} /> Vehicle
          </span>
        )
      case 'coverage':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-teal-500/15 px-2 py-0.5 text-[11px] font-semibold text-teal-400 ring-1 ring-teal-500/30">
            <Layers size={10} /> Coverage
          </span>
        )
      case 'claim':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 px-2 py-0.5 text-[11px] font-semibold text-purple-400 ring-1 ring-purple-500/30">
            <FileText size={10} /> Claim
          </span>
        )
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedEventId(expandedEventId === id ? null : id)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Compliance & Verification Log
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              System Audit Trail
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Immutable append-only ledger tracking all mutations, lookups, and claim links.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Total Logged Events: <span className="font-mono text-white font-bold">{state.auditEvents.length}</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-2">
            <Filter size={12} /> Filter:
          </span>
          {(['all', 'policy', 'vehicle', 'coverage', 'claim'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all capitalize ${
                filter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const isExpanded = expandedEventId === event.id
            return (
              <div
                key={event.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-slate-700"
              >
                <div
                  onClick={() => toggleExpand(event.id)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-200"
                      aria-label="Expand event details"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {event.human_label}
                        </span>
                        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">
                          {event.event_type}
                        </code>
                        {getCategoryBadge(event.category)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(event.event_timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] font-mono text-slate-400">ID #{event.id}</span>
                  </div>
                </div>

                {/* Expanded Metadata JSON Viewer */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <Code size={12} />
                      Event Payload Metadata (JSON)
                    </div>
                    <pre className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
                      {JSON.stringify(event.metadata_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
            No audit events found for category "{filter}".
          </div>
        )}
      </div>
    </div>
  )
}
