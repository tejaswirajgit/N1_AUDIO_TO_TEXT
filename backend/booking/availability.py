"""Availability checks for booking time ranges and capacity."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from booking.models import Booking

ACTIVE_STATUS = "BOOKED"


def overlap_query(*, amenity_id, start_time: datetime, end_time: datetime) -> Select:
    return select(Booking).where(
        Booking.amenity_id == amenity_id,
        Booking.status == ACTIVE_STATUS,
        Booking.start_time < end_time,
        Booking.end_time > start_time,
    )


def overlap_count(db: Session, *, amenity_id, start_time: datetime, end_time: datetime) -> int:
    stmt = (
        select(func.count())
        .select_from(Booking)
        .where(
            Booking.amenity_id == amenity_id,
            Booking.status == ACTIVE_STATUS,
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        )
    )
    return int(db.scalar(stmt) or 0)


def capacity_available(
    db: Session,
    *,
    amenity_id,
    start_time: datetime,
    end_time: datetime,
    max_capacity: int,
) -> bool:
    return overlap_count(
        db,
        amenity_id=amenity_id,
        start_time=start_time,
        end_time=end_time,
    ) < max_capacity


def split_into_slots(*, start_time: datetime, end_time: datetime, slot_length_minutes: int) -> list[tuple[datetime, datetime]]:
    slots: list[tuple[datetime, datetime]] = []
    cursor = start_time
    slot_delta = timedelta(minutes=slot_length_minutes)
    while cursor < end_time:
        next_cursor = cursor + slot_delta
        slots.append((cursor, next_cursor))
        cursor = next_cursor
    return slots


def slots_within_capacity(
    *,
    overlaps: Iterable[Booking],
    start_time: datetime,
    end_time: datetime,
    slot_length_minutes: int,
    max_capacity: int,
) -> bool:
    slots = split_into_slots(
        start_time=start_time,
        end_time=end_time,
        slot_length_minutes=slot_length_minutes,
    )
    overlap_list = list(overlaps)
    for slot_start, slot_end in slots:
        concurrent = sum(1 for booking in overlap_list if booking.start_time < slot_end and booking.end_time > slot_start)
        if concurrent >= max_capacity:
            return False
    return True
