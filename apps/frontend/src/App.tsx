// ─── Main Application Component ──────────────────────────────────────────────
// Historical Coverage Explorer — Clean Editorial Product Experience
// Clean white editorial canvas, deep navy typography, horizontal navigation,
// signature multicolor accent bands, and original product mark.

import React, { useState } from 'react'
import {
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
  Sparkles,
} from 'lucide-react'
import { DemoProvider } from './context/DemoContext'
import { useDemoContext } from './context/useDemoContext'
import { ToastContainer, type ToastType } from './components/Toast'
import { useToast } from './components/useToast'
import { ResetConfirmModal } from './components/ResetConfirmModal'
import { MulticolorBar } from './components/ui'
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

  const navItems: NavItem[] = [
    {
      key: 'overview',
      label: 'Overview & Lifecycle',
      icon: <Sparkles size={16} />,
    },
    {
      key: 'policy',
      label: 'Policy & Vehicles',
      icon: <Car size={16} />,
      badge: `${activeVehiclesCount} active`,
    },
    {
      key: 'claim',
      label: 'File Claim',
      icon: <FileText size={16} />,
      badge: state.claims.length > 0 ? `${state.claims.length}` : undefined,
    },
    {
      key: 'coverage',
      label: 'Coverage History',
      icon: <Layers size={16} />,
    },
    {
      key: 'audit',
      label: 'Audit Trail',
      icon: <History size={16} />,
      badge: `${state.auditEvents.length}`,
    },
    {
      key: 'architecture',
      label: 'Architecture & About',
      icon: <Server size={16} />,
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0a1128] flex flex-col antialiased font-sans">
      {/* ─── Top Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 py-2 items-center justify-between gap-4">
            {/* Left: Original Product Mark + Title */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-500 hover:text-[#0a1128] hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
              >
                {/* CSS Geometric Original Mark (Cyan + Cobalt layered square) */}
                <div className="product-logo-mark shrink-0" aria-hidden="true" />
                <div className="shrink-0">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#0a1128] block whitespace-nowrap leading-tight">
                    Historical Coverage Explorer
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block whitespace-nowrap">
                    Temporal Record Verification System
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Horizontal Navigation */}
            <nav className="hidden lg:flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const isActive = activeTab === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0a1128] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0a1128] hover:bg-slate-100'
                    }`}
                  >
                    <span className={isActive ? 'text-[#00c2cb]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                          isActive
                            ? 'bg-[#00c2cb] text-[#0a1128] font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Right: Status Pill & Reset Button */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Refined Status Pill */}
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c2cb] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c2cb]" />
                </span>
                <span className="font-bold text-[10px] uppercase tracking-wider text-[#00c2cb]">
                  LIVE DEMO
                </span>
                <span className="text-slate-400 font-medium">|</span>
                <span className="text-slate-600 font-semibold text-[11px]">
                  {USE_MOCK ? 'Mock Services Active' : 'FastAPI + PostgreSQL Live'}
                </span>
              </div>

              {/* Reset Demo Button */}
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                title="Reset the demo to initial canonical state"
              >
                <RotateCcw size={13} className={`text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Signature Multicolor Horizontal Bar ─────────────────────────────── */}
        <MulticolorBar />

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.key)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0a1128] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0a1128]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#00c2cb]' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                        isActive ? 'bg-[#00c2cb] text-[#0a1128]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* Backend Connection Error Banner */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          {reloadState && (
            <button
              type="button"
              onClick={() => reloadState()}
              className="inline-flex items-center gap-1.5 rounded-md bg-rose-200/60 hover:bg-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-900 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* ─── Main Content Canvas ─────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-w-0">
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

      {/* ─── Persistent Editorial Disclaimer Footer ──────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-4xl space-y-2">
          <p className="font-medium text-slate-600">
            Independent concept prototype inspired by a real product problem discussed during the interview process. Synthetic data only. Not an official Tint product.
          </p>
          <p className="text-[11px] text-slate-400">
            Demonstrating point-in-time temporal records, soft entity removal, and deterministic historical claim verification.
          </p>
        </div>
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
