import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PolicyPage } from './PolicyPage'
import { createInitialDemoState } from '../data/fixtures'

describe('PolicyPage Component', () => {
  it('renders active vehicle details with masked VIN and active status', () => {
    const state = createInitialDemoState()
    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    render(
      <PolicyPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    // Check active vehicle heading and details
    expect(screen.getByRole('heading', { level: 2, name: /Active Vehicles \(1\)/i })).toBeInTheDocument()
    expect(screen.getByText('2024 BMW X3')).toBeInTheDocument()
    expect(screen.getByText('••••-001')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders past vehicles section with removal date when vehicle is removed', () => {
    const state = createInitialDemoState()
    // Soft remove vehicle
    state.vehicles[0].is_active = false
    state.vehicles[0].removed_at = '2026-01-15'

    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    render(
      <PolicyPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    // Active count should be 0, Past count should be 1
    expect(screen.getByRole('heading', { level: 2, name: /Active Vehicles \(0\)/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Past Vehicles \(1\)/i })).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument()
    expect(screen.getByText(/Soft-removed record/i)).toBeInTheDocument()
  })

  it('opens remove vehicle modal when clicking remove button', () => {
    const state = createInitialDemoState()
    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    render(
      <PolicyPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    const removeBtn = screen.getByRole('button', { name: /Remove Vehicle/i })
    fireEvent.click(removeBtn)

    // Modal should now be visible
    expect(screen.getByText('Remove 2024 BMW X3')).toBeInTheDocument()
    expect(screen.getByText(/Effective Removal Date/i)).toBeInTheDocument()
  })
})
