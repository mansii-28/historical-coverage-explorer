// ─── Demo Context Provider ────────────────────────────────────────────────────
// Global application state for the demo backed by FastAPI & PostgreSQL.
// On startup and refresh, real state is fetched from the server.

import { useState, useCallback, useEffect, type ReactNode } from 'react'
import type { DemoState, AuditEvent, Policy, Vehicle, CoverageVersion, Claim } from '../types/domain'
import { createInitialDemoState } from '../data/fixtures'
import { DemoContext } from './DemoContextDef'
import { apiFetch, USE_MOCK } from '../services/apiClient'

async function fetchFullState(): Promise<DemoState> {
  let policy: Policy
  try {
    policy = await apiFetch<Policy>('/api/policies/1')
  } catch (err: unknown) {
    // If database is empty, seed canonical baseline
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
      await apiFetch('/api/demo/reset', { method: 'POST' })
      policy = await apiFetch<Policy>('/api/policies/1')
    } else {
      throw err
    }
  }

  const [vehicles, coverageVersions, claims, auditEvents] = await Promise.all([
    apiFetch<Vehicle[]>(`/api/policies/${policy.id}/vehicles?include_removed=true`),
    apiFetch<CoverageVersion[]>('/api/vehicles/1/coverage-history'),
    apiFetch<Claim[]>(`/api/claims?policy_id=${policy.id}`),
    apiFetch<AuditEvent[]>(`/api/policies/${policy.id}/audit-events`),
  ])

  return {
    policy,
    vehicles,
    coverageVersions,
    claims,
    auditEvents,
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createInitialDemoState)
  const [isLoading, setIsLoading] = useState<boolean>(!USE_MOCK)
  const [error, setError] = useState<string | null>(null)

  const reloadState = useCallback(async () => {
    if (USE_MOCK) return
    setIsLoading(true)
    setError(null)
    try {
      const serverState = await fetchFullState()
      setState(serverState)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend'
      setError(`Backend Connection Error: ${message}. Ensure FastAPI is running on port 8000.`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load from database on initial mount
  useEffect(() => {
    if (USE_MOCK) return
    let active = true

    fetchFullState()
      .then((serverState) => {
        if (active) {
          setState(serverState)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const message = err instanceof Error ? err.message : 'Failed to connect to backend'
          setError(`Backend Connection Error: ${message}. Ensure FastAPI is running on port 8000.`)
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const resetDemo = useCallback(async () => {
    if (USE_MOCK) {
      setState(createInitialDemoState())
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await apiFetch('/api/demo/reset?scenario=canonical', { method: 'POST' })
      const serverState = await fetchFullState()
      setState(serverState)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset demo state'
      setError(`Reset Error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const appendAuditEvent = useCallback((event: Omit<AuditEvent, 'id'>) => {
    setState((prev) => {
      const id = prev.auditEvents.length > 0
        ? Math.max(...prev.auditEvents.map((e) => e.id)) + 1
        : 100
      return {
        ...prev,
        auditEvents: [...prev.auditEvents, { ...event, id }],
      }
    })
  }, [])

  return (
    <DemoContext.Provider
      value={{
        state,
        setState,
        resetDemo,
        appendAuditEvent,
        isLoading,
        error,
        reloadState,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}
