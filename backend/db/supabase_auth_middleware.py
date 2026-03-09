from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from db.supabase_client import SupabaseTokenVerificationError, verify_supabase_jwt


class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        request.state.supabase_user = None

        authorization = request.headers.get("Authorization", "").strip()
        if not authorization:
            return await call_next(request)

        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authorization header. Expected Bearer token."},
            )

        try:
            request.state.supabase_user = verify_supabase_jwt(token.strip())
        except SupabaseTokenVerificationError as exc:
            return JSONResponse(status_code=401, content={"detail": str(exc)})

        return await call_next(request)
