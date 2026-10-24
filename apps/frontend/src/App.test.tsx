import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import * as apiClient from './services/apiClient'
import { createInitialDemoState } from './data/fixtures'

vi.mock('./services/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/apiClient')>()
  return {
    ...actual,
    USE_MOCK: false,
    apiFetch: vi.fn(),
  }
})

describe('App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders application title and navigation', async () => {
    const fixtureState = createInitialDemoState()
    vi.mocked(apiClient.apiFetch).mockImplementation(async (url: string) => {
      if (url === '/api/policies/1') return fixtureState.policy
      if (url.includes('/vehicles')) return fixtureState.vehicles
      if (url.includes('/coverage-history')) return fixtureState.coverageVersions
      if (url.includes('/claims')) return fixtureState.claims
      if (url.includes('/audit-events')) return fixtureState.auditEvents
      return {}
    })

    render(<App />)

    expect(screen.getAllByText('Historical Coverage Explorer')[0]).toBeInTheDocument()
    expect(screen.getByText('Temporal Record Verification System')).toBeInTheDocument()

    const resetBtn = screen.getByRole('button', { name: /Reset Demo/i })
    await waitFor(() => {
      expect(resetBtn).not.toBeDisabled()
    })

    // Navigate to Policy & Vehicles
    const policyTab = screen.getByRole('button', { name: /Policy & Vehicles/i })
    fireEvent.click(policyTab)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Active Vehicles \(1\)/i })).toBeInTheDocument()
    })
  })

  it('displays error banner with retry button when backend connection fails', async () => {
    vi.mocked(apiClient.apiFetch).mockRejectedValue(new Error('Network error: connection refused'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Backend Connection Error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument()
    })
  })

  it('opens reset confirmation modal when Reset Demo button is clicked', async () => {
    const fixtureState = createInitialDemoState()
    vi.mocked(apiClient.apiFetch).mockImplementation(async (url: string) => {
      if (url === '/api/policies/1') return fixtureState.policy
      if (url.includes('/vehicles')) return fixtureState.vehicles
      if (url.includes('/coverage-history')) return fixtureState.coverageVersions
      if (url.includes('/claims')) return fixtureState.claims
      if (url.includes('/audit-events')) return fixtureState.auditEvents
      return {}
    })

    render(<App />)

    // Wait for initial load to finish so buttons are enabled
    const resetBtn = screen.getByRole('button', { name: /Reset Demo/i })
    await waitFor(() => {
      expect(resetBtn).not.toBeDisabled()
    })

    fireEvent.click(resetBtn)

    await waitFor(() => {
      expect(screen.getByText('Reset Demonstration State?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Confirm Reset/i })).toBeInTheDocument()
    })
  })
})
