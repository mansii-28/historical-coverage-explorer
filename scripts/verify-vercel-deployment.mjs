#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Historical Coverage Explorer — Public Deployment Smoke Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates complete end-to-end functionality against a live Vercel + Neon deployment.
 *
 * Usage:
 *   BASE_URL=https://historical-coverage-explorer.vercel.app node scripts/verify-vercel-deployment.mjs
 *   or:
 *   BASE_URL=http://localhost:3000 node scripts/verify-vercel-deployment.mjs
 *
 * ⚠️ WARNING:
 *   This script runs an end-to-end verification journey that resets synthetic
 *   demonstration data. At completion, it restores the canonical baseline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

console.log('='.repeat(70))
console.log('Historical Coverage Explorer — Public Deployment Verification')
console.log(`Target Base URL: ${BASE_URL}`)
console.log('⚠️  Notice: This script tests against live persistence and restores canonical demo state at completion.')
console.log('='.repeat(70))

async function runStep(stepNumber, title, fn) {
  process.stdout.write(`Step ${stepNumber}: ${title} ... `)
  try {
    const result = await fn()
    console.log('✓ PASS')
    return result
  } catch (err) {
    console.log('✗ FAIL')
    console.error(`\n[ERROR in Step ${stepNumber}] ${err.message}`)
    if (err.cause) console.error(err.cause)
    process.exit(1)
  }
}

async function fetchJson(urlPath, options = {}) {
  const url = `${BASE_URL}${urlPath}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${urlPath}: ${text}`)
  }
  return res.json()
}

async function main() {
  // 1. GET /health
  await runStep(1, 'Health probe verifies database connectivity', async () => {
    const data = await fetchJson('/health')
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`)
    if (data.database !== 'connected') throw new Error(`Database not connected: ${data.database}`)
  })

  // 2. GET /api/docs
  await runStep(2, 'Swagger API docs reachable', async () => {
    const res = await fetch(`${BASE_URL}/api/docs`)
    if (!res.ok) throw new Error(`Swagger docs returned HTTP ${res.status}`)
    const text = await res.text()
    if (!text.includes('swagger') && !text.includes('Historical Coverage Explorer')) {
      throw new Error('Swagger UI markers not found in /api/docs HTML')
    }
  })

  // 3. POST /api/demo/reset
  await runStep(3, 'Reset demonstration dataset to canonical baseline', async () => {
    const data = await fetchJson('/api/demo/reset', { method: 'POST' })
    if (data.scenario !== 'canonical') throw new Error(`Unexpected scenario: ${data.scenario}`)
  })

  // 4. GET canonical policy
  let vehicleId = 1
  await runStep(4, 'Fetch canonical policy DEMO-AUTO-1024 and active vehicle', async () => {
    const policy = await fetchJson('/api/policies/1')
    if (policy.policy_number !== 'DEMO-AUTO-1024') throw new Error(`Wrong policy number: ${policy.policy_number}`)
    if (policy.customer_name !== 'Jordan Lee') throw new Error(`Wrong customer name: ${policy.customer_name}`)

    const vehicles = await fetchJson('/api/policies/1/vehicles')
    if (!Array.isArray(vehicles) || vehicles.length === 0) throw new Error('No vehicles found for policy')
    const activeVeh = vehicles.find((v) => v.removed_at === null)
    if (!activeVeh) throw new Error('No active vehicle found')
    vehicleId = activeVeh.id
    if (activeVeh.make !== 'BMW' || activeVeh.model !== 'X3') {
      throw new Error(`Unexpected vehicle: ${activeVeh.year} ${activeVeh.make} ${activeVeh.model}`)
    }
  })

  // 5. Remove vehicle effective Jan 15
  await runStep(5, 'Soft-remove vehicle effective Jan 15, 2026', async () => {
    const removal = await fetchJson(`/api/vehicles/${vehicleId}/remove`, {
      method: 'POST',
      body: JSON.stringify({ effective_date: '2026-01-15' }),
    })
    if (removal.removed_at !== '2026-01-15') {
      throw new Error(`Vehicle removed_at not set: ${removal.removed_at}`)
    }
    if (!removal.closed_coverage_version_id) {
      throw new Error(`Closed coverage version ID missing: ${removal.closed_coverage_version_id}`)
    }
  })

  // 6. Jan 10 lookup = COVERAGE_FOUND
  let pinnedCoverageVersionId = 1
  await runStep(6, 'Evaluate retrospective loss date Jan 10 (returns COVERAGE_FOUND)', async () => {
    const lookup = await fetchJson('/api/coverage/check', {
      method: 'POST',
      body: JSON.stringify({
        vehicle_id: vehicleId,
        date_of_loss: '2026-01-10',
      }),
    })
    if (lookup.verification_status !== 'COVERAGE_FOUND') {
      throw new Error(`Expected COVERAGE_FOUND, got: ${lookup.verification_status}`)
    }
    if (!lookup.coverage_version || !lookup.coverage_version.id) {
      throw new Error('Coverage version missing from lookup response')
    }
    pinnedCoverageVersionId = lookup.coverage_version.id
  })

  // 7 & 8. Create Jan 10 claim & verify pinned coverage_version_id
  await runStep(7, 'File retrospective claim and verify pinned coverage version', async () => {
    const claim = await fetchJson('/api/claims', {
      method: 'POST',
      body: JSON.stringify({
        policy_id: 1,
        vehicle_id: vehicleId,
        date_of_loss: '2026-01-10',
        filed_at: '2026-02-10T12:00:00Z',
      }),
    })
    if (!claim.claim_number) throw new Error('Claim number missing')
    if (claim.coverage_version_id !== pinnedCoverageVersionId) {
      throw new Error(`Claim not pinned to version ${pinnedCoverageVersionId}: got ${claim.coverage_version_id}`)
    }
    if (claim.coverage_verification_status !== 'COVERAGE_FOUND') {
      throw new Error(`Expected COVERAGE_FOUND status on claim: got ${claim.coverage_verification_status}`)
    }
  })

  // 9. Jan 20 lookup = REQUIRES_MANUAL_REVIEW
  await runStep(8, 'Evaluate post-removal incident Jan 20 (returns REQUIRES_MANUAL_REVIEW, zero denial)', async () => {
    const lookup = await fetchJson('/api/coverage/check', {
      method: 'POST',
      body: JSON.stringify({
        vehicle_id: vehicleId,
        date_of_loss: '2026-01-20',
      }),
    })
    if (lookup.verification_status !== 'REQUIRES_MANUAL_REVIEW') {
      throw new Error(`Expected REQUIRES_MANUAL_REVIEW, got: ${lookup.verification_status}`)
    }
    if (lookup.coverage_version !== null) {
      throw new Error('Expected coverage_version to be null for uncovered date')
    }
  })

  // 10. PDF endpoint returns application/pdf
  await runStep(9, 'Generate point-in-time Proof of Insurance PDF in memory', async () => {
    const res = await fetch(`${BASE_URL}/api/coverage/${pinnedCoverageVersionId}/proof.pdf`)
    if (!res.ok) throw new Error(`PDF endpoint returned HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/pdf')) {
      throw new Error(`Expected application/pdf, got: ${contentType}`)
    }
    const demoNotice = res.headers.get('x-demo-notice') || ''
    if (!demoNotice.includes('DEMO ONLY')) {
      throw new Error(`Expected DEMO ONLY header in PDF response, got: ${demoNotice}`)
    }
    const buf = await res.arrayBuffer()
    const header = new TextDecoder().decode(buf.slice(0, 5))
    if (!header.startsWith('%PDF-')) {
      throw new Error(`Invalid PDF magic bytes: ${header}`)
    }
  })

  // 11. Audit endpoint works
  await runStep(10, 'Inspect immutable domain audit events', async () => {
    const events = await fetchJson('/api/policies/1/audit-events')
    if (!Array.isArray(events) || events.length < 3) {
      throw new Error(`Expected at least 3 audit events, found: ${events.length}`)
    }
    const types = events.map((e) => e.event_type || e.action)
    if (!types.includes('VEHICLE_REMOVED')) throw new Error('Missing VEHICLE_REMOVED audit event')
    if (!types.includes('CLAIM_CREATED')) throw new Error('Missing CLAIM_CREATED audit event')
  })

  // 12. Versioned scenario verification (Scenario 5)
  await runStep(11, 'Verify multi-version interval coverage selection (Jan 5 -> V1, Jan 10 -> V2)', async () => {
    // Seed versioned scenario
    await fetchJson('/api/demo/reset?scenario=versioned', { method: 'POST' })

    const jan5 = await fetchJson('/api/coverage/check', {
      method: 'POST',
      body: JSON.stringify({ vehicle_id: vehicleId, date_of_loss: '2026-01-05' }),
    })
    if (jan5.coverage_version.version_label !== 'Version 1') {
      throw new Error(`Expected Version 1 on Jan 5, got ${jan5.coverage_version.version_label}`)
    }
    if (Number(jan5.coverage_version.deductible) !== 1000) {
      throw new Error(`Expected $1,000 deductible on Jan 5, got ${jan5.coverage_version.deductible}`)
    }

    const jan10 = await fetchJson('/api/coverage/check', {
      method: 'POST',
      body: JSON.stringify({ vehicle_id: vehicleId, date_of_loss: '2026-01-10' }),
    })
    if (jan10.coverage_version.version_label !== 'Version 2') {
      throw new Error(`Expected Version 2 on Jan 10, got ${jan10.coverage_version.version_label}`)
    }
    if (Number(jan10.coverage_version.deductible) !== 500) {
      throw new Error(`Expected $500 deductible on Jan 10, got ${jan10.coverage_version.deductible}`)
    }
  })

  // 13. Reset canonical state at completion
  await runStep(12, 'Restore canonical demonstration state at completion', async () => {
    const data = await fetchJson('/api/demo/reset?scenario=canonical', { method: 'POST' })
    if (data.scenario !== 'canonical') throw new Error(`Reset failed: ${data.scenario}`)
  })

  console.log('='.repeat(70))
  console.log('🎉 ALL 12 DEPLOYMENT SMOKE TEST STEPS PASSED SUCCESSFULLY!')
  console.log('='.repeat(70))
}

main().catch((err) => {
  console.error('Fatal deployment smoke test failure:', err)
  process.exit(1)
})
