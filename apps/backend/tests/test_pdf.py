"""
PDF Generation Unit & Integration Tests.
========================================
Verifies deterministic proof-of-insurance PDF generation, demo watermarks,
and non-legal prototype disclaimers.
"""

import pytest
from fastapi import HTTPException

from app.services.document_service import generate_proof_of_insurance_pdf


@pytest.mark.asyncio
async def test_17_pdf_generation_content_and_watermark(db_session, seed_canonical_policy):
    """
    Test 17:
      Generates proof-of-insurance PDF for CoverageVersion 1.
      Verifies non-empty binary, valid PDF header, and demo disclaimers.
    """
    coverage_id = seed_canonical_policy["coverage_version_id"]

    pdf_bytes = await generate_proof_of_insurance_pdf(db_session, coverage_id)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # Standard PDF header
    assert pdf_bytes.startswith(b"%PDF-")

    # Inspect text streams in the generated binary
    # Watermark text and disclaimers are drawn into the canvas stream
    assert b"DEMO ONLY" in pdf_bytes
    assert b"NOT A REAL INSURANCE DOCUMENT" in pdf_bytes


@pytest.mark.asyncio
async def test_pdf_generation_unknown_coverage_version_404(db_session):
    """Verifies that requesting a PDF for an unknown coverage version raises 404."""
    with pytest.raises(HTTPException) as exc_info:
        await generate_proof_of_insurance_pdf(db_session, coverage_version_id=999999)

    assert exc_info.value.status_code == 404
    assert "not found" in exc_info.value.detail.lower()
