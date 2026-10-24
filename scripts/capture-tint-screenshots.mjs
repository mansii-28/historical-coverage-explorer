import { chromium } from '../apps/frontend/node_modules/@playwright/test/index.mjs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const screenshotDir = path.resolve(rootDir, 'evidence/screenshots/tint-inspired')

fs.mkdirSync(screenshotDir, { recursive: true })

async function run() {
  console.log('Starting screenshot capture against http://localhost:5173...')
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
  })

  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // 1. Reset demo state to canonical
  await page.request.post('http://localhost:8000/api/demo/reset?scenario=canonical')

  // 01-overview.png
  console.log('Capturing 01-overview.png...')
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(screenshotDir, '01-overview.png'), fullPage: false })

  // 02-policy-active.png
  console.log('Capturing 02-policy-active.png...')
  await page.getByRole('button', { name: /Policy & Vehicles/i }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(screenshotDir, '02-policy-active.png'), fullPage: false })

  // 09-proof-modal.png
  console.log('Capturing 09-proof-modal.png...')
  await page.getByRole('button', { name: /Proof of Insurance/i }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(screenshotDir, '09-proof-modal.png'), fullPage: false })
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.waitForTimeout(400)

  // 03-policy-historical.png (Remove vehicle)
  console.log('Capturing 03-policy-historical.png...')
  await page.getByRole('button', { name: /Remove Vehicle/i }).first().click()
  await page.waitForTimeout(400)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /Confirm Removal/i }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotDir, '03-policy-historical.png'), fullPage: false })

  // 04-coverage-history.png
  console.log('Capturing 04-coverage-history.png...')
  await page.getByRole('button', { name: /Coverage History/i }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(screenshotDir, '04-coverage-history.png'), fullPage: false })

  // 05-covered-claim.png
  console.log('Capturing 05-covered-claim.png...')
  await page.getByRole('button', { name: /File Claim/i }).first().click()
  await page.waitForTimeout(500)
  await page.locator('#date-of-loss-input').fill('2026-01-10')
  await page.getByRole('button', { name: /Check Historical Coverage/i }).click()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: /Continue Claim/i }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotDir, '05-covered-claim.png'), fullPage: false })

  // 06-manual-review.png
  console.log('Capturing 06-manual-review.png...')
  await page.getByRole('button', { name: /File Another Claim/i }).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Uncovered: Jan 20/i }).click()
  await page.getByRole('button', { name: /Check Historical Coverage/i }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(screenshotDir, '06-manual-review.png'), fullPage: false })

  // 07-audit-trail.png
  console.log('Capturing 07-audit-trail.png...')
  await page.getByRole('button', { name: /Audit Trail/i }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(screenshotDir, '07-audit-trail.png'), fullPage: false })

  // 08-architecture.png
  console.log('Capturing 08-architecture.png...')
  await page.getByRole('button', { name: /Architecture/i }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(screenshotDir, '08-architecture.png'), fullPage: false })

  // 10-mobile-overview.png (Mobile 390px)
  console.log('Capturing 10-mobile-overview.png...')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto('http://localhost:5173')
  await mobilePage.waitForTimeout(800)
  await mobilePage.screenshot({ path: path.join(screenshotDir, '10-mobile-overview.png'), fullPage: false })

  // Reset back to canonical state
  await page.request.post('http://localhost:8000/api/demo/reset?scenario=canonical')

  await browser.close()

  console.log('Console Errors:', consoleErrors)
  if (consoleErrors.length > 0) {
    console.warn(`WARNING: Encountered ${consoleErrors.length} console errors!`)
  } else {
    console.log('✅ ZERO unexpected console errors during browser walkthrough!')
  }
  console.log('All 10 screenshots captured successfully in evidence/screenshots/tint-inspired/')
}

run().catch((err) => {
  console.error('Screenshot script failed:', err)
  process.exit(1)
})
