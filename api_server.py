from __future__ import annotations

import hmac
import json
import os
import re
from datetime import date, datetime, timezone
from typing import Literal, Optional
from zoneinfo import ZoneInfo

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sarvamai import SarvamAI
from sarvamai.errors.forbidden_error import ForbiddenError

from booking.availability import overlap_count, split_into_slots
from booking.engine import execute_booking, update_amenity_rules, upsert_amenity
from booking.models import Amenity, AmenityRule, Booking, Building
from booking.schema import (
    AmenityAvailabilityResponse,
    AmenityListItem,
    AmenityListResponse,
    AmenityRuleUpdateRequest,
    AmenitySlotAvailability,
    AmenityUpsertRequest,
    BookingIntent,
    BookingStatus,
    UserBookingIntentRequest,
    UserBookingItem,
    UserBookingListResponse,
    UserCancelBookingRequest,
)
from config import get_settings
from db.session import SessionLocal, validate_db_compatibility

settings = get_settings()

APP_NAME = settings.app_name
APP_VERSION = settings.app_version
MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024
DEFAULT_STT_MODEL = "saaras:v3"
DEFAULT_STT_MODE = "transcribe"
DEFAULT_LANGUAGE_CODE = "en-IN"
API_KEY_HEADER = "X-API-Key"
ADMIN_API_KEY_HEADER = "X-Admin-API-Key"


def get_client() -> SarvamAI:
    if not settings.sarvam_api_key:
        raise RuntimeError("Missing required environment variable: SARVAM_API_KEY")
    return SarvamAI(api_subscription_key=settings.sarvam_api_key)


def verify_api_key(x_api_key: Optional[str] = Header(default=None, alias=API_KEY_HEADER)):
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.voice_booking_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


def verify_admin_api_key(x_admin_api_key: Optional[str] = Header(default=None, alias=ADMIN_API_KEY_HEADER)):
    if not x_admin_api_key or not hmac.compare_digest(x_admin_api_key, settings.admin_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing admin API key.")


def extract_json_object(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        raise ValueError("Model response did not contain a JSON object.")
    return json.loads(match.group(0))


def _resolve_voice_identity(building_id: Optional[str], user_id: Optional[str]) -> tuple[str, str]:
    resolved_building_id = (building_id or os.getenv("VOICE_BOOKING_DEFAULT_BUILDING_ID", "")).strip()
    resolved_user_id = (user_id or os.getenv("VOICE_BOOKING_DEFAULT_USER_ID", "")).strip()
    if not resolved_building_id or not resolved_user_id:
        raise ValueError(
            "building_id and user_id are required. Provide them in the request or set "
            "VOICE_BOOKING_DEFAULT_BUILDING_ID and VOICE_BOOKING_DEFAULT_USER_ID."
        )
    return resolved_building_id, resolved_user_id


def map_intent(text: str, client: SarvamAI, *, building_id: str, user_id: str) -> dict:
    today = datetime.today().strftime("%Y-%m-%d")
    prompt = f"""
You are an intent extraction engine.

Convert the following sentence into STRICT JSON.
No explanations. No markdown.
Resolve relative dates like today/tomorrow using today's date: {today}.
If a field is missing, return an empty string.
Time must be 24-hour HH:MM format.

Sentence:
{text}

JSON format:
{{
  "intent": "BOOK_AMENITY | CANCEL_BOOKING",
  "building_id": "{building_id}",
  "user_id": "{user_id}",
  "amenity": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}}
"""

    response = client.chat.completions(
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    content = (
        response.choices[0].message.content
        if hasattr(response, "choices")
        else response["choices"][0]["message"]["content"]
    )
    payload = extract_json_object(content)

    raw_intent = str(payload.get("intent", "")).strip().upper()
    normalized_intent = {
        "BOOK": "BOOK_AMENITY",
        "BOOK_AMENITY": "BOOK_AMENITY",
        "CANCEL": "CANCEL_BOOKING",
        "CANCEL_BOOKING": "CANCEL_BOOKING",
    }.get(raw_intent, "")

    unified_payload = {
        "intent": normalized_intent,
        "building_id": payload.get("building_id") or building_id,
        "user_id": payload.get("user_id") or user_id,
        "amenity": payload.get("amenity", ""),
        "date": payload.get("date", ""),
        "time": payload.get("time", ""),
    }
    return UserBookingIntentRequest.model_validate(unified_payload).model_dump(mode="json")


def transcribe_audio_bytes(
    content: bytes,
    filename: str,
    content_type: Optional[str],
    client: SarvamAI,
    language_code: str,
) -> str:
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file too large. Max allowed is {MAX_AUDIO_SIZE_BYTES} bytes.",
        )

    file_name = filename or "audio.wav"
    result = client.speech_to_text.transcribe(
        file=(file_name, content, content_type or "application/octet-stream"),
        model=DEFAULT_STT_MODEL,
        mode=DEFAULT_STT_MODE,
        language_code=language_code,
    )
    transcript = result.transcript if hasattr(result, "transcript") else result["transcript"]
    return transcript.strip() if transcript else ""


class HealthResponse(BaseModel):
    status: Literal["ok", "error"]
    service: str
    version: str


class IntentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Natural language sentence")
    building_id: Optional[str] = None
    user_id: Optional[str] = None


class IntentResponse(BaseModel):
    intent: Literal["BOOK_AMENITY", "CANCEL_BOOKING"]
    building_id: str
    user_id: str
    amenity: str
    date: str
    time: str


class TranscribeResponse(BaseModel):
    transcript: str


class AudioToIntentResponse(BaseModel):
    transcript: str
    intent_json: IntentResponse


app = FastAPI(title=APP_NAME, version=APP_VERSION)


def _to_utc(dt: datetime, tz_name: str) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc)
    try:
        zone = ZoneInfo(tz_name)
    except Exception:
        zone = ZoneInfo("UTC")
    return dt.replace(tzinfo=zone).astimezone(timezone.utc)


@app.on_event("startup")
def startup_checks():
    _ = settings.voice_booking_api_key
    _ = settings.admin_api_key
    _ = settings.database_url
    _ = settings.supabase_url
    _ = settings.supabase_service_role_key
    validate_db_compatibility()


@app.exception_handler(ForbiddenError)
def handle_forbidden_error(_, exc: ForbiddenError):
    return JSONResponse(
        status_code=401,
        content={"detail": "Sarvam authentication failed. Verify SARVAM_API_KEY."},
    )


@app.get("/health/live", response_model=HealthResponse)
def health_live():
    return HealthResponse(status="ok", service=APP_NAME, version=APP_VERSION)


@app.get("/health/ready", response_model=HealthResponse)
def health_ready():
    try:
        validate_db_compatibility()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return HealthResponse(status="ok", service=APP_NAME, version=APP_VERSION)


@app.post("/v1/transcribe", response_model=TranscribeResponse, dependencies=[Depends(verify_api_key)])
async def transcribe(file: UploadFile = File(...), language_code: str = Form(DEFAULT_LANGUAGE_CODE)):
    try:
        client = get_client()
        content = await file.read()
        transcript = transcribe_audio_bytes(
            content=content,
            filename=file.filename or "audio.wav",
            content_type=file.content_type,
            client=client,
            language_code=language_code,
        )
    except ForbiddenError as exc:
        raise HTTPException(status_code=401, detail="Sarvam authentication failed. Verify SARVAM_API_KEY.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    return TranscribeResponse(transcript=transcript)


@app.post("/v1/intent", response_model=IntentResponse, dependencies=[Depends(verify_api_key)])
def extract_intent(request: IntentRequest):
    try:
        client = get_client()
        building_id, user_id = _resolve_voice_identity(request.building_id, request.user_id)
        intent_data = map_intent(
            request.text,
            client,
            building_id=building_id,
            user_id=user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ForbiddenError as exc:
        raise HTTPException(status_code=401, detail="Sarvam authentication failed. Verify SARVAM_API_KEY.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Intent extraction failed: {exc}") from exc
    return IntentResponse(**intent_data)


@app.post("/v1/audio-to-intent", response_model=AudioToIntentResponse, dependencies=[Depends(verify_api_key)])
async def audio_to_intent(
    file: UploadFile = File(...),
    language_code: str = Form(DEFAULT_LANGUAGE_CODE),
    building_id: Optional[str] = Form(default=None),
    user_id: Optional[str] = Form(default=None),
):
    try:
        client = get_client()
        resolved_building_id, resolved_user_id = _resolve_voice_identity(building_id, user_id)
        content = await file.read()
        transcript = transcribe_audio_bytes(
            content=content,
            filename=file.filename or "audio.wav",
            content_type=file.content_type,
            client=client,
            language_code=language_code,
        )
        intent_data = map_intent(
            transcript,
            client,
            building_id=resolved_building_id,
            user_id=resolved_user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ForbiddenError as exc:
        raise HTTPException(status_code=401, detail="Sarvam authentication failed. Verify SARVAM_API_KEY.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Audio-to-intent failed: {exc}") from exc

    return AudioToIntentResponse(transcript=transcript, intent_json=IntentResponse(**intent_data))


@app.post("/v1/bookings/execute", dependencies=[Depends(verify_api_key)])
def execute_booking_route(_request: BookingIntent):
    raise HTTPException(status_code=410, detail="Deprecated. Use POST /v1/bookings")


@app.get("/v1/amenities", response_model=AmenityListResponse, dependencies=[Depends(verify_api_key)])
def list_active_amenities(building_id: str):
    with SessionLocal() as db:
        stmt = (
            select(Amenity)
            .where(
                Amenity.building_id == building_id,
                Amenity.is_active.is_(True),
            )
            .order_by(Amenity.name.asc())
        )
        amenities = list(db.scalars(stmt))
        return AmenityListResponse(
            amenities=[
                AmenityListItem(
                    amenity_id=amenity.id,
                    building_id=amenity.building_id,
                    name=amenity.name,
                    capacity=amenity.capacity,
                    is_active=amenity.is_active,
                )
                for amenity in amenities
            ]
        )


@app.get(
    "/v1/amenities/{amenity_id}/availability",
    response_model=AmenityAvailabilityResponse,
    dependencies=[Depends(verify_api_key)],
)
def get_amenity_availability(amenity_id: str, building_id: str, day: date):
    with SessionLocal() as db:
        amenity = db.get(Amenity, amenity_id)
        if not amenity or not amenity.is_active:
            raise HTTPException(status_code=404, detail="Amenity not found or inactive.")
        if amenity.building_id != building_id:
            raise HTTPException(status_code=400, detail="Amenity and building_id do not match.")

        rule = db.scalar(select(AmenityRule).where(AmenityRule.amenity_id == amenity_id))
        if not rule:
            raise HTTPException(status_code=404, detail="Amenity rules are not configured.")

        building = db.get(Building, amenity.building_id)
        tz_name = building.timezone if building and building.timezone else "UTC"
        local_start = datetime.combine(day, rule.operating_start_time)
        local_end = datetime.combine(day, rule.operating_end_time)
        slots = split_into_slots(
            start_time=local_start,
            end_time=local_end,
            slot_length_minutes=rule.slot_length_minutes,
        )

        available_slots: list[AmenitySlotAvailability] = []
        for slot_start_local, slot_end_local in slots:
            slot_start_utc = _to_utc(slot_start_local, tz_name)
            slot_end_utc = _to_utc(slot_end_local, tz_name)
            active_count = overlap_count(
                db,
                amenity_id=amenity_id,
                start_time=slot_start_utc,
                end_time=slot_end_utc,
            )
            remaining = max(rule.max_capacity - active_count, 0)
            if remaining > 0:
                available_slots.append(
                    AmenitySlotAvailability(
                        slot_start=slot_start_local.time(),
                        slot_end=slot_end_local.time(),
                        remaining_capacity=remaining,
                        max_capacity=rule.max_capacity,
                    )
                )

        return AmenityAvailabilityResponse(
            amenity_id=amenity.id,
            building_id=amenity.building_id,
            date=day,
            slot_length_minutes=rule.slot_length_minutes,
            slots=available_slots,
        )


@app.post("/v1/bookings", dependencies=[Depends(verify_api_key)])
def create_booking(request: UserBookingIntentRequest):
    return JSONResponse(content=execute_booking(request.model_dump(mode="json")))


@app.post("/v1/bookings/{booking_id}/cancel", dependencies=[Depends(verify_api_key)])
def cancel_booking(booking_id: str, request: UserCancelBookingRequest):
    with SessionLocal() as db:
        booking = db.get(Booking, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if request.building_id and booking.building_id != request.building_id:
            raise HTTPException(status_code=403, detail="Booking does not belong to this building.")
        if booking.user_id != request.user_id:
            raise HTTPException(status_code=403, detail="Booking does not belong to this user.")

    payload = {
        "intent": "CANCEL_BOOKING",
        "booking_id": booking_id,
        "user_id": request.user_id,
        "building_id": request.building_id,
    }
    return JSONResponse(content=execute_booking(payload))


@app.get("/v1/bookings/my", response_model=UserBookingListResponse, dependencies=[Depends(verify_api_key)])
def my_bookings(user_id: str, building_id: Optional[str] = None):
    now_utc = datetime.now(timezone.utc)
    with SessionLocal() as db:
        stmt = (
            select(Booking, Amenity)
            .join(Amenity, Amenity.id == Booking.amenity_id)
            .where(
                Booking.user_id == user_id,
                Booking.status == BookingStatus.BOOKED.value,
                Booking.start_time >= now_utc,
            )
            .order_by(Booking.start_time.asc())
        )
        if building_id:
            stmt = stmt.where(Booking.building_id == building_id)

        rows = db.execute(stmt).all()
        return UserBookingListResponse(
            bookings=[
                UserBookingItem(
                    booking_id=str(booking.id),
                    building_id=booking.building_id,
                    amenity_id=booking.amenity_id,
                    amenity_name=amenity.name,
                    user_id=booking.user_id,
                    status=booking.status,
                    start_time=booking.start_time,
                    end_time=booking.end_time,
                    created_at=booking.created_at,
                )
                for booking, amenity in rows
            ]
        )


@app.get("/v1/bookings/history", response_model=UserBookingListResponse, dependencies=[Depends(verify_api_key)])
def booking_history(user_id: str, building_id: Optional[str] = None):
    now_utc = datetime.now(timezone.utc)
    with SessionLocal() as db:
        stmt = (
            select(Booking, Amenity)
            .join(Amenity, Amenity.id == Booking.amenity_id)
            .where(
                Booking.user_id == user_id,
                or_(
                    Booking.status == BookingStatus.CANCELLED.value,
                    Booking.end_time < now_utc,
                ),
            )
            .order_by(Booking.start_time.desc())
        )
        if building_id:
            stmt = stmt.where(Booking.building_id == building_id)

        rows = db.execute(stmt).all()
        return UserBookingListResponse(
            bookings=[
                UserBookingItem(
                    booking_id=str(booking.id),
                    building_id=booking.building_id,
                    amenity_id=booking.amenity_id,
                    amenity_name=amenity.name,
                    user_id=booking.user_id,
                    status=booking.status,
                    start_time=booking.start_time,
                    end_time=booking.end_time,
                    created_at=booking.created_at,
                )
                for booking, amenity in rows
            ]
        )


@app.post("/v1/admin/amenities", dependencies=[Depends(verify_admin_api_key)])
def admin_upsert_amenity(request: AmenityUpsertRequest):
    return JSONResponse(content=upsert_amenity(request.model_dump(mode="json")))


@app.post("/v1/admin/rules", dependencies=[Depends(verify_admin_api_key)])
def admin_update_rules(request: AmenityRuleUpdateRequest):
    return JSONResponse(content=update_amenity_rules(request.model_dump(mode="json")))
