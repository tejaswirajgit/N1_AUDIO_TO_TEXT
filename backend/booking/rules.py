"""Rule evaluation logic for amenity bookings."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from booking.models import AmenityRule


@dataclass
class RuleCheckResult:
    allowed: bool
    reason: str | None = None


class RuleEngine:
    @staticmethod
    def resolve_duration_minutes(requested: int | None, rule: AmenityRule) -> tuple[int, RuleCheckResult]:
        duration = requested or rule.slot_length_minutes

        if duration > rule.max_duration_minutes:
            return duration, RuleCheckResult(
                allowed=False,
                reason=f"Requested duration exceeds max_duration_minutes ({rule.max_duration_minutes}).",
            )

        if duration % rule.slot_length_minutes != 0:
            return duration, RuleCheckResult(
                allowed=False,
                reason=f"Duration must be a multiple of slot_length_minutes ({rule.slot_length_minutes}).",
            )

        return duration, RuleCheckResult(allowed=True)

    @staticmethod
    def compute_end_time(start_time: datetime, duration_minutes: int) -> datetime:
        return start_time + timedelta(minutes=duration_minutes)

    @staticmethod
    def check_advance_limit(start_time: datetime, rule: AmenityRule) -> RuleCheckResult:
        now_utc = datetime.now(timezone.utc)
        if start_time < now_utc:
            return RuleCheckResult(allowed=False, reason="Requested time is in the past.")

        latest_allowed = now_utc + timedelta(days=rule.advance_booking_limit_days)
        if start_time > latest_allowed:
            return RuleCheckResult(
                allowed=False,
                reason=(
                    "Requested time exceeds advance booking window "
                    f"({rule.advance_booking_limit_days} days)."
                ),
            )

        return RuleCheckResult(allowed=True)

    @staticmethod
    def check_operating_window(start_time: datetime, end_time: datetime, rule: AmenityRule) -> RuleCheckResult:
        requested_start = start_time.timetz().replace(tzinfo=None)
        requested_end = end_time.timetz().replace(tzinfo=None)

        if requested_start < rule.operating_start_time or requested_end > rule.operating_end_time:
            return RuleCheckResult(
                allowed=False,
                reason=(
                    "Requested time is outside operating hours "
                    f"({rule.operating_start_time.strftime('%H:%M')} - {rule.operating_end_time.strftime('%H:%M')})."
                ),
            )

        return RuleCheckResult(allowed=True)

    @staticmethod
    def check_slot_alignment(start_time: datetime, end_time: datetime, rule: AmenityRule) -> RuleCheckResult:
        anchor = datetime.combine(start_time.date(), rule.operating_start_time)
        slot_seconds = rule.slot_length_minutes * 60
        start_offset_seconds = int((start_time - anchor).total_seconds())
        end_offset_seconds = int((end_time - anchor).total_seconds())

        if start_offset_seconds < 0 or end_offset_seconds <= 0:
            return RuleCheckResult(allowed=False, reason="Requested time is outside slot boundaries.")

        if start_offset_seconds % slot_seconds != 0 or end_offset_seconds % slot_seconds != 0:
            return RuleCheckResult(
                allowed=False,
                reason=f"Booking must align with {rule.slot_length_minutes}-minute slot boundaries.",
            )

        return RuleCheckResult(allowed=True)
