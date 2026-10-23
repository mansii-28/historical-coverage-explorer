// ─── Main Application Component ──────────────────────────────────────────────
// Historical Coverage Explorer — Phase 2 Frontend Product Experience

import React, { useState } from 'react'
import {
  Shield,
  Car,
  FileText,
  Layers,
  History,
  Server,
  RotateCcw,
  Menu,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { DemoProvider } from './context/DemoContext'
import { useDemoContext } from './context/useDemoContext'
import { ToastContainer, type ToastType } from './components/Toast'
import { useToast } from './components/useToast'
import { ResetConfirmModal } from './components/ResetConfirmModal'
import { OverviewPage } from './pages/OverviewPage'
import { PolicyPage } from './pages/PolicyPage'
import { FileClaimPage } from './pages/FileClaimPage'
import { CoverageHistoryPage } from './pages/CoverageHistoryPage'
import { AuditTrailPage } from './pages/AuditTrailPage'
import { ArchitecturePage } from './pages/ArchitecturePage'
import { USE_MOCK } from './services/apiClient'

type TabKey = 'overview' | 'policy' | 'claim' | 'coverage' | 'audit' | 'architecture'

interface NavItem {
  key: TabKey
  label: string
  icon: React.ReactNode
  badge?: string
}

function MainApp() {
  const { state, setState, resetDemo, isLoading, error, reloadState } = useDemoContext()
  const { toasts, addToast, dismissToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const showToast = (
    title: string,
    message: string,
    variant: 'success' | 'warning' | 'error' | 'info',
  ) => {
    addToast(variant as ToastType, title, message)
  }

  const handleResetConfirm = async () => {
    try {
      await resetDemo()
      showToast('Demo State Reset', 'Restored to canonical baseline: BMW X3 active, zero claims.', 'info')
    } catch {
      showToast('Reset Failed', 'Failed to reset demo state against backend.', 'error')
    }
  }

  const activeVehiclesCount = state.vehicles.filter((v) => v.is_active).length
  const pastVehiclesCount = state.vehicles.filter((v) => !v.is_active).length

  const navItems: NavItem[] = [
    {
      key: 'overview',
      label: 'Overview & Lifecycle',
      icon: <Shield size={18} />,
    },
    {
      key: 'policy',
      label: 'Policy & Vehicles',
      icon: <Car size={18} />,
      badge: `${activeVehiclesCount} active`,
    },
    {
      key: 'claim',
      label: 'File Claim',
      icon: <FileText size={18} />,
      badge: state.claims.length > 0 ? `${state.claims.length}` : undefined,
    },
    {
      key: 'coverage',
      label: 'Coverage History',
      icon: <Layers size={18} />,
    },
    {
      key: 'audit',
      label: 'Audit Trail',
      icon: <History size={18} />,
      badge: `${state.auditEvents.length}`,
    },
    {
      key: 'architecture',
      label: 'Architecture & About',
      icon: <Server size={18} />,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* ─── Top Bar ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white p-1"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white block">
                  Historical Coverage Explorer
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  Temporal Record Verification System
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* System Status Pill */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium text-[11px]">
                {USE_MOCK ? 'Mock Services Active' : 'FastAPI + PostgreSQL Live'}
              </span>
            </div>

            {/* Prototype Badge */}
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 ring-1 ring-indigo-500/30">
              Interactive Demo
            </span>

            {/* Reset Demo Button */}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors shadow-sm disabled:opacity-50"
              title="Reset the demo to initial canonical state"
            >
              <RotateCcw size={13} className={`text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backend Connection Error Banner */}
      {error && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2.5 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          {reloadState && (
            <button
              type="button"
              onClick={() => reloadState()}
              className="inline-flex items-center gap-1.5 rounded bg-red-500/25 hover:bg-red-500/40 px-2.5 py-1 text-[11px] font-semibold text-red-200 transition-colors"
            >
              <RefreshCw size={12} />
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* ─── Main Body Container ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex mx-auto w-full max-w-7xl">
        {/* Left Sidebar Navigation */}
        <aside
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 border-r border-slate-800 bg-slate-950 p-4 shrink-0 space-y-6 md:sticky md:top-[57px] md:h-[calc(100vh-57px)] overflow-y-auto`}
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                          isActive
                            ? 'bg-indigo-500/30 text-indigo-200'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Quick Canonical Scenario Widget in Sidebar */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-2 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Demo Context
            </div>
            <div className="text-slate-200 font-semibold">{state.policy.customer_name}</div>
            <div className="font-mono text-[11px] text-slate-400">{state.policy.policy_number}</div>
            <div className="pt-1 text-[11px] text-slate-400 space-y-1">
              <div>
                Vehicle:{' '}
                <span className="text-slate-300">
                  {pastVehiclesCount > 0 ? 'BMW X3 (Past)' : 'BMW X3 (Active)'}
                </span>
              </div>
              <div>
                Removal:{' '}
                <span className={pastVehiclesCount > 0 ? 'text-amber-400' : 'text-slate-400'}>
                  {pastVehiclesCount > 0 ? 'Jan 15, 2026' : 'Not removed yet'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 min-w-0">
          {activeTab === 'overview' && (
            <OverviewPage state={state} onNavigate={(tab) => setActiveTab(tab as TabKey)} />
          )}
          {activeTab === 'policy' && (
            <PolicyPage
              state={state}
              setState={setState}
              onNavigate={(tab) => setActiveTab(tab as TabKey)}
              showToast={showToast}
            />
          )}
          {activeTab === 'claim' && (
            <FileClaimPage
              state={state}
              setState={setState}
              onNavigate={(tab) => setActiveTab(tab as TabKey)}
              showToast={showToast}
            />
          )}
          {activeTab === 'coverage' && <CoverageHistoryPage state={state} />}
          {activeTab === 'audit' && <AuditTrailPage state={state} />}
          {activeTab === 'architecture' && <ArchitecturePage />}
        </main>
      </div>

      {/* ─── Persistent Unobtrusive Disclaimer ──────────────────────────────────── */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-400">
        Concept prototype built as a product and engineering thought exercise. Uses synthetic data only and does not represent any company's production architecture.
      </footer>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export function App() {
  return (
    <DemoProvider>
      <MainApp />
    </DemoProvider>
  )
}

export default App
