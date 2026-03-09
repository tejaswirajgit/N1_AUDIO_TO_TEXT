from __future__ import annotations

from sqlalchemy import inspect
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import parse_qsl, urlsplit, urlunsplit

from config import get_settings

settings = get_settings()


def _supabase_database_url(raw_database_url: str) -> str:
    normalized = raw_database_url.lower()
    if not normalized.startswith("postgresql://") and not normalized.startswith("postgresql+psycopg2://"):
        return raw_database_url

    split = urlsplit(raw_database_url)
    existing = {k.lower() for k, _ in parse_qsl(split.query, keep_blank_values=True)}
    if "sslmode" in existing:
        return raw_database_url

    query = split.query + ("&" if split.query else "") + "sslmode=require"
    return urlunsplit((split.scheme, split.netloc, split.path, query, split.fragment))

engine = create_engine(
    _supabase_database_url(settings.database_url),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    """Bootstrap schema for environments without migrations."""
    from booking.models import Base

    Base.metadata.create_all(bind=engine)


def validate_db_compatibility() -> None:
    required_tables = {"buildings", "amenities", "amenity_rules", "bookings"}
    required_columns = {
        "amenity_rules": {"building_id", "created_at"},
    }

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    missing_tables = sorted(required_tables - existing_tables)

    missing_column_msgs: list[str] = []
    for table_name, columns in required_columns.items():
        if table_name not in existing_tables:
            continue
        existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
        missing_columns = sorted(columns - existing_columns)
        if missing_columns:
            missing_column_msgs.append(f"{table_name}: {', '.join(missing_columns)}")

    if not missing_tables and not missing_column_msgs:
        return

    details: list[str] = []
    if missing_tables:
        details.append(f"missing tables [{', '.join(missing_tables)}]")
    if missing_column_msgs:
        details.append(f"missing columns [{'; '.join(missing_column_msgs)}]")

    raise RuntimeError(
        "Database compatibility check failed: "
        + "; ".join(details)
        + ". Apply required migrations before starting the API."
    )
