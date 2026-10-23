"""
SQLAlchemy ORM models for Historical Coverage Explorer.
=======================================================
Implements effective-dated insurance coverage, soft vehicle removal,
claim coverage pinning, and immutable audit events.
"""

from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    """Return current timestamp in UTC timezone."""
    return datetime.now(UTC)


class Policy(Base):
    """
    Policy Entity.
    Represents an insurance policy.
    """

    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    policy_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships — Protected historical collections (no delete-orphan cascading)
    vehicles: Mapped[list["Vehicle"]] = relationship("Vehicle", back_populates="policy")
    coverage_versions: Mapped[list["CoverageVersion"]] = relationship(
        "CoverageVersion", back_populates="policy"
    )
    claims: Mapped[list["Claim"]] = relationship("Claim", back_populates="policy")
    audit_events: Mapped[list["AuditEvent"]] = relationship("AuditEvent", back_populates="policy")

    def __repr__(self) -> str:
        return f"<Policy id={self.id} number={self.policy_number} customer={self.customer_name}>"


class Vehicle(Base):
    """
    Vehicle Entity.
    Insured vehicle under a policy.
    Never hard deleted. Removing vehicle populates removed_at.
    """

    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    policy_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    vin: Mapped[str] = mapped_column(String(64), nullable=False)
    make: Mapped[str] = mapped_column(String(64), nullable=False)
    model: Mapped[str] = mapped_column(String(64), nullable=False)
    year: Mapped[int] = mapped_column(BigInteger, nullable=False)
    added_at: Mapped[date] = mapped_column(Date, nullable=False)
    removed_at: Mapped[date | None] = mapped_column(Date, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships — Protected historical collections (no delete-orphan cascading)
    policy: Mapped["Policy"] = relationship("Policy", back_populates="vehicles")
    coverage_versions: Mapped[list["CoverageVersion"]] = relationship(
        "CoverageVersion", back_populates="vehicle"
    )
    claims: Mapped[list["Claim"]] = relationship("Claim", back_populates="vehicle")
    audit_events: Mapped[list["AuditEvent"]] = relationship("AuditEvent", back_populates="vehicle")

    __table_args__ = (Index("ix_vehicles_policy_removed", "policy_id", "removed_at"),)

    @property
    def is_active(self) -> bool:
        """A vehicle is active if removed_at is not set."""
        return self.removed_at is None

    def __repr__(self) -> str:
        return (
            f"<Vehicle id={self.id} {self.year} {self.make} "
            f"{self.model} removed_at={self.removed_at}>"
        )


class CoverageVersion(Base):
    """
    CoverageVersion Entity.
    The source of truth for effective-dated coverage.
    Half-open interval semantics: valid_from <= date < valid_to.
    If valid_to is NULL, coverage remains open/active.
    """

    __tablename__ = "coverage_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    policy_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    vehicle_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_to: Mapped[date | None] = mapped_column(Date, nullable=True, default=None)
    coverage_type: Mapped[str] = mapped_column(String(64), nullable=False, default="Comprehensive")
    liability_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    deductible: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    version_label: Mapped[str] = mapped_column(String(64), nullable=False, default="Version 1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    policy: Mapped["Policy"] = relationship("Policy", back_populates="coverage_versions")
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="coverage_versions")
    claims: Mapped[list["Claim"]] = relationship("Claim", back_populates="coverage_version")

    __table_args__ = (
        CheckConstraint(
            "valid_to IS NULL OR valid_to > valid_from",
            name="ck_coverage_versions_valid_range",
        ),
        Index("ix_coverage_lookup", "vehicle_id", "valid_from", "valid_to"),
    )

    def is_active_on(self, target_date: date) -> bool:
        """Evaluate half-open interval: valid_from <= target_date < valid_to."""
        if target_date < self.valid_from:
            return False
        if self.valid_to is not None and target_date >= self.valid_to:
            return False
        return True

    def __repr__(self) -> str:
        return (
            f"<CoverageVersion id={self.id} vehicle_id={self.vehicle_id} "
            f"[{self.valid_from} -> {self.valid_to})>"
        )


class Claim(Base):
    """
    Claim Entity.
    Represents an insurance claim.
    Pins the historical coverage_version_id at creation time based on date_of_loss.
    """

    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    claim_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    policy_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("policies.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    vehicle_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    date_of_loss: Mapped[date] = mapped_column(Date, nullable=False)
    filed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    coverage_version_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("coverage_versions.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    coverage_verification_status: Mapped[str] = mapped_column(
        String(64), nullable=False, default="COVERAGE_FOUND"
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="SUBMITTED")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    # Relationships
    policy: Mapped["Policy"] = relationship("Policy", back_populates="claims")
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="claims")
    coverage_version: Mapped["CoverageVersion | None"] = relationship(
        "CoverageVersion", back_populates="claims"
    )
    audit_events: Mapped[list["AuditEvent"]] = relationship("AuditEvent", back_populates="claim")

    __table_args__ = (Index("ix_claims_vehicle_date_of_loss", "vehicle_id", "date_of_loss"),)

    def __repr__(self) -> str:
        return (
            f"<Claim id={self.id} number={self.claim_number} "
            f"date_of_loss={self.date_of_loss} "
            f"coverage_version_id={self.coverage_version_id}>"
        )


class AuditEvent(Base):
    """
    AuditEvent Entity.
    Durable, immutable record of material domain operations.
    """

    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    policy_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("policies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    vehicle_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    claim_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("claims.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    # Relationships
    policy: Mapped["Policy | None"] = relationship("Policy", back_populates="audit_events")
    vehicle: Mapped["Vehicle | None"] = relationship("Vehicle", back_populates="audit_events")
    claim: Mapped["Claim | None"] = relationship("Claim", back_populates="audit_events")

    __table_args__ = (Index("ix_audit_events_policy_timestamp", "policy_id", "event_timestamp"),)

    def __repr__(self) -> str:
        return f"<AuditEvent id={self.id} type={self.event_type} timestamp={self.event_timestamp}>"
