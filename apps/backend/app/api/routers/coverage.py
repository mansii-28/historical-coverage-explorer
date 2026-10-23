"""Coverage router."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas import CoverageCheckRequest, CoverageLookupResponse
from app.services.coverage_service import check_coverage
from app.services.document_service import generate_proof_of_insurance_pdf
from app.services.vehicle_service import get_vehicle_by_id

router = APIRouter(prefix="/api/coverage", tags=["coverage"])


@router.post(
    "/check",
    response_model=CoverageLookupResponse,
    summary="Check historical coverage for date of loss",
    description=(
        "Performs deterministic historical lookup using the given date_of_loss. "
        "Returns COVERAGE_FOUND if an effective coverage version encompasses the date, "
        "or REQUIRES_MANUAL_REVIEW if no automated match exists. Never returns automated denial."
    ),
)
async def check_coverage_endpoint(
    payload: CoverageCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    vehicle = await get_vehicle_by_id(db, payload.vehicle_id)
    policy_id = vehicle.policy_id if vehicle else None
    return await check_coverage(
        session=db,
        vehicle_id=payload.vehicle_id,
        date_of_loss=payload.date_of_loss,
        record_audit=True,
        policy_id=policy_id,
    )


@router.get(
    "/{coverage_version_id}/proof.pdf",
    summary="Generate Proof of Insurance PDF",
    description=(
        "Generates a DEMO ONLY Certificate of Automobile Coverage PDF using ReportLab. "
        "Binds to a specific CoverageVersion record and records a PROOF_OF_INSURANCE_GENERATED "
        "audit event. Prominently watermarked as synthetic demonstration data."
    ),
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns the generated proof of insurance PDF.",
        }
    },
)
async def get_proof_of_insurance_pdf(
    coverage_version_id: int,
    db: AsyncSession = Depends(get_db),
):
    pdf_bytes = await generate_proof_of_insurance_pdf(
        session=db,
        coverage_version_id=coverage_version_id,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="proof-of-insurance-v{coverage_version_id}.pdf"'
            ),
            "X-Demo-Notice": "DEMO ONLY - NOT A REAL INSURANCE DOCUMENT",
        },
    )
