from booking.engine import execute_booking
from db.session import init_db, SessionLocal
from booking.models import User, Building, Amenity, AmenityRule
from sqlalchemy import select
from datetime import date, time, timedelta

# Initialize DB and seed test data
init_db()
with SessionLocal() as db:
    with db.begin():
        # Upsert user
        existing_u = db.get(User, "user1")
        if not existing_u:
            u = User(id="user1", email="user1@example.com", full_name="Test User")
            db.add(u)
            db.flush()

        # Upsert building
        existing_b = db.get(Building, "b1")
        if not existing_b:
            b = Building(id="b1", name="Test Building", timezone="UTC")
            db.add(b)
            db.flush()

        # Upsert amenity
        stmt = select(Amenity).where(Amenity.id == "amen1")
        existing_a = db.scalar(stmt)
        if not existing_a:
            a = Amenity(id="amen1", building_id="b1", name="Gym", capacity=2, is_active=True)
            db.add(a)
            db.flush()

        # Upsert amenity rule by amenity_id (unique constraint)
        stmt = select(AmenityRule).where(AmenityRule.amenity_id == "amen1")
        existing_r = db.scalar(stmt)
        if existing_r:
            existing_r.max_capacity = 2
            existing_r.max_duration_minutes = 60
            existing_r.slot_length_minutes = 30
            existing_r.advance_booking_limit_days = 2
            existing_r.operating_start_time = time(6, 0)
            existing_r.operating_end_time = time(22, 0)
            existing_r.allow_overlap = False
            db.add(existing_r)
        else:
            r = AmenityRule(
                building_id="b1",
                amenity_id="amen1",
                max_capacity=2,
                max_duration_minutes=60,
                slot_length_minutes=30,
                advance_booking_limit_days=2,
                operating_start_time=time(6, 0),
                operating_end_time=time(22, 0),
                allow_overlap=False,
            )
            db.add(r)

# Prepare intent
intent = {
    "intent": "BOOK",
    "amenity": "Gym",
    "date": (date.today() + timedelta(days=1)).isoformat(),
    "time": "10:00",
    "building_id": "b1",
    "user_id": "user1",
}

result = execute_booking(intent)
print(result)
