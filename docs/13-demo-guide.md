# 13 — Interviewer Demo Guide: Historical Coverage Explorer

> **Presenter:** Mansi Bhanushali
> **Target Audience:** Recruiter, Product Manager, Engineering Lead, or Technical Interviewer
> **Format:** 3–5 Minute Live Walkthrough
> **Live Demo URL:** [https://historical-coverage-explorer.vercel.app](https://historical-coverage-explorer.vercel.app)
> **Disclaimer:** *Independent concept prototype inspired by a product problem discussed during the interview process. Uses synthetic data only and does not represent any company's proprietary architecture. Not an official Tint product.*

---

## 1. 30-Second Elevator Pitch

> *"In embedded insurance and commercial fleet platforms, vehicles are frequently added and removed from active policies. But when an accident occurs on Monday and a customer removes the vehicle on Wednesday, what happens when they file a claim three weeks later?*
>
> *In naive systems, removing a vehicle deletes or hides it, causing the claims engine to search active inventory, fail, and mistakenly reject the claim. In insurance, **the date of loss determines coverage, not the claim filing date or current active fleet state**.*
>
> *I built **Historical Coverage Explorer** to solve this problem end-to-end. It uses effective-dated temporal modeling, deterministic SQL lookup, and immutable claim pinning so historical truth survives active-state changes."*

---

## 2. Screen-by-Screen Walkthrough

### Step 1: Overview & The Core Problem
- **URL / Screen:** [`/`](https://historical-coverage-explorer.vercel.app/) — Overview Page
- **What to Click:** Start at the top of the Overview page. Scroll to the narrative timeline.
- **What to Say:**
  > *"Here on the Overview page, we see the canonical scenario for customer Jordan Lee: policy active since Jan 1, 2026 for a 2024 BMW X3.*
  >
  > *Notice the scenario timeline: on Jan 10, an accident occurs. On Jan 15, the customer removes the BMW from their fleet. On Feb 10, they file a claim. Our goal is to prove that removing the vehicle on Jan 15 does not destroy its Jan 10 coverage."*
- **Product Insight to Emphasize:**
  > *"Removing a vehicle from an active user interface is an operational state change, not a historical deletion."*

---

### Step 2: Policy & Active Fleet
- **URL / Screen:** Click **Policy & Vehicles** in the top navigation.
- **What to Click:** Show the active BMW X3 card with its masked VIN (`••••-001`) and terms ($500 deductible, $100K liability).
- **What to Say:**
  > *"Under Policy & Vehicles, we see the active policy. The BMW X3 is currently active with Comprehensive coverage and a $500 deductible."*

---

### Step 3: Soft Vehicle Removal
- **URL / Screen:** Still on Policy page.
- **What to Click:** Click **Remove Vehicle** on the BMW X3 card.
  - In the modal, keep the default effective date (`2026-01-15`).
  - Point to the highlighted callout: *"Historical coverage records will be preserved."*
  - Click the primary button: **Confirm Removal**.
- **What to Say:**
  > *"When we remove this vehicle effective Jan 15, notice the system's clear guarantee: historical records are preserved. In the database, we don't drop rows or wipe history; we set `removed_at = Jan 15` and close the active coverage interval.*
  >
  > *Now, the BMW moves down to 'Past Vehicles' with an explicit `HISTORICAL` badge. It is removed from the active fleet, but its historical footprint is fully intact."*
- **Product Insight to Emphasize:**
  > *"Soft removal creates a clean temporal boundary while keeping past periods immutable."*

---

### Step 4: Coverage Over Time
- **URL / Screen:** Click **Coverage History** in the navigation.
- **What to Click:** Show the temporal coverage band and date selector.
- **What to Say:**
  > *"The Coverage History screen visualizes effective-dated versions over time. Because we closed the interval on Jan 15, Version 1 is bounded: Jan 1 &rarr; Jan 15.*
  >
  > *In our advanced versioned scenario, this screen also demonstrates how mid-term deductible updates ($1,000 &rarr; $500) are resolved cleanly without retroactive ambiguity."*

---

### Step 5: File a Historical Claim (The Positive Test)
- **URL / Screen:** Click **File Claim** in the navigation.
- **What to Click:**
  - In the Date of Loss field, enter `2026-01-10` (the date of the accident).
  - Click **Evaluate Coverage**.
  - Show the evaluation result card: `COVERAGE_FOUND`.
  - Click **Submit Claim**.
- **What to Say:**
  > *"Now comes the critical test. Even though the vehicle was removed today, the incident occurred on January 10. When we evaluate Jan 10, the resolver queries the temporal interval `valid_from <= date_of_loss < valid_to` and immediately returns `COVERAGE_FOUND` with the exact governing terms ($500 deductible).*
  >
  > *When we submit the claim, notice that it generates Claim #1001 and permanently pins Coverage Version 1. Even if the customer cancels their policy tomorrow, this claim’s legal context is permanently frozen."*
- **Product Insight to Emphasize:**
  > *"Notice we say `COVERAGE_FOUND`, not 'Claim Approved'. Checking coverage eligibility is the first gate; claims adjudication is a subsequent operational workflow."*

---

### Step 6: Post-Removal Incident (The Negative/Boundary Test)
- **URL / Screen:** Still on File Claim page.
- **What to Click:**
  - Change the Date of Loss to `2026-01-20` (5 days after the vehicle was removed).
  - Click **Evaluate Coverage**.
  - Point to the warm amber status box: `REQUIRES_MANUAL_REVIEW`.
- **What to Say:**
  > *"Now let's test what happens if an incident occurred on Jan 20—after the vehicle was removed.*
  >
  > *The system evaluates the date, finds no deterministic active coverage, and returns `REQUIRES_MANUAL_REVIEW`. Notice what we don't do: we never execute an automated denial. In insurance, automated rejection creates severe regulatory risk. We route it safely for human adjuster review."*
- **Product Insight to Emphasize:**
  > *"No automated approval, and no automated denial. Clean, safe failure modes."*

---

### Step 7: Point-in-Time Proof of Insurance PDF
- **URL / Screen:** Click **Policy & Vehicles** &rarr; click **View Proof of Insurance** (or via Coverage History).
- **What to Click:** Click **Download PDF** in the modal.
- **What to Say:**
  > *"To prove historical auditability, we generate point-in-time Proof of Insurance certificates dynamically in-memory using ReportLab. The document renders the exact terms that governed that version, timestamped with conspicuous synthetic demo watermarks."*
- **Clarification:** The generated PDF is a synthetic demo coverage document created solely for prototype demonstration; it is not legally valid proof of insurance.

---

### Step 8: Durable Audit Trail
- **URL / Screen:** Click **Audit Trail** in the navigation.
- **What to Click:** Show the event list. Click **Inspect Metadata** on `VEHICLE_REMOVED` or `CLAIM_CREATED`.
- **What to Say:**
  > *"Every lifecycle action is durably recorded in our PostgreSQL `audit_events` table with JSONB metadata and correlation IDs. This is separate from operational server logs; it serves as an immutable legal audit ledger."*

---

### Step 9: Architecture & Engineering Wrap-Up
- **URL / Screen:** Click **Architecture** in navigation.
- **What to Say:**
  > *"Under Architecture, we see the full stack: React 19 frontend, FastAPI backend, and Neon PostgreSQL deployed on Vercel Multi-Services.*
  >
  > *Key engineering highlights:
  > 1. Same-origin single domain routing (`/` and `/api/*`).
  > 2. Serverless SQLAlchemy `NullPool` preventing connection exhaustion against Neon.
  > 3. Production build migration pipeline using unpooled Neon endpoints.
  > 4. Comprehensive test pyramid: 58 automated test cases: 39 backend, 14 frontend, 5 Playwright E2E, plus a separate 12-step public deployment verification."*

---

## 3. Anticipated Interviewer Q&A

### Q1: Why not just use Redis or an application cache?
> **Answer:** *"A cache is an optimization, not a historical source of truth. Caches can be evicted, suffer cache-invalidation bugs, and lack relational foreign-key integrity. If a claim references an evicted cache key, you lose legal certainty. Relational effective-dated records in PostgreSQL provide durable, ACID-compliant historical truth."*

### Q2: Why did you choose effective-dated versioning over Event Sourcing?
> **Answer:** *"Event sourcing is powerful, but for policy coverage resolution, effective-dated relational modeling delivers the exact same temporal determinism with far lower operational complexity. It allows standard B-tree SQL range indexing (`valid_from <= date < valid_to`), native foreign-key constraints on claims (`ON DELETE RESTRICT`), and is immediately intuitive to engineers and regulators without complex event replay projections."*

### Q3: Why half-open intervals `[valid_from, valid_to)`?
> **Answer:** *"Closed intervals `[start, end]` introduce ambiguity at date boundaries. If Version 1 ends Jan 7 and Version 2 starts Jan 8, what happens at 11:59:59 PM? With half-open intervals, `valid_to` is strictly exclusive. Every single second in time maps to exactly one version, preventing both coverage gaps and accidental double-coverage."*

### Q4: Why pin `coverage_version_id` to the claim?
> **Answer:** *"If a claim simply stored a timestamp and dynamically queried coverage every time someone loaded the claim, any future policy endorsement, retrospective clerical edit, or policy renewal could accidentally alter the deductible or limits displayed on the claim. Pinning creates an immutable pointer that freezes the legal contract terms at the moment of evaluation."*

### Q5: Why is there no AI or LLM in the coverage decision path?
> **Answer:** *"Insurance coverage determination is a legal and regulatory contract. An LLM can hallucinate, produce non-deterministic results, or make non-reproducible decisions. Determining whether an incident date falls between Jan 1 and Jan 15 is deterministic relational math. Core policy adjudication belongs in deterministic code; LLMs are better suited for text extraction from accident reports."*

### Q6: How does this scale in production?
> **Answer:** *"The query pattern is highly index-friendly: composite index on `(policy_id, vehicle_id, valid_from)`. Because historical records are append-only and rarely updated after creation, read traffic scales horizontally across PostgreSQL read replicas or read-only analytical stores with minimal locking contention."*

---

## 4. Reset Demo & Recovery

### Why Reset Demo Exists
The **Reset Demo** functionality exists solely to make this synthetic concept prototype completely repeatable for recruiters, interviewers, and prospective reviewers who want to explore different scenarios from a clean slate.

> ⚠️ **Production Architecture Note:** A publicly exposed, destructive reset endpoint like `/api/demo/reset` would **never** be appropriate or permitted in an actual production insurance system. In a real-world enterprise insurance platform, historical records and ledger transactions are permanent and immutable; tenant data isolation, compliance standards, and administrative safeguards strictly prohibit destructive resets. In this prototype, it is provided purely as an evaluation utility, protected by application configuration (`DEMO_RESET_ENABLED`).

If the database state has been mutated during an earlier walkthrough, you can restore clean factory conditions in one click:
- **In the UI:** Click **Reset Demo** in the top-right header &rarr; confirm modal.
- **Via CLI:** Run `BASE_URL=https://historical-coverage-explorer.vercel.app node scripts/verify-vercel-deployment.mjs` to run the 12-point smoke test and automatically restore canonical state.
