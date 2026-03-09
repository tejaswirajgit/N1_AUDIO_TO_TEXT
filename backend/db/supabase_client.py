from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from config import get_settings


class SupabaseTokenVerificationError(Exception):
    """Raised when a Supabase access token cannot be verified."""


@lru_cache
def get_supabase_anon_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_service_client() -> Client:
    # Service role key must only be used server-side.
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def verify_supabase_jwt(access_token: str) -> dict[str, Any]:
    try:
        response = get_supabase_anon_client().auth.get_user(access_token)
    except Exception as exc:
        raise SupabaseTokenVerificationError("Invalid or expired Supabase token.") from exc

    user = getattr(response, "user", None)
    if user is None:
        raise SupabaseTokenVerificationError("Unable to resolve user from Supabase token.")

    if hasattr(user, "model_dump"):
        return user.model_dump()
    if isinstance(user, dict):
        return user

    raise SupabaseTokenVerificationError("Unexpected Supabase user payload format.")
