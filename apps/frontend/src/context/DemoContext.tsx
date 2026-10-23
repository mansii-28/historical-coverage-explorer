// ─── Demo Context Provider ────────────────────────────────────────────────────
// Global application state for the demo.

import { useState, useCallback, type ReactNode } from 'react'
import type { DemoState, AuditEvent } from '../types/domain'
import { createInitialDemoState } from '../data/fixtures'
import { DemoContext } from './DemoContextDef'

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createInitialDemoState)

  const resetDemo = useCallback(() => {
    setState(createInitialDemoState())
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
    <DemoContext.Provider value={{ state, setState, resetDemo, appendAuditEvent }}>
      {children}
    </DemoContext.Provider>
  )
}
