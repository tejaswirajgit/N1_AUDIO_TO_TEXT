"""Pydantic schemas for booking and admin flows."""

from __future__ import annotations

from datetime import date as DateType, datetime as DateTimeType, time as TimeType
from enum import Enum
from typing import Literal, Optional
from uuid import UUID

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
    date: Optional[DateType] = None
    time: Optional[TimeType] = None
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
    booking_id: Optional[str | UUID] = None
    status: Optional[BookingStatus] = None
    amenity_id: Optional[str] = None
    start_time: Optional[DateTimeType] = None
    end_time: Optional[DateTimeType] = None
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
    operating_start_time: Optional[TimeType] = None
    operating_end_time: Optional[TimeType] = None
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


class AdminUserRole(str, Enum):
    ADMIN = "admin"
    RESIDENT = "resident"
    USER = "user"
    MANAGER = "manager"


class AdminUserCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    resident_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    phone: str = Field(min_length=1)
    apartment: str = Field(min_length=1)
    role: AdminUserRole = AdminUserRole.RESIDENT


class AdminUserItem(BaseModel):
    auth_user_id: str
    resident_id: str
    name: str
    email: str
    phone: str
    apartment: str
    role: str
    status: Literal["ACTIVE", "INVITED", "SUSPENDED", "INACTIVE"]
    created_at: Optional[DateTimeType] = None
    email_confirmed_at: Optional[DateTimeType] = None
    last_sign_in_at: Optional[DateTimeType] = None


class AdminUserListResponse(BaseModel):
    users: list[AdminUserItem]


class AdminUserCreateResponse(BaseModel):
    success: bool
    message: str
    temporary_password: str
    user: AdminUserItem


class AdminUserUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[str] = Field(default=None, min_length=3)
    phone: Optional[str] = Field(default=None, min_length=1)
    apartment: Optional[str] = Field(default=None, min_length=1)
    role: Optional[AdminUserRole] = None
    status: Optional[Literal["ACTIVE", "INVITED", "SUSPENDED", "INACTIVE"]] = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        if not any([self.name, self.email, self.phone, self.apartment, self.role, self.status]):
            raise ValueError("At least one field must be provided for update.")
        return self


class AdminUserUpdateResponse(BaseModel):
    success: bool
    message: str
    user: AdminUserItem


class AdminUserDeleteResponse(BaseModel):
    success: bool
    message: str
    user_id: str


class UserBookingIntentRequest(BaseModel):
    intent: Literal["BOOK_AMENITY", "CANCEL_BOOKING"]
    building_id: str = Field(min_length=1)
    user_id: str = Field(min_length=1)
    amenity: str = Field(min_length=1)
    date: DateType
    time: TimeType


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
    slot_start: TimeType
    slot_end: TimeType
    remaining_capacity: int
    max_capacity: int


class AmenityAvailabilityResponse(BaseModel):
    amenity_id: str
    building_id: str
    date: DateType
    slot_length_minutes: int
    slots: list[AmenitySlotAvailability]


class UserBookingItem(BaseModel):
    booking_id: str
    building_id: str
    amenity_id: str
    amenity_name: str
    user_id: Optional[str] = None
    status: str
    start_time: DateTimeType
    end_time: DateTimeType
    created_at: DateTimeType


class UserBookingListResponse(BaseModel):
    bookings: list[UserBookingItem]
