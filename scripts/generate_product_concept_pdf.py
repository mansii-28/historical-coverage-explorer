#!/usr/bin/env python3
"""
Generate the Historical Coverage Explorer Product Concept HTML and PDF.
Outputs:
  - docs/Historical_Coverage_Explorer_Product_Concept.html (Editable source)
  - docs/Historical_Coverage_Explorer_Product_Concept.pdf (Polished 2-page PDF)
"""

import base64
import os
import subprocess
import sys
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOT_PATH = os.path.join(REPO_ROOT, "evidence", "screenshots", "tint-inspired", "03-policy-historical.png")
OUTPUT_HTML = os.path.join(REPO_ROOT, "docs", "Historical_Coverage_Explorer_Product_Concept.html")
OUTPUT_PDF = os.path.join(REPO_ROOT, "docs", "Historical_Coverage_Explorer_Product_Concept.pdf")
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Crop the screenshot to focus on the Past Vehicles card with historical badge & toast
im = Image.open(SCREENSHOT_PATH)
# Crop bounding box: x: 220 to 2660, y: 1140 to 1870
crop_img = im.crop((220, 1140, 2660, 1870))
scratch_crop = os.path.join(REPO_ROOT, "docs", "_temp_past_card.png")
crop_img.save(scratch_crop, format="PNG")

with open(scratch_crop, "rb") as f:
    b64_img = base64.b64encode(f.read()).decode("utf-8")

if os.path.exists(scratch_crop):
    os.remove(scratch_crop)

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Historical Coverage Explorer: Product Concept</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  @page {{
    size: letter;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  body {{
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    font-size: 9.1pt;
    line-height: 1.44;
  }}

  .page {{
    width: 8.5in;
    height: 11in;
    max-height: 11in;
    min-height: 11in;
    margin: 0 auto;
    background: #ffffff;
    padding: 0.44in 0.54in 0.40in 0.54in;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }}

  /* Header & Metadata */
  .memo-header {{
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 11px;
  }}

  .memo-meta-bar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.4pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0284c7;
    margin-bottom: 5px;
  }}

  .memo-title-block {{
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
  }}

  .memo-title {{
    font-size: 19.5pt;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0f172a;
    line-height: 1.1;
    margin: 0 0 3px 0;
  }}

  .memo-subtitle {{
    font-size: 9.4pt;
    font-weight: 500;
    color: #475569;
    margin: 0;
  }}

  .prototype-badge {{
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 5px 9px;
    text-align: right;
    white-space: nowrap;
    shrink: 0;
  }}

  .prototype-badge a {{
    color: #0284c7;
    text-decoration: none;
    font-weight: 700;
    font-size: 8pt;
    display: inline-block;
  }}

  .prototype-badge a:hover {{
    text-decoration: underline;
  }}

  .prototype-badge span {{
    display: block;
    font-size: 7pt;
    color: #64748b;
    font-weight: 500;
    margin-top: 1px;
  }}

  /* Framing Note */
  .framing-bar {{
    background: #f8fafc;
    border-left: 3px solid #0284c7;
    border-radius: 0 4px 4px 0;
    padding: 6px 10px;
    margin-bottom: 12px;
    font-size: 7.8pt;
    color: #475569;
    line-height: 1.35;
  }}

  .framing-bar strong {{
    color: #0f172a;
    font-weight: 600;
  }}

  /* Section Styling */
  .section {{
    margin-bottom: 12px;
  }}

  .section:last-child {{
    margin-bottom: 0;
  }}

  .section-title {{
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9.8pt;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #0f172a;
    text-transform: uppercase;
    margin: 0 0 6px 0;
    padding-bottom: 3px;
    border-bottom: 1px solid #e2e8f0;
  }}

  .section-num {{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 17px;
    height: 17px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 700;
  }}

  p {{
    margin: 0 0 7px 0;
    color: #334155;
    font-size: 8.8pt;
    line-height: 1.42;
  }}

  p:last-child {{
    margin-bottom: 0;
  }}

  ul {{
    margin: 3px 0 6px 14px;
    padding: 0;
  }}

  li {{
    margin-bottom: 2.5px;
    color: #334155;
    font-size: 8.5pt;
    line-height: 1.36;
  }}

  li strong {{
    color: #0f172a;
  }}

  /* Questions Box */
  .questions-callout {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 7px 11px;
    margin: 6px 0 7px 0;
  }}

  .questions-callout ul {{
    margin: 0 0 0 13px;
  }}

  .questions-callout li {{
    font-size: 8.3pt;
    margin-bottom: 2px;
    color: #334155;
    line-height: 1.32;
  }}

  /* Canonical Timeline Bar */
  .canonical-bar {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 6px 9px;
    margin: 7px 0 8px 0;
  }}

  .canon-step {{
    border-left: 2px solid #16a34a;
    padding-left: 6px;
  }}

  .canon-date {{
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    color: #16a34a;
    letter-spacing: 0.04em;
  }}

  .canon-event {{
    font-size: 8pt;
    font-weight: 700;
    color: #0f172a;
    margin: 1px 0;
  }}

  .canon-desc {{
    font-size: 7.1pt;
    color: #475569;
    line-height: 1.25;
  }}

  /* Concept Cards Grid */
  .concept-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
    margin-top: 6px;
  }}

  .concept-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 7px 9px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }}

  .concept-card-title {{
    font-size: 8.2pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }}

  .concept-card-title span.tag {{
    color: #0284c7;
    font-weight: 800;
  }}

  .concept-card-desc {{
    font-size: 7.9pt;
    color: #475569;
    line-height: 1.32;
    margin: 0;
  }}

  /* Workflow Steps */
  .workflow-strip {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin: 5px 0 8px 0;
  }}

  .wf-step {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-top: 2.5px solid #0284c7;
    border-radius: 5px;
    padding: 5px 7px;
  }}

  .wf-step-num {{
    font-size: 6.7pt;
    font-weight: 700;
    color: #0284c7;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 1px;
  }}

  .wf-step-name {{
    font-size: 8pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1px;
  }}

  .wf-step-detail {{
    font-size: 6.9pt;
    color: #64748b;
    line-height: 1.22;
    margin: 0;
  }}

  /* Screenshot Block */
  .screenshot-container {{
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 1.5px 4px rgba(0,0,0,0.03);
    margin: 7px 0;
  }}

  .screenshot-img {{
    width: 100%;
    height: 1.55in;
    object-fit: cover;
    object-position: center;
    display: block;
  }}

  .screenshot-caption {{
    font-size: 6.9pt;
    color: #64748b;
    background: #f8fafc;
    padding: 4px 7px;
    border-top: 1px solid #e2e8f0;
    text-align: left;
    display: flex;
    justify-content: space-between;
  }}

  /* Principles list */
  .principles-list {{
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    margin-top: 6px;
  }}

  .principle-item {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 2.5px solid #0f172a;
    border-radius: 0 4px 4px 0;
    padding: 4px 8px;
    font-size: 7.8pt;
    line-height: 1.3;
    color: #334155;
  }}

  .principle-item strong {{
    color: #0f172a;
    font-weight: 700;
  }}

  /* Explore Next Grid */
  .explore-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 6px;
  }}

  .explore-item {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 5px 8px;
    font-size: 7.6pt;
    color: #334155;
    line-height: 1.28;
  }}

  .explore-item strong {{
    color: #0284c7;
    display: block;
    font-size: 7.8pt;
    margin-bottom: 2px;
  }}

  /* Footer */
  .memo-footer {{
    border-top: 1px solid #e2e8f0;
    padding-top: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.1pt;
    color: #94a3b8;
  }}

  .memo-footer a {{
    color: #0284c7;
    text-decoration: none;
    font-weight: 600;
  }}

  .memo-footer a:hover {{
    text-decoration: underline;
  }}

  code {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.7pt;
    background: #f1f5f9;
    padding: 0.5px 3.5px;
    border-radius: 2.5px;
    color: #0f172a;
  }}
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="page-content">
    <div class="memo-header">
      <div class="memo-meta-bar">
        <span>Product Concept Note &bull; Internal Operations Workflow</span>
        <span>October 2026 &bull; APM Concept</span>
      </div>
      <div class="memo-title-block">
        <div>
          <h1 class="memo-title">Historical Coverage Explorer</h1>
          <p class="memo-subtitle">A lightweight concept for retrieving historical vehicle coverage records</p>
        </div>
        <div class="prototype-badge">
          <a href="https://historical-coverage-explorer.vercel.app" target="_blank">
            <span>Live Prototype &rarr;</span>
          </a>
          <span>historical-coverage-explorer.vercel.app</span>
        </div>
      </div>
    </div>

    <div class="framing-bar">
      <strong>Framing:</strong> This document outlines an independent product exploration into retrospective coverage retrieval after operational state changes. It is intended as a conversation starter rather than a prescription for Tint's internal architecture or processes.
    </div>

    <!-- 1. The Problem -->
    <div class="section">
      <div class="section-title">
        <span class="section-num">1</span>
        <span>The Problem</span>
      </div>
      <p>
        In dynamic embedded insurance and commercial fleet programs, vehicles are continuously added, substituted, or decommissioned from active policy schedules. When a vehicle is no longer active in the primary system, internal teams including Customer Support, Operations, and Claims often face significant friction when trying to answer retrospective coverage questions:
      </p>

      <div class="questions-callout">
        <ul>
          <li><strong>Was this vehicle covered on a particular date?</strong> (Verifying point-in-time eligibility for an incident that occurred weeks prior)</li>
          <li><strong>What policy was associated with it?</strong> (Tracing governing policy terms, endorsements, and customer account context)</li>
          <li><strong>When did coverage begin or end?</strong> (Establishing exact effective coverage windows and boundary conditions)</li>
          <li><strong>Why did coverage end?</strong> (Distinguishing between operational fleet swaps, customer cancellations, or administrative actions)</li>
          <li><strong>What historical policy record should an operations or support team reference?</strong> (Identifying the authoritative baseline for a claim or dispute)</li>
        </ul>
      </div>

      <div class="canonical-bar">
        <div class="canon-step">
          <div class="canon-date">Jan 1, 2026</div>
          <div class="canon-event">Coverage Begins</div>
          <div class="canon-desc">2024 BMW X3 insured with Comprehensive coverage ($500 ded).</div>
        </div>
        <div class="canon-step">
          <div class="canon-date">Jan 10, 2026</div>
          <div class="canon-event">Date of Loss</div>
          <div class="canon-desc">Accident occurs while vehicle is actively covered.</div>
        </div>
        <div class="canon-step">
          <div class="canon-date">Jan 15, 2026</div>
          <div class="canon-event">Vehicle Removed</div>
          <div class="canon-desc">Customer soft-removes vehicle from active fleet schedule.</div>
        </div>
        <div class="canon-step">
          <div class="canon-date">Feb 10, 2026</div>
          <div class="canon-event">Claim Submitted</div>
          <div class="canon-desc">System must resolve Jan 10 truth, not Feb 10 active fleet state.</div>
        </div>
      </div>

      <p>
        When production systems are architected strictly around "current active inventory," removing a vehicle can obscure or decouple its historical coverage timeline. Internal teams are then forced into manual, time-consuming investigation across raw transaction logs, database archives, or disparate support threads. Making historical coverage records readily discoverable and queryable reduces manual operational triage, accelerates inquiry response times, and prevents legitimate retrospective claims from being erroneously delayed or disputed.
      </p>
    </div>

    <!-- 2. Proposed Product Concept -->
    <div class="section">
      <div class="section-title">
        <span class="section-num">2</span>
        <span>Proposed Product Concept</span>
      </div>
      <p>
        The <strong>Historical Coverage Explorer</strong> is a lightweight internal tool concept designed to ensure that insurance truth deterministically survives operational state changes. Rather than treating vehicle removal as a destructive database event or burying removed records, the concept models coverage along an effective-dated temporal timeline (<code>[valid_from, valid_to)</code>).
      </p>
      <p>
        Internal users can search historical records using primary identifiers already available in their operational workflow, including <strong>Vehicle Identification Number (VIN)</strong>, <strong>Policy Number</strong>, and <strong>Customer Name</strong>, to retrieve previous coverage details even when the vehicle is no longer active.
      </p>

      <div class="concept-grid">
        <div class="concept-card">
          <div class="concept-card-title">
            <span class="tag">&bull;</span>
            <span>Operational Identifier Search</span>
          </div>
          <p class="concept-card-desc">
            Enables support and ops teams to locate past vehicle assets by VIN (e.g., <code>DEMO-VIN-001</code>), policy reference (<code>DEMO-AUTO-1024</code>), or account name, regardless of active status.
          </p>
        </div>
        <div class="concept-card">
          <div class="concept-card-title">
            <span class="tag">&bull;</span>
            <span>Active vs. Historical Separation</span>
          </div>
          <p class="concept-card-desc">
            Keeps day-to-day active fleet views uncluttered while cleanly preserving removed vehicles in an auditable "Past Vehicles" view with explicit historical tagging.
          </p>
        </div>
        <div class="concept-card">
          <div class="concept-card-title">
            <span class="tag">&bull;</span>
            <span>Point-in-Time Resolution</span>
          </div>
          <p class="concept-card-desc">
            Evaluates coverage eligibility against the specific date of loss rather than today's date, resolving the exact version, deductibles, and limits in effect on that day.
          </p>
        </div>
        <div class="concept-card">
          <div class="concept-card-title">
            <span class="tag">&bull;</span>
            <span>Read-Only Audit Integrity</span>
          </div>
          <p class="concept-card-desc">
            Maintains an immutable historical record and event ledger without risking unintended mutations to live production policy configurations.
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="memo-footer">
    <span>Historical Coverage Explorer &bull; Product Concept Note</span>
    <span>Live Prototype: <a href="https://historical-coverage-explorer.vercel.app">historical-coverage-explorer.vercel.app</a></span>
    <span>Page 1 of 2</span>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-content">
    <!-- 3. Prototype Workflow -->
    <div class="section">
      <div class="section-title">
        <span class="section-num">3</span>
        <span>Prototype Workflow</span>
      </div>
      <p>
        The prototype demonstrates an end-to-end retrospective retrieval and verification journey:
      </p>

      <!-- Workflow Diagram -->
      <div class="workflow-strip">
        <div class="wf-step">
          <div class="wf-step-num">Step 01</div>
          <div class="wf-step-name">Search Vehicle</div>
          <p class="wf-step-detail">Enter VIN, policy number, or insured name to locate asset.</p>
        </div>
        <div class="wf-step">
          <div class="wf-step-num">Step 02</div>
          <div class="wf-step-name">Locate Record</div>
          <p class="wf-step-detail">Identify vehicle in Active Fleet or preserved Past Vehicles list.</p>
        </div>
        <div class="wf-step">
          <div class="wf-step-num">Step 03</div>
          <div class="wf-step-name">Coverage Timeline</div>
          <p class="wf-step-detail">Inspect effective intervals and evaluate incident date of loss.</p>
        </div>
        <div class="wf-step">
          <div class="wf-step-num">Step 04</div>
          <div class="wf-step-name">Policy Details</div>
          <p class="wf-step-detail">Retrieve governing deductible, limits, proof PDF, and audit trail.</p>
        </div>
      </div>

      <!-- Screenshot -->
      <div class="screenshot-container">
        <img class="screenshot-img" src="data:image/png;base64,{b64_img}" alt="Historical Policy State in Prototype">
        <div class="screenshot-caption">
          <span><strong>Figure 1:</strong> Prototype interface showing soft-removed 2024 BMW X3 preserved under 'Past Vehicles' with explicit HISTORICAL status badge and proof certificate access.</span>
          <span>Tint-inspired prototype UI</span>
        </div>
      </div>

      <ul>
        <li><strong>Soft Vehicle Removal:</strong> Removing a vehicle sets an effective removal boundary (<code>removed_at</code>) and bounds the active coverage version without destroying database records or historical foreign keys.</li>
        <li><strong>Date-of-Loss Coverage Matching:</strong> Evaluating Jan 10 (accident date) returns <code>COVERAGE_FOUND</code> with governing terms ($500 deductible, $100,000 liability), even though the vehicle was removed on Jan 15.</li>
        <li><strong>Safe Exception Routing:</strong> Evaluating Jan 20 (post-removal) routes safely to <code>REQUIRES_MANUAL_REVIEW</code> for human adjuster triage rather than executing an automated claim denial.</li>
        <li><strong>Evidence Pinning & Audit Trail:</strong> Claim creation permanently freezes the governing coverage version reference, while all lifecycle events are logged to a durable audit ledger.</li>
      </ul>
    </div>

    <!-- 4. Product Principles -->
    <div class="section">
      <div class="section-title">
        <span class="section-num">4</span>
        <span>Product Principles</span>
      </div>
      <div class="principles-list">
        <div class="principle-item">
          <strong>1. Historical records survive operational state changes:</strong> Operational fleet adjustments (removals, replacements) must never delete or overwrite the historical terms that governed prior risk periods.
        </div>
        <div class="principle-item">
          <strong>2. Clear separation between current and historical state:</strong> Day-to-day active fleet views should remain uncluttered and current, while historical views preserve complete temporal depth without ambiguity.
        </div>
        <div class="principle-item">
          <strong>3. Search from operational identifiers:</strong> Internal teams require discovery entry points based on the identifiers they receive from customers and partners (VIN, policy number, external fleet reference).
        </div>
        <div class="principle-item">
          <strong>4. Point-in-time determinism:</strong> Coverage eligibility is dictated by the date of loss, not the filing date. System logic must evaluate the exact temporal interval active on the loss date.
        </div>
        <div class="principle-item">
          <strong>5. Read-only historical integrity:</strong> Historical views and claim evidence must be auditable and immutable, ensuring past contractual terms cannot be altered by future policy endorsements.
        </div>
      </div>
    </div>

    <!-- 5. What I Would Explore Next -->
    <div class="section">
      <div class="section-title">
        <span class="section-num">5</span>
        <span>What I Would Explore Next</span>
      </div>
      <div class="explore-grid">
        <div class="explore-item">
          <strong>1. User Workflow Validation</strong>
          What are the most common retrospective coverage inquiries received by Tint's Operations, Support, and Partner teams, and where in the current investigation flow does the greatest manual friction occur?
        </div>
        <div class="explore-item">
          <strong>2. Search Identifier Prioritization</strong>
          Which identifiers (e.g., VIN, license plate, external partner fleet ID, policy schedule ID) are most reliably available at the start of an operational inquiry across different embedded partner types?
        </div>
        <div class="explore-item">
          <strong>3. Authoritative Event Ingestion</strong>
          How do vehicle additions, cancellations, and endorsements originate from partner APIs and policy administration engines, and how can event ingestion guarantee complete temporal fidelity?
        </div>
        <div class="explore-item">
          <strong>4. Access Governance & Compliance Needs</strong>
          What role-based permissions, document retention policies, and formal export formats (e.g., formal audit packages for carrier partners vs. fast UI lookups for support) are required?
        </div>
      </div>
    </div>
  </div>

  <div class="memo-footer">
    <span>Historical Coverage Explorer &bull; Product Concept Note</span>
    <span>Live Prototype: <a href="https://historical-coverage-explorer.vercel.app">historical-coverage-explorer.vercel.app</a></span>
    <span>Page 2 of 2</span>
  </div>
</div>

</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_template)
print(f"Generated HTML source: {OUTPUT_HTML}")

# Generate PDF via Chrome Headless
cmd = [
    CHROME_BIN,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={OUTPUT_PDF}",
    "--no-pdf-header-footer",
    OUTPUT_HTML,
]
subprocess.run(cmd, check=True)
print(f"Generated PDF: {OUTPUT_PDF}")
