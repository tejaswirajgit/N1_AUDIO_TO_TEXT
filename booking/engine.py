"""Core booking execution and admin update operations."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from booking.availability import overlap_query, slots_within_capacity
from booking.models import Amenity, AmenityRule, Booking, Building
from booking.rules import RuleEngine
from booking.schema import (
    AdminActionResult,
    AmenityRuleUpdateRequest,
    AmenityUpsertRequest,
    BookingIntent,
    BookingResult,
    BookingStatus,
    IntentType,
)
from db.session import SessionLocal


def _to_utc(dt: datetime, tz_name: str) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc)

    try:
        zone = ZoneInfo(tz_name)
    except Exception:
        zone = ZoneInfo("UTC")

    return dt.replace(tzinfo=zone).astimezone(timezone.utc)


def _resolve_amenity(db, *, amenity_name: str, building_id=None) -> Amenity | None:
    stmt = select(Amenity).where(
        func.lower(Amenity.name) == amenity_name.lower(),
        Amenity.is_active.is_(True),
    )
    if building_id:
        stmt = stmt.where(Amenity.building_id == building_id)
    return db.scalar(stmt.with_for_update())


def _load_rule(db, amenity_id) -> AmenityRule | None:
    return db.scalar(select(AmenityRule).where(AmenityRule.amenity_id == amenity_id))


def _load_building(db, building_id) -> Building | None:
    return db.get(Building, building_id) if building_id else None


def _run_availability_checks(
    db,
    *,
    amenity: Amenity,
    rule: AmenityRule,
    start_time: datetime,
    end_time: datetime,
    user_id: str | None = None,
    lock_rows: bool = False,
) -> tuple[bool, str | None]:
    stmt = overlap_query(amenity_id=amenity.id, start_time=start_time, end_time=end_time)
    if lock_rows:
        stmt = stmt.with_for_update()

    overlaps = list(db.scalars(stmt))

    if user_id and any(existing.user_id == user_id for existing in overlaps):
        return False, "User already has an overlapping booking for this amenity."

    if not slots_within_capacity(
        overlaps=overlaps,
        start_time=start_time,
        end_time=end_time,
        slot_length_minutes=rule.slot_length_minutes,
        max_capacity=rule.max_capacity,
    ):
        return False, "No capacity available for one or more requested slots."

    return True, None


def _create_booking(intent_model: BookingIntent) -> dict[str, Any]:
    with SessionLocal() as db:
        try:
            with db.begin():
                if not intent_model.amenity or intent_model.date is None or intent_model.time is None:
                    return BookingResult(success=False, reason="Missing amenity/date/time for booking intent.").model_dump(mode="json")
                amenity = _resolve_amenity(db, amenity_name=intent_model.amenity, building_id=intent_model.building_id)
                if not amenity:
                    return BookingResult(success=False, reason="Amenity not found or inactive.").model_dump(mode="json")

                rule = _load_rule(db, amenity.id)
                if not rule:
                    return BookingResult(success=False, reason="Amenity rules are not configured.").model_dump(mode="json")

                building = _load_building(db, amenity.building_id)
                tz_name = building.timezone if building else "UTC"

                requested_start_local = datetime.combine(intent_model.date, intent_model.time)
                requested_start = _to_utc(requested_start_local, tz_name)

                duration, duration_check = RuleEngine.resolve_duration_minutes(intent_model.duration_minutes, rule)
                if not duration_check.allowed:
                    return BookingResult(success=False, reason=duration_check.reason).model_dump(mode="json")

                requested_end_local = RuleEngine.compute_end_time(requested_start_local, duration)
                requested_end = _to_utc(requested_end_local, tz_name)

                advance_check = RuleEngine.check_advance_limit(requested_start, rule)
                if not advance_check.allowed:
                    return BookingResult(success=False, reason=advance_check.reason).model_dump(mode="json")

                hours_check = RuleEngine.check_operating_window(requested_start_local, requested_end_local, rule)
                if not hours_check.allowed:
                    return BookingResult(success=False, reason=hours_check.reason).model_dump(mode="json")

                slot_alignment_check = RuleEngine.check_slot_alignment(requested_start_local, requested_end_local, rule)
                if not slot_alignment_check.allowed:
                    return BookingResult(success=False, reason=slot_alignment_check.reason).model_dump(mode="json")

                available, reason = _run_availability_checks(
                    db,
                    amenity=amenity,
                    rule=rule,
                    start_time=requested_start,
                    end_time=requested_end,
                    user_id=intent_model.user_id,
                    lock_rows=True,
                )
                if not available:
                    return BookingResult(success=False, reason=reason).model_dump(mode="json")

                booking = Booking(
                    building_id=amenity.building_id,
                    amenity_id=amenity.id,
                    user_id=intent_model.user_id,
                    start_time=requested_start,
                    end_time=requested_end,
                    status=BookingStatus.BOOKED.value,
                )
                db.add(booking)
                db.flush()

                return BookingResult(
                    success=True,
                    booking_id=booking.id,
                    status=BookingStatus.BOOKED,
                    amenity_id=amenity.id,
                    start_time=booking.start_time,
                    end_time=booking.end_time,
                    available=True,
                ).model_dump(mode="json")
        except SQLAlchemyError:
            db.rollback()
            return BookingResult(success=False, reason="Database error while creating booking.").model_dump(mode="json")


def _cancel_booking(intent_model: BookingIntent) -> dict[str, Any]:
    with SessionLocal() as db:
        try:
            with db.begin():
                booking: Booking | None = None

                if intent_model.booking_id:
                    booking = db.get(Booking, intent_model.booking_id)
                    if booking and intent_model.user_id and booking.user_id != intent_model.user_id:
                        return BookingResult(success=False, reason="Booking does not belong to this user.").model_dump(mode="json")
                else:
                    if not intent_model.amenity or intent_model.date is None or intent_model.time is None:
                        return BookingResult(success=False, reason="Missing amenity/date/time for cancel intent.").model_dump(mode="json")
                    amenity = _resolve_amenity(db, amenity_name=intent_model.amenity, building_id=intent_model.building_id)
                    if not amenity:
                        return BookingResult(success=False, reason="Amenity not found.").model_dump(mode="json")

                    building = _load_building(db, amenity.building_id)
                    tz_name = building.timezone if building else "UTC"
                    requested_start = _to_utc(datetime.combine(intent_model.date, intent_model.time), tz_name)

                    stmt = (
                        select(Booking)
                        .where(
                            Booking.amenity_id == amenity.id,
                            Booking.start_time == requested_start,
                            Booking.status == BookingStatus.BOOKED.value,
                        )
                        .order_by(Booking.created_at.desc())
                        .with_for_update()
                    )
                    if intent_model.user_id:
                        stmt = stmt.where(Booking.user_id == intent_model.user_id)
                    booking = db.scalar(stmt)

                if not booking:
                    return BookingResult(success=False, reason="Booking not found.").model_dump(mode="json")

                if booking.status == BookingStatus.CANCELLED.value:
                    return BookingResult(success=False, reason="Booking already cancelled.").model_dump(mode="json")

                booking.status = BookingStatus.CANCELLED.value
                db.flush()

                return BookingResult(
                    success=True,
                    booking_id=booking.id,
                    status=BookingStatus.CANCELLED,
                    amenity_id=booking.amenity_id,
                    start_time=booking.start_time,
                    end_time=booking.end_time,
                    available=True,
                ).model_dump(mode="json")
        except SQLAlchemyError:
            db.rollback()
            return BookingResult(success=False, reason="Database error while cancelling booking.").model_dump(mode="json")


def _check_availability(intent_model: BookingIntent) -> dict[str, Any]:
    with SessionLocal() as db:
        if not intent_model.amenity or intent_model.date is None or intent_model.time is None:
            return BookingResult(success=False, reason="Missing amenity/date/time for availability intent.", available=False).model_dump(mode="json")
        amenity = _resolve_amenity(db, amenity_name=intent_model.amenity, building_id=intent_model.building_id)
        if not amenity:
            return BookingResult(success=False, reason="Amenity not found or inactive.", available=False).model_dump(mode="json")

        rule = _load_rule(db, amenity.id)
        if not rule:
            return BookingResult(success=False, reason="Amenity rules are not configured.", available=False).model_dump(mode="json")

        building = _load_building(db, amenity.building_id)
        tz_name = building.timezone if building else "UTC"
        requested_start_local = datetime.combine(intent_model.date, intent_model.time)
        requested_start = _to_utc(requested_start_local, tz_name)

        duration, duration_check = RuleEngine.resolve_duration_minutes(intent_model.duration_minutes, rule)
        if not duration_check.allowed:
            return BookingResult(success=False, reason=duration_check.reason, available=False).model_dump(mode="json")

        requested_end_local = RuleEngine.compute_end_time(requested_start_local, duration)
        requested_end = _to_utc(requested_end_local, tz_name)

        advance_check = RuleEngine.check_advance_limit(requested_start, rule)
        if not advance_check.allowed:
            return BookingResult(success=False, reason=advance_check.reason, available=False).model_dump(mode="json")

        hours_check = RuleEngine.check_operating_window(requested_start_local, requested_end_local, rule)
        if not hours_check.allowed:
            return BookingResult(success=False, reason=hours_check.reason, available=False).model_dump(mode="json")

        slot_alignment_check = RuleEngine.check_slot_alignment(requested_start_local, requested_end_local, rule)
        if not slot_alignment_check.allowed:
            return BookingResult(success=False, reason=slot_alignment_check.reason, available=False).model_dump(mode="json")

        available, reason = _run_availability_checks(
            db,
            amenity=amenity,
            rule=rule,
            start_time=requested_start,
            end_time=requested_end,
            user_id=intent_model.user_id,
        )

        return BookingResult(
            success=available,
            reason=reason,
            amenity_id=amenity.id,
            start_time=requested_start,
            end_time=requested_end,
            available=available,
        ).model_dump(mode="json")


def execute_booking(intent: dict) -> dict:
    try:
        intent_model = BookingIntent.model_validate(intent)
    except Exception as exc:
        return BookingResult(success=False, reason=f"Invalid intent payload: {exc}", available=False).model_dump(mode="json")

    if intent_model.intent in (IntentType.CANCEL, IntentType.CANCEL_BOOKING):
        return _cancel_booking(intent_model)

    if intent_model.intent == IntentType.CHECK_AVAILABILITY:
        return _check_availability(intent_model)

    if intent_model.intent in (IntentType.BOOK, IntentType.BOOK_AMENITY):
        return _create_booking(intent_model)

    return BookingResult(success=False, reason="Unsupported intent.", available=False).model_dump(mode="json")


def upsert_amenity(payload: dict) -> dict:
    try:
        model = AmenityUpsertRequest.model_validate(payload)
    except Exception as exc:
        return AdminActionResult(success=False, reason=f"Invalid amenity payload: {exc}").model_dump(mode="json")

    with SessionLocal() as db:
        try:
            with db.begin():
                building = db.get(Building, model.building_id)
                if not building:
                    return AdminActionResult(success=False, reason="Building not found.").model_dump(mode="json")

                amenity = db.get(Amenity, model.amenity_id) if model.amenity_id else None
                if amenity:
                    if amenity.building_id != model.building_id:
                        return AdminActionResult(
                            success=False,
                            reason="Amenity belongs to a different building.",
                        ).model_dump(mode="json")
                    amenity.name = model.name
                    if model.capacity is not None:
                        amenity.capacity = model.capacity
                    amenity.is_active = model.is_active
                else:
                    amenity = Amenity(
                        id=str(uuid.uuid4()),
                        building_id=model.building_id,
                        name=model.name,
                        capacity=model.capacity or 1,
                        is_active=model.is_active,
                    )
                    db.add(amenity)

                db.flush()
                return AdminActionResult(success=True, amenity_id=amenity.id).model_dump(mode="json")
        except SQLAlchemyError:
            db.rollback()
            return AdminActionResult(success=False, reason="Database error while upserting amenity.").model_dump(mode="json")


def update_amenity_rules(payload: dict) -> dict:
    try:
        model = AmenityRuleUpdateRequest.model_validate(payload)
    except Exception as exc:
        return AdminActionResult(success=False, reason=f"Invalid rule payload: {exc}").model_dump(mode="json")

    with SessionLocal() as db:
        try:
            with db.begin():
                amenity = db.get(Amenity, model.amenity_id)
                if not amenity:
                    return AdminActionResult(success=False, reason="Amenity not found.").model_dump(mode="json")
                if model.building_id and model.building_id != amenity.building_id:
                    return AdminActionResult(
                        success=False,
                        reason="Amenity and building_id do not match.",
                    ).model_dump(mode="json")

                rule = _load_rule(db, model.amenity_id)
                if not rule:
                    rule = AmenityRule(
                        amenity_id=model.amenity_id,
                        building_id=amenity.building_id,
                    )
                    db.add(rule)
                else:
                    rule.building_id = amenity.building_id

                if model.max_capacity is not None:
                    rule.max_capacity = model.max_capacity
                if model.max_duration_minutes is not None:
                    rule.max_duration_minutes = model.max_duration_minutes
                if model.slot_length_minutes is not None:
                    rule.slot_length_minutes = model.slot_length_minutes
                if model.advance_booking_limit_days is not None:
                    rule.advance_booking_limit_days = model.advance_booking_limit_days
                if model.operating_start_time is not None:
                    rule.operating_start_time = model.operating_start_time
                if model.operating_end_time is not None:
                    rule.operating_end_time = model.operating_end_time
                if model.allow_overlap is not None:
                    rule.allow_overlap = model.allow_overlap
                if rule.max_duration_minutes < rule.slot_length_minutes:
                    return AdminActionResult(
                        success=False,
                        reason="max_duration_minutes must be greater than or equal to slot_length_minutes.",
                    ).model_dump(mode="json")
                if rule.max_duration_minutes % rule.slot_length_minutes != 0:
                    return AdminActionResult(
                        success=False,
                        reason="max_duration_minutes must be a multiple of slot_length_minutes.",
                    ).model_dump(mode="json")
                if rule.operating_start_time >= rule.operating_end_time:
                    return AdminActionResult(
                        success=False,
                        reason="operating_start_time must be earlier than operating_end_time.",
                    ).model_dump(mode="json")

                db.flush()
                return AdminActionResult(success=True, amenity_id=amenity.id, rule_id=rule.id).model_dump(mode="json")
        except SQLAlchemyError:
            db.rollback()
            return AdminActionResult(success=False, reason="Database error while updating rules.").model_dump(mode="json")
