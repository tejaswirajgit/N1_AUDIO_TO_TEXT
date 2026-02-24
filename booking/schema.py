"""Pydantic schemas for booking and admin flows."""

from __future__ import annotations

from datetime import date, datetime, time
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class IntentType(str, Enum):
    BOOK = "BOOK"
    BOOK_AMENITY = "BOOK_AMENITY"
    CANCEL = "CANCEL"
    CANCEL_BOOKING = "CANCEL_BOOKING"
    CHECK_AVAILABILITY = "CHECK_AVAILABILITY"


class BookingStatus(str, Enum):
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"


class BookingIntent(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    intent: IntentType
    amenity: Optional[str] = Field(default=None, min_length=1)
    date: Optional[date] = None
    time: Optional[time] = None
    building_id: Optional[str] = None
    user_id: Optional[str] = None
    booking_id: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_by_intent(self):
        needs_schedule = self.intent in (IntentType.BOOK, IntentType.BOOK_AMENITY, IntentType.CHECK_AVAILABILITY)
        cancel_without_booking_id = self.intent in (IntentType.CANCEL, IntentType.CANCEL_BOOKING) and not self.booking_id

        if needs_schedule or cancel_without_booking_id:
            if not self.amenity:
                raise ValueError("amenity is required for this intent.")
            if self.date is None:
                raise ValueError("date is required for this intent.")
            if self.time is None:
                raise ValueError("time is required for this intent.")

        return self


class BookingResult(BaseModel):
    success: bool
    reason: Optional[str] = None
    booking_id: Optional[str] = None
    status: Optional[BookingStatus] = None
    amenity_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    available: Optional[bool] = None

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip() or None


class AmenityUpsertRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    building_id: str
    amenity_id: Optional[str] = None
    name: str = Field(min_length=1)
    capacity: Optional[int] = Field(default=None, ge=1)
    is_active: bool = True


class AmenityRuleUpdateRequest(BaseModel):
    building_id: Optional[str] = None
    amenity_id: str
    max_capacity: Optional[int] = Field(default=None, ge=1)
    max_duration_minutes: Optional[int] = Field(default=None, ge=1)
    slot_length_minutes: Optional[int] = Field(default=None, ge=1)
    advance_booking_limit_days: Optional[int] = Field(default=None, ge=0)
    operating_start_time: Optional[time] = None
    operating_end_time: Optional[time] = None
    allow_overlap: Optional[bool] = None

    @model_validator(mode="after")
    def validate_time_window(self):
        if self.operating_start_time and self.operating_end_time:
            if self.operating_start_time >= self.operating_end_time:
                raise ValueError("operating_start_time must be earlier than operating_end_time.")
        return self


class AdminActionResult(BaseModel):
    success: bool
    reason: Optional[str] = None
    amenity_id: Optional[str] = None
    rule_id: Optional[str] = None


class UserBookingIntentRequest(BaseModel):
    intent: Literal["BOOK_AMENITY", "CANCEL_BOOKING"]
    building_id: str = Field(min_length=1)
    user_id: str = Field(min_length=1)
    amenity: str = Field(min_length=1)
    date: date
    time: time


class UserCancelBookingRequest(BaseModel):
    user_id: str = Field(min_length=1)
    building_id: Optional[str] = None


class AmenityListItem(BaseModel):
    amenity_id: str
    building_id: str
    name: str
    capacity: int
    is_active: bool


class AmenityListResponse(BaseModel):
    amenities: list[AmenityListItem]


class AmenitySlotAvailability(BaseModel):
    slot_start: time
    slot_end: time
    remaining_capacity: int
    max_capacity: int


class AmenityAvailabilityResponse(BaseModel):
    amenity_id: str
    building_id: str
    date: date
    slot_length_minutes: int
    slots: list[AmenitySlotAvailability]


class UserBookingItem(BaseModel):
    booking_id: str
    building_id: str
    amenity_id: str
    amenity_name: str
    user_id: Optional[str] = None
    status: str
    start_time: datetime
    end_time: datetime
    created_at: datetime


class UserBookingListResponse(BaseModel):
    bookings: list[UserBookingItem]
