// ─── Demo Context Definition ──────────────────────────────────────────────────

import { createContext } from 'react'
import type { DemoState, AuditEvent } from '../types/domain'

export interface DemoContextValue {
  state: DemoState
  setState: React.Dispatch<React.SetStateAction<DemoState>>
  resetDemo: () => void
  appendAuditEvent: (event: Omit<AuditEvent, 'id'>) => void
}

export const DemoContext = createContext<DemoContextValue | null>(null)
