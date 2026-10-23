"""
Pydantic Schemas for Historical Coverage Explorer.
==================================================
Strict request and response serialization with Pydantic v2.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_serializer

# ─── Policy Schemas ──────────────────────────────────────────────────────────


class PolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policy_number: str
    customer_name: str
    status: str
    created_at: datetime
    updated_at: datetime


# ─── Vehicle Schemas ─────────────────────────────────────────────────────────


class VehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policy_id: int
    vin: str
    make: str
    model: str
    year: int
    added_at: date
    removed_at: date | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class VehicleRemovalRequest(BaseModel):
    effective_date: date = Field(
        ...,
        description="Effective date of removal in YYYY-MM-DD format (e.g. 2026-01-15)",
    )


class VehicleRemovalResponse(BaseModel):
    message: str
    vehicle_id: int
    removed_at: date
    closed_coverage_version_id: int


# ─── Coverage Version Schemas ────────────────────────────────────────────────


class CoverageVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policy_id: int
    vehicle_id: int
    valid_from: date
    valid_to: date | None = None
    coverage_type: str
    liability_limit: Decimal
    deductible: Decimal
    version_label: str
    created_at: datetime

    @field_serializer("liability_limit", "deductible")
    def serialize_decimal(self, v: Decimal) -> str:
        """Format monetary decimals with two decimal places."""
        return f"{v:.2f}"


class CoverageCheckRequest(BaseModel):
    vehicle_id: int
    date_of_loss: date


class CoverageLookupResponse(BaseModel):
    coverage_found: bool
    coverage_version: CoverageVersionResponse | None = None
    verification_status: str
    date_queried: date
    vehicle_id: int


# ─── Claim Schemas ───────────────────────────────────────────────────────────


class ClaimCreateRequest(BaseModel):
    policy_id: int
    vehicle_id: int
    date_of_loss: date
    filed_at: datetime | None = None


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    claim_number: str
    policy_id: int
    vehicle_id: int
    date_of_loss: date
    filed_at: datetime
    coverage_version_id: int | None = None
    coverage_verification_status: str
    status: str
    created_at: datetime
    updated_at: datetime
    coverage_version: CoverageVersionResponse | None = None
    vehicle: VehicleResponse | None = None


# ─── Audit Event Schemas ─────────────────────────────────────────────────────

# Map event type to UI category and human label
EVENT_CATEGORY_MAP: dict[str, str] = {
    "POLICY_CREATED": "policy",
    "VEHICLE_ADDED": "vehicle",
    "COVERAGE_ACTIVATED": "coverage",
    "COVERAGE_CHANGED": "coverage",
    "VEHICLE_REMOVAL_REQUESTED": "vehicle",
    "VEHICLE_REMOVED": "vehicle",
    "COVERAGE_CLOSED": "coverage",
    "HISTORICAL_COVERAGE_LOOKUP": "coverage",
    "HISTORICAL_COVERAGE_FOUND": "coverage",
    "HISTORICAL_COVERAGE_NOT_FOUND": "coverage",
    "CLAIM_CREATED": "claim",
    "CLAIM_LINKED_TO_COVERAGE_VERSION": "claim",
    "CLAIM_SENT_TO_MANUAL_REVIEW": "claim",
    "PROOF_OF_INSURANCE_GENERATED": "coverage",
}

EVENT_LABEL_MAP: dict[str, str] = {
    "POLICY_CREATED": "Policy Created",
    "VEHICLE_ADDED": "Vehicle Added",
    "COVERAGE_ACTIVATED": "Coverage Activated",
    "COVERAGE_CHANGED": "Coverage Terms Updated",
    "VEHICLE_REMOVAL_REQUESTED": "Vehicle Removal Requested",
    "VEHICLE_REMOVED": "Vehicle Removed",
    "COVERAGE_CLOSED": "Coverage Closed",
    "HISTORICAL_COVERAGE_LOOKUP": "Historical Coverage Lookup",
    "HISTORICAL_COVERAGE_FOUND": "Historical Coverage Found",
    "HISTORICAL_COVERAGE_NOT_FOUND": "Historical Coverage Not Found",
    "CLAIM_CREATED": "Claim Created",
    "CLAIM_LINKED_TO_COVERAGE_VERSION": "Claim Linked to Coverage Version",
    "CLAIM_SENT_TO_MANUAL_REVIEW": "Claim Routed to Manual Review",
    "PROOF_OF_INSURANCE_GENERATED": "Proof of Insurance Generated",
}


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    policy_id: int | None = None
    vehicle_id: int | None = None
    claim_id: int | None = None
    event_type: str
    event_timestamp: datetime
    metadata_json: dict[str, Any]
    created_at: datetime

    @computed_field
    @property
    def category(self) -> str:
        return EVENT_CATEGORY_MAP.get(self.event_type, "policy")

    @computed_field
    @property
    def human_label(self) -> str:
        return EVENT_LABEL_MAP.get(self.event_type, self.event_type)


# ─── Demo Reset Schemas ──────────────────────────────────────────────────────


class DemoResetResponse(BaseModel):
    message: str
    policy_id: int
    vehicle_id: int
    coverage_version_id: int
    scenario: str = "canonical"
