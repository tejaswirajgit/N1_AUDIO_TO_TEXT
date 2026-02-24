from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    database_url: str
    supabase_url: str
    supabase_service_role_key: str
    voice_booking_api_key: str
    admin_api_key: str
    sarvam_api_key: str


def _get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip().strip('"').strip("'")
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name="Voice Booking API",
        app_version="2.0.0",
        database_url=_get_required_env("DATABASE_URL"),
        supabase_url=_get_required_env("SUPABASE_URL"),
        supabase_service_role_key=_get_required_env("SUPABASE_SERVICE_ROLE_KEY"),
        voice_booking_api_key=_get_required_env("VOICE_BOOKING_API_KEY"),
        admin_api_key=_get_required_env("ADMIN_API_KEY"),
        sarvam_api_key=os.getenv("SARVAM_API_KEY", "").strip().strip('"').strip("'"),
    )
