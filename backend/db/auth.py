from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field


class AuthenticatedSupabaseUser(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    email: Optional[str] = None
    role: Optional[str] = None
    app_metadata: dict[str, Any] = Field(default_factory=dict)
    user_metadata: dict[str, Any] = Field(default_factory=dict)


def get_current_supabase_user(request: Request) -> AuthenticatedSupabaseUser:
    payload = getattr(request.state, "supabase_user", None)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid bearer token.",
        )
    return AuthenticatedSupabaseUser.model_validate(payload)
