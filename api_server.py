import json
import hmac
import os
import re
from datetime import datetime
from typing import Literal, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from sarvamai import SarvamAI
from sarvamai.errors.forbidden_error import ForbiddenError

load_dotenv()

APP_NAME = "Voice Booking API"
APP_VERSION = "1.0.0"
MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024
DEFAULT_STT_MODEL = "saaras:v3"
DEFAULT_STT_MODE = "transcribe"
DEFAULT_LANGUAGE_CODE = "en-IN"
API_KEY_HEADER = "X-API-Key"


def get_required_env(var_name: str) -> str:
    value = os.getenv(var_name, "").strip().strip('"').strip("'")
    if not value:
        raise RuntimeError(f"Missing required environment variable: {var_name}")
    return value


def get_client() -> SarvamAI:
    api_key = get_required_env("SARVAM_API_KEY")
    return SarvamAI(api_subscription_key=api_key)


def verify_api_key(x_api_key: Optional[str] = Header(default=None, alias=API_KEY_HEADER)):
    expected_api_key = get_required_env("VOICE_BOOKING_API_KEY")
    if not x_api_key or not hmac.compare_digest(x_api_key, expected_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


def extract_json_object(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        raise ValueError("Model response did not contain a JSON object.")
    return json.loads(match.group(0))


def map_intent(text: str, client: SarvamAI) -> dict:
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
  "intent": "BOOK_AMENITY | CANCEL_BOOKING | CHECK_AVAILABILITY",
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
    return {
        "intent": payload.get("intent", ""),
        "amenity": payload.get("amenity", ""),
        "date": payload.get("date", ""),
        "time": payload.get("time", ""),
    }


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
    transcript = (
        result.transcript if hasattr(result, "transcript") else result["transcript"]
    )
    return transcript.strip() if transcript else ""


class HealthResponse(BaseModel):
    status: Literal["ok", "error"]
    service: str
    version: str


class IntentRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Natural language sentence")


class IntentResponse(BaseModel):
    intent: str
    amenity: str
    date: str
    time: str


class TranscribeResponse(BaseModel):
    transcript: str


class AudioToIntentResponse(BaseModel):
    transcript: str
    intent_json: IntentResponse


app = FastAPI(title=APP_NAME, version=APP_VERSION)


@app.on_event("startup")
def validate_env_on_startup():
    get_required_env("SARVAM_API_KEY")
    get_required_env("VOICE_BOOKING_API_KEY")


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
        get_client()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return HealthResponse(status="ok", service=APP_NAME, version=APP_VERSION)


@app.post("/v1/transcribe", response_model=TranscribeResponse)
async def transcribe(
    file: UploadFile = File(...),
    language_code: str = Form(DEFAULT_LANGUAGE_CODE),
    _auth: None = Depends(verify_api_key),
):
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
        raise HTTPException(
            status_code=401,
            detail="Sarvam authentication failed. Verify SARVAM_API_KEY.",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    return TranscribeResponse(transcript=transcript)


@app.post("/v1/intent", response_model=IntentResponse)
def extract_intent(
    request: IntentRequest,
    _auth: None = Depends(verify_api_key),
):
    try:
        client = get_client()
        intent_data = map_intent(request.text, client)
    except ForbiddenError as exc:
        raise HTTPException(
            status_code=401,
            detail="Sarvam authentication failed. Verify SARVAM_API_KEY.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Intent extraction failed: {exc}") from exc
    return IntentResponse(**intent_data)


@app.post("/v1/audio-to-intent", response_model=AudioToIntentResponse)
async def audio_to_intent(
    file: UploadFile = File(...),
    language_code: str = Form(DEFAULT_LANGUAGE_CODE),
    _auth: None = Depends(verify_api_key),
):
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
        intent_data = map_intent(transcript, client)
    except ForbiddenError as exc:
        raise HTTPException(
            status_code=401,
            detail="Sarvam authentication failed. Verify SARVAM_API_KEY.",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Audio-to-intent failed: {exc}") from exc

    return AudioToIntentResponse(
        transcript=transcript,
        intent_json=IntentResponse(**intent_data),
    )
