"""SQLAlchemy models for the booking domain."""

from __future__ import annotations

import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Building(Base):
    __tablename__ = "buildings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[str | None] = mapped_column(String, nullable=True)


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    building_id: Mapped[str] = mapped_column(String, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class AmenityRule(Base):
    __tablename__ = "amenity_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(String, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    amenity_id: Mapped[str] = mapped_column(String, ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    slot_length_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    advance_booking_limit_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    operating_start_time: Mapped[time] = mapped_column(Time, nullable=False, default=time(6, 0))
    operating_end_time: Mapped[time] = mapped_column(Time, nullable=False, default=time(22, 0))
    allow_overlap: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    building_id: Mapped[str] = mapped_column(String, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    amenity_id: Mapped[str] = mapped_column(String, ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="BOOKED", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
