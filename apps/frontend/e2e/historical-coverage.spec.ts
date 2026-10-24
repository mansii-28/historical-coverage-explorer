import { test, expect } from '@playwright/test'

test.describe('Historical Coverage Explorer E2E Walkthrough', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset backend demo database to canonical baseline before each test
    const resetRes = await request.post('/api/demo/reset?scenario=canonical')
    expect(resetRes.ok()).toBeTruthy()

    // Load frontend
    await page.goto('/')
    await expect(page.getByText('Historical Coverage Explorer').first()).toBeVisible()
  })

  test('Scenario 1: Soft-remove BMW X3 → file retrospective Jan 10 claim → historical coverage found → claim submitted with pinned Coverage Version 1 → browser reload → pin remains persisted', async ({
    page,
  }) => {
    // 1. Navigate to Policy & Vehicles
    await page.getByRole('button', { name: /Policy & Vehicles/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: /Active Vehicles \(1\)/i })).toBeVisible()
    await expect(page.getByText('2024 BMW X3')).toBeVisible()

    // 2. Remove vehicle effective Jan 15, 2026
    await page.getByRole('button', { name: /Remove Vehicle/i }).click()
    await expect(page.getByText('Remove 2024 BMW X3')).toBeVisible()

    // Acknowledge soft removal principle
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /Confirm Removal/i }).click()

    // 3. Verify vehicle moved to Past Vehicles
    await expect(page.getByRole('heading', { level: 2, name: /Past Vehicles \(1\)/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /Active Vehicles \(0\)/i })).toBeVisible()
    await expect(page.getByText(/Removed: Jan 15, 2026/i)).toBeVisible()

    // 4. Navigate to File Claim
    await page.getByRole('button', { name: /File Claim/i }).first().click()
    await expect(page.getByText('File Historical Claim')).toBeVisible()

    // Set canonical dates: Loss Jan 10, Filed Feb 10
    const lossDateInput = page.locator('#date-of-loss-input')
    await lossDateInput.fill('2026-01-10')
    const filedDateInput = page.locator('#date-filed-input')
    await filedDateInput.fill('2026-02-10')

    // 5. Evaluate historical coverage
    await page.getByRole('button', { name: /Check Historical Coverage/i }).click()
    await expect(page.getByText('COVERAGE_FOUND')).toBeVisible()
    await expect(page.getByText('Historical Coverage Found')).toBeVisible()

    // 6. Submit claim and verify pinned coverage version
    await page.getByRole('button', { name: /Continue Claim/i }).click()
    await expect(page.getByText('Claim Successfully Created & Pinned')).toBeVisible()
    await expect(page.getByText(/Version 1/i)).toBeVisible()

    // 7. Test browser refresh persistence
    await page.reload()
    await expect(page.getByText('Historical Coverage Explorer').first()).toBeVisible()

    // Verify claims metric card and sidebar badge persisted across reload
    await expect(page.getByText('Claims Filed')).toBeVisible()
    await expect(page.getByRole('button', { name: /File Claim 1/i })).toBeVisible()

    // Navigate to Audit Trail to verify persisted audit events
    await page.getByRole('button', { name: /Audit Trail/i }).click()
    await expect(page.getByText('Claim Created')).toBeVisible()
    await expect(page.getByText('Claim Linked to Coverage Version')).toBeVisible()
  })

  test('Scenario 2: Loss date after vehicle removal routes to manual review with zero claim denial', async ({
    page,
  }) => {
    // 1. Remove vehicle on Jan 15
    await page.getByRole('button', { name: /Policy & Vehicles/i }).click()
    await page.getByRole('button', { name: /Remove Vehicle/i }).click()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /Confirm Removal/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: /Past Vehicles \(1\)/i })).toBeVisible()

    // 2. Navigate to File Claim
    await page.getByRole('button', { name: /File Claim/i }).first().click()

    // Select Uncovered preset: Jan 20
    await page.getByRole('button', { name: /Uncovered: Jan 20/i }).click()
    await page.getByRole('button', { name: /Check Historical Coverage/i }).click()

    // 3. Verify manual review routing
    await expect(page.getByText('REQUIRES_MANUAL_REVIEW')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'No Automated Coverage Match' })).toBeVisible()

    // Explicit UX requirement: Must never claim "Claim Denied"
    const deniedText = page.getByText(/Claim Denied/i)
    await expect(deniedText).toHaveCount(0)

    // 4. Continue to manual review
    await page.getByRole('button', { name: /Continue to Manual Review/i }).click()
    await expect(page.getByText('Claim Successfully Created & Pinned')).toBeVisible()
    await expect(page.getByText('None (Manual Review)')).toBeVisible()
  })

  test('Scenario 3: Audit Trail records immutable events and category filtering works', async ({
    page,
  }) => {
    // Navigate to Audit Trail
    await page.getByRole('button', { name: /Audit Trail/i }).click()
    await expect(page.getByText('System Audit Trail')).toBeVisible()
    await expect(page.getByText('Policy Created')).toBeVisible()
    await expect(page.getByText('Vehicle Added')).toBeVisible()
    await expect(page.getByText('Coverage Activated')).toBeVisible()

    // Filter by vehicle
    await page.getByRole('button', { name: /vehicle \(/i }).click()
    await expect(page.getByText('Vehicle Added')).toBeVisible()
  })

  test('Scenario 4: Reset Demo restores canonical state', async ({ page }) => {
    // Soft remove vehicle first
    await page.getByRole('button', { name: /Policy & Vehicles/i }).click()
    await page.getByRole('button', { name: /Remove Vehicle/i }).click()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /Confirm Removal/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: /Past Vehicles \(1\)/i })).toBeVisible()

    // Click Reset Demo button in top bar
    await page.getByRole('button', { name: /Reset Demo/i }).click()
    await expect(page.getByText('Reset Demonstration State?')).toBeVisible()
    await page.getByRole('button', { name: /Confirm Reset/i }).click()

    // Verify restored state: BMW X3 active again
    await expect(page.getByRole('heading', { level: 2, name: /Active Vehicles \(1\)/i })).toBeVisible()
    await expect(page.getByText('2024 BMW X3', { exact: true })).toBeVisible()
  })

  test('Scenario 5: Effective-Dated Coverage Version Selection across multiple intervals', async ({
    page,
    request,
  }) => {
    // 1. Seed and reset with versioned demo scenario
    const resetRes = await request.post('/api/demo/reset?scenario=versioned')
    expect(resetRes.ok()).toBeTruthy()

    // 2. Load frontend and navigate to File Claim
    await page.goto('/')
    await page.getByRole('button', { name: /File Claim/i }).first().click()
    await expect(page.getByText('File Historical Claim')).toBeVisible()

    const lossDateInput = page.locator('#date-of-loss-input')

    // 3. Historical lookup using Jan 5 (Version 1: Jan 1 → Jan 8, Deductible $1,000)
    await lossDateInput.fill('2026-01-05')
    await page.getByRole('button', { name: /Check Historical Coverage/i }).click()

    await expect(page.getByText('COVERAGE_FOUND')).toBeVisible()
    await expect(page.getByText(/Version 1/i)).toBeVisible()
    await expect(page.getByText(/1,000 ded\./i)).toBeVisible()

    // 4. Historical lookup using Jan 10 (Version 2: Jan 8 → Jan 15, Deductible $500)
    await lossDateInput.fill('2026-01-10')
    await page.getByRole('button', { name: /Check Historical Coverage/i }).click()

    await expect(page.getByText('COVERAGE_FOUND')).toBeVisible()
    await expect(page.getByText(/Version 2/i)).toBeVisible()
    await expect(page.getByText(/500 ded\./i)).toBeVisible()

    // 5. Restore canonical demo state
    const restoreRes = await request.post('/api/demo/reset?scenario=canonical')
    expect(restoreRes.ok()).toBeTruthy()
  })
})
