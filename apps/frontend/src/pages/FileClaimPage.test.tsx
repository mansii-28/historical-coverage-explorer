import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileClaimPage } from './FileClaimPage'
import { createInitialDemoState } from '../data/fixtures'
import * as coverageService from '../services/coverageService'
import * as claimService from '../services/claimService'

vi.mock('../services/coverageService', () => ({
  checkCoverage: vi.fn(),
}))

vi.mock('../services/claimService', () => ({
  createClaim: vi.fn(),
}))

describe('FileClaimPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coverage form and default canonical date inputs', () => {
    const state = createInitialDemoState()
    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    render(
      <FileClaimPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    expect(screen.getByText('File Historical Claim')).toBeInTheDocument()
    expect(screen.getByLabelText(/Date of Loss \(Incident\)/i)).toHaveValue('2026-01-10')
    expect(screen.getByLabelText(/Date Claim Filed/i)).toHaveValue('2026-02-10')
  })

  it('displays COVERAGE_FOUND and Continue Claim button when coverage is found', async () => {
    const user = userEvent.setup()
    const state = createInitialDemoState()
    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    vi.mocked(coverageService.checkCoverage).mockResolvedValueOnce({
      lookup: {
        coverage_found: true,
        verification_status: 'COVERAGE_FOUND',
        date_queried: '2026-01-10',
        vehicle_id: 1,
        coverage_version: {
          id: 1,
          policy_id: 1,
          vehicle_id: 1,
          valid_from: '2026-01-01',
          valid_to: '2026-01-15',
          coverage_type: 'Comprehensive',
          liability_limit: '100000.00',
          deductible: '500.00',
          version_label: 'Version 1',
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      auditEvents: [],
    })

    render(
      <FileClaimPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    const checkBtn = screen.getByRole('button', { name: /Check Historical Coverage/i })
    await user.click(checkBtn)

    await waitFor(() => {
      expect(screen.getByText('COVERAGE_FOUND')).toBeInTheDocument()
      expect(screen.getByText('Historical Coverage Found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Continue Claim/i })).toBeInTheDocument()
    })
  })

  it('verifies claim confirmation displays Pinned Coverage Version and Version 1 after covered claim creation', async () => {
    const user = userEvent.setup()
    const state = createInitialDemoState()
    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    vi.mocked(coverageService.checkCoverage).mockResolvedValueOnce({
      lookup: {
        coverage_found: true,
        verification_status: 'COVERAGE_FOUND',
        date_queried: '2026-01-10',
        vehicle_id: 1,
        coverage_version: {
          id: 1,
          policy_id: 1,
          vehicle_id: 1,
          valid_from: '2026-01-01',
          valid_to: '2026-01-15',
          coverage_type: 'Comprehensive',
          liability_limit: '100000.00',
          deductible: '500.00',
          version_label: 'Version 1',
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      auditEvents: [],
    })

    vi.mocked(claimService.createClaim).mockResolvedValueOnce({
      claim: {
        id: 1,
        claim_number: 'CLM-2026-001',
        policy_id: 1,
        vehicle_id: 1,
        date_of_loss: '2026-01-10',
        filed_at: '2026-02-10',
        status: 'OPEN',
        coverage_verification_status: 'COVERAGE_FOUND',
        coverage_version_id: 1,
        created_at: '2026-02-10T10:00:00Z',
      },
      auditEvents: [],
    })

    render(
      <FileClaimPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    // 1. Evaluate coverage
    const checkBtn = screen.getByRole('button', { name: /Check Historical Coverage/i })
    await user.click(checkBtn)

    // 2. Submit claim via Continue Claim
    const continueBtn = await screen.findByRole('button', { name: /Continue Claim/i })
    await user.click(continueBtn)

    // 3. Verify confirmation screen explicitly displays Pinned Coverage Version and Version 1
    await waitFor(() => {
      expect(screen.getByText('Claim Successfully Created & Pinned')).toBeInTheDocument()
      expect(screen.getByText('Pinned Coverage Version:')).toBeInTheDocument()
      expect(screen.getByText('Version #1')).toBeInTheDocument()
      expect(screen.getByText(/Coverage Version 1 has been/i)).toBeInTheDocument()
    })
  })

  it('displays REQUIRES_MANUAL_REVIEW and never shows Claim Denied when coverage is not found', async () => {
    const user = userEvent.setup()
    const state = createInitialDemoState()
    const setState = vi.fn()
    const onNavigate = vi.fn()
    const showToast = vi.fn()

    vi.mocked(coverageService.checkCoverage).mockResolvedValue({
      lookup: {
        coverage_found: false,
        verification_status: 'REQUIRES_MANUAL_REVIEW',
        date_queried: '2026-01-20',
        vehicle_id: 1,
        coverage_version: null,
      },
      auditEvents: [],
    })

    render(
      <FileClaimPage
        state={state}
        setState={setState}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )

    // Select Jan 20 preset
    const uncoveredPreset = screen.getByRole('button', { name: /Uncovered: Jan 20/i })
    await user.click(uncoveredPreset)

    const checkBtn = screen.getByRole('button', { name: /Check Historical Coverage/i })
    await user.click(checkBtn)

    await waitFor(() => {
      expect(screen.getByText('REQUIRES_MANUAL_REVIEW')).toBeInTheDocument()
      expect(screen.getByText('No Automated Coverage Match')).toBeInTheDocument()
      // Strict rule: MUST NOT display "Claim Denied"
      expect(screen.queryByText(/Claim Denied/i)).toBeNull()
      expect(screen.getByRole('button', { name: /Continue to Manual Review/i })).toBeInTheDocument()
    })
  })
})
