import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProofOfInsuranceModal } from './ProofOfInsuranceModal'
import { createInitialDemoState } from '../data/fixtures'

describe('ProofOfInsuranceModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders certificate modal with synthetic disclaimer and policy details', () => {
    const state = createInitialDemoState()
    const onClose = vi.fn()

    render(
      <ProofOfInsuranceModal
        isOpen={true}
        onClose={onClose}
        policy={state.policy}
        vehicle={state.vehicles[0]}
        coverageVersion={state.coverageVersions[0]}
        asOfDate="2026-01-10"
      />
    )

    expect(screen.getByText('CERTIFICATE OF AUTOMOBILE COVERAGE')).toBeInTheDocument()
    expect(screen.getByText(/DEMO ONLY — NOT A REAL INSURANCE DOCUMENT/i)).toBeInTheDocument()
    expect(screen.getByText(state.policy.policy_number)).toBeInTheDocument()
    expect(screen.getByText(state.policy.customer_name)).toBeInTheDocument()
  })

  it('exposes and invokes the live version-specific PDF route /api/coverage/1/proof.pdf', async () => {
    const user = userEvent.setup()
    const state = createInitialDemoState()
    const onClose = vi.fn()

    // Spy on window.open
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(
      <ProofOfInsuranceModal
        isOpen={true}
        onClose={onClose}
        policy={state.policy}
        vehicle={state.vehicles[0]}
        coverageVersion={{ ...state.coverageVersions[0], id: 1 }}
        asOfDate="2026-01-10"
      />
    )

    const downloadBtn = screen.getByRole('button', { name: /Download PDF/i })
    expect(downloadBtn).toBeInTheDocument()

    await user.click(downloadBtn)

    expect(windowOpenSpy).toHaveBeenCalledTimes(1)
    const openedUrl = windowOpenSpy.mock.calls[0][0] as string
    expect(openedUrl).toMatch(/\/api\/coverage\/1\/proof\.pdf$/)
    expect(windowOpenSpy.mock.calls[0][1]).toBe('_blank')
  })
})
