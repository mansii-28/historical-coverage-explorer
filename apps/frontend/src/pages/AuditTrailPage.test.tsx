import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuditTrailPage } from './AuditTrailPage'
import { createInitialDemoState } from '../data/fixtures'

describe('AuditTrailPage Component', () => {
  it('renders audit trail header and seed audit events', () => {
    const state = createInitialDemoState()
    render(<AuditTrailPage state={state} />)

    expect(screen.getByText('System Audit Trail')).toBeInTheDocument()
    expect(screen.getByText('Policy Created')).toBeInTheDocument()
    expect(screen.getByText('Vehicle Added')).toBeInTheDocument()
    expect(screen.getByText('Coverage Activated')).toBeInTheDocument()
  })

  it('filters events when selecting category pill', () => {
    const state = createInitialDemoState()
    render(<AuditTrailPage state={state} />)

    // Click vehicle filter pill
    const vehicleFilterBtn = screen.getByRole('button', { name: /vehicle \(1\)/i })
    fireEvent.click(vehicleFilterBtn)

    // Vehicle Added should be present, Policy Created should not be in filtered list
    expect(screen.getByText('Vehicle Added')).toBeInTheDocument()
    expect(screen.queryByText('Policy Created')).toBeNull()
  })
})
