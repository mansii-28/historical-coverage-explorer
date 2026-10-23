// ─── useDemoContext Hook ──────────────────────────────────────────────────────

import { useContext } from 'react'
import { DemoContext, type DemoContextValue } from './DemoContextDef'

export function useDemoContext(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) {
    throw new Error('useDemoContext must be used within a DemoProvider')
  }
  return ctx
}
