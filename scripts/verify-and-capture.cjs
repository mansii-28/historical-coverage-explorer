// ─── Automated Verification & Screenshot Capture Script ───────────────────────
// Uses headless Chrome to verify all Phase 2 user journeys and capture evidence.

const path = require('path')
const fs = require('fs')
const puppeteer = require(path.resolve(__dirname, '../apps/frontend/node_modules/puppeteer-core'))

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const APP_URL = 'http://127.0.0.1:5173'
const SCREENSHOT_DIR = path.resolve(__dirname, '../evidence/screenshots')

async function run() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }

  console.log('Launching Chrome from:', CHROME_PATH)
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
      console.error('BROWSER CONSOLE ERROR:', msg.text())
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message)
    console.error('BROWSER PAGE ERROR:', err.message)
  })

  try {
    // 1. Overview Page
    console.log('1. Loading Overview page...')
    await page.goto(APP_URL, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-overview.png') })
    console.log('   Saved: 01-overview.png')

    // 2. Policy & Active Vehicles
    console.log('2. Navigating to Policy & Vehicles...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const policyBtn = btns.find((b) => b.textContent && b.textContent.includes('Policy & Vehicles'))
      if (policyBtn) policyBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-active-policy.png') })
    console.log('   Saved: 02-active-policy.png')

    // 3. Remove Vehicle Modal
    console.log('3. Opening Remove Vehicle modal...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const removeBtn = btns.find((b) => b.textContent && b.textContent.includes('Remove Vehicle'))
      if (removeBtn) removeBtn.click()
    })
    await new Promise((r) => setTimeout(r, 500))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-remove-vehicle.png') })
    console.log('   Saved: 03-remove-vehicle.png')

    // 4. Confirm Removal -> Past Vehicles
    console.log('4. Confirming vehicle removal...')
    await page.click('#ack-checkbox')
    await new Promise((r) => setTimeout(r, 200))
    await page.click('button[type="submit"]')
    // Wait for mock service delay & toast
    await new Promise((r) => setTimeout(r, 800))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-past-vehicle.png') })
    console.log('   Saved: 04-past-vehicle.png')

    // 5. Coverage History
    console.log('5. Navigating to Coverage History...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const covBtn = btns.find((b) => b.textContent && b.textContent.includes('Coverage History'))
      if (covBtn) covBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-coverage-history.png') })
    console.log('   Saved: 05-coverage-history.png')

    // 6. File Claim -> Check Jan 10 (Covered)
    console.log('6. Navigating to File Claim & checking Jan 10...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const claimBtn = btns.find((b) => b.textContent && b.textContent.includes('File Claim'))
      if (claimBtn) claimBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))

    // Click "Canonical: Jan 10 (Covered)" preset
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const jan10Btn = btns.find((b) => b.textContent && b.textContent.includes('Canonical: Jan 10'))
      if (jan10Btn) jan10Btn.click()
    })
    await new Promise((r) => setTimeout(r, 200))

    // Click Check Historical Coverage
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const checkBtn = btns.find((b) => b.textContent && b.textContent.includes('Check Historical Coverage'))
      if (checkBtn) checkBtn.click()
    })
    // Wait for mock delay
    await new Promise((r) => setTimeout(r, 900))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-covered-claim.png') })
    console.log('   Saved: 06-covered-claim.png')

    // 7. Continue Claim -> Pinned Coverage Confirmation
    console.log('7. Continuing claim creation & verifying pinned version...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const contBtn = btns.find((b) => b.textContent && b.textContent.includes('Continue Claim'))
      if (contBtn) contBtn.click()
    })
    await new Promise((r) => setTimeout(r, 900))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-claim-pinned-coverage.png') })
    console.log('   Saved: 07-claim-pinned-coverage.png')

    // 8. File Another Claim -> Check Jan 20 (Manual Review)
    console.log('8. Testing Jan 20 (Manual Review flow)...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const anotherBtn = btns.find((b) => b.textContent && b.textContent.includes('File Another Claim'))
      if (anotherBtn) anotherBtn.click()
    })
    await new Promise((r) => setTimeout(r, 400))

    // Click "Uncovered: Jan 20 (Manual Review)" preset
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const jan20Btn = btns.find((b) => b.textContent && b.textContent.includes('Uncovered: Jan 20'))
      if (jan20Btn) jan20Btn.click()
    })
    await new Promise((r) => setTimeout(r, 200))

    // Click Check Historical Coverage
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const checkBtn = btns.find((b) => b.textContent && b.textContent.includes('Check Historical Coverage'))
      if (checkBtn) checkBtn.click()
    })
    await new Promise((r) => setTimeout(r, 900))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-manual-review.png') })
    console.log('   Saved: 08-manual-review.png')

    // Click Continue to Manual Review
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const manualBtn = btns.find((b) => b.textContent && b.textContent.includes('Continue to Manual Review'))
      if (manualBtn) manualBtn.click()
    })
    await new Promise((r) => setTimeout(r, 800))

    // 9. Audit Trail
    console.log('9. Navigating to Audit Trail & expanding event metadata...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const auditBtn = btns.find((b) => b.textContent && b.textContent.includes('Audit Trail'))
      if (auditBtn) auditBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))

    // Expand the first event
    await page.evaluate(() => {
      const expandBtn = document.querySelector('button[aria-label="Expand event details"]')
      if (expandBtn) expandBtn.click()
    })
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-audit-trail.png') })
    console.log('   Saved: 09-audit-trail.png')

    // 10. Architecture & About
    console.log('10. Navigating to Architecture & About...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const archBtn = btns.find((b) => b.textContent && b.textContent.includes('Architecture & About'))
      if (archBtn) archBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-architecture.png') })
    console.log('    Saved: 10-architecture.png')

    // 11. Reset Demo Verification
    console.log('11. Verifying Demo Reset...')
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const resetBtn = btns.find((b) => b.textContent && b.textContent.includes('Reset Demo'))
      if (resetBtn) resetBtn.click()
    })
    await new Promise((r) => setTimeout(r, 300))

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const confirmResetBtn = btns.find((b) => b.textContent && b.textContent.includes('Confirm Reset'))
      if (confirmResetBtn) confirmResetBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))

    // Navigate to Policy & Vehicles to confirm BMW is back in Active Vehicles
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const policyBtn = btns.find((b) => b.textContent && b.textContent.includes('Policy & Vehicles'))
      if (policyBtn) policyBtn.click()
    })
    await new Promise((r) => setTimeout(r, 600))

    const activeVehiclesText = await page.evaluate(() => {
      return document.body.innerText
    })

    const bmwIsActive = activeVehiclesText.includes('Active Vehicles (1)') && activeVehiclesText.includes('2024 BMW X3')
    console.log('    BMW restored as Active Vehicle:', bmwIsActive)

    console.log('\n--- VERIFICATION SUMMARY ---')
    console.log('All 10 required screenshots captured successfully in evidence/screenshots/.')
    console.log('Total console errors encountered:', consoleErrors.length)
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors)
    }

  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('Verification script failed:', err)
  process.exit(1)
})
