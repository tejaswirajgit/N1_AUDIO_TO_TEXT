from booking.engine import execute_booking
from db.session import init_db, SessionLocal
from booking.models import Building, Amenity, AmenityRule
from sqlalchemy import select

# Initialize DB and seed test data
init_db()
with SessionLocal() as db:
    with db.begin():
        # Upsert building
        existing_b = db.get(Building, "b1")
        if not existing_b:
            b = Building(id="b1", name="Test Building", is_active=True)
            db.add(b)

        # Upsert amenity
        stmt = select(Amenity).where(Amenity.id == "amen1")
        existing_a = db.scalar(stmt)
        if not existing_a:
            a = Amenity(id="amen1", building_id="b1", name="Gym", slug="gym", is_active=True)
            db.add(a)

        # Upsert amenity rule by amenity_id (unique constraint)
        stmt = select(AmenityRule).where(AmenityRule.amenity_id == "amen1")
        existing_r = db.scalar(stmt)
        if existing_r:
            existing_r.max_capacity = 2
            existing_r.booking_duration_minutes = 60
            existing_r.advance_booking_limit_hours = 48
            existing_r.operating_hours = {"start": "06:00", "end": "22:00"}
            existing_r.allow_overlap = False
            db.add(existing_r)
        else:
            r = AmenityRule(
                amenity_id="amen1",
                max_capacity=2,
                booking_duration_minutes=60,
                advance_booking_limit_hours=48,
                operating_hours={"start": "06:00", "end": "22:00"},
                allow_overlap=False,
            )
            db.add(r)

# Prepare intent
intent = {
    "intent": "BOOK",
    "amenity": "Gym",
    "date": "2026-02-21",
    "time": "10:00",
    "building_id": "b1",
    "user_id": "user1",
}

result = execute_booking(intent)
print(result)
