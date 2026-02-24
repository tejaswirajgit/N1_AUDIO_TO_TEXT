import json
import os
import re
import sys
from datetime import datetime
from urllib import error, request as urllib_request

from dotenv import load_dotenv
import sounddevice as sd
from sarvamai import SarvamAI
from sarvamai.errors.forbidden_error import ForbiddenError
from scipy.io.wavfile import write

load_dotenv()

FS = 16000
SECONDS = 5

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def record_audio(filename="input.wav"):
    print("\nRecording. Speak now...")
    audio = sd.rec(int(SECONDS * FS), samplerate=FS, channels=1)
    sd.wait()
    write(filename, FS, audio)
    print("Audio saved:", filename)


def get_client():
    api_key = os.getenv("SARVAM_API_KEY", "").strip().strip('"').strip("'")
    if not api_key:
        raise ValueError(
            "Missing required environment variable: SARVAM_API_KEY"
        )
    return SarvamAI(api_subscription_key=api_key)


def transcribe_audio(client, filename="input.wav"):
    try:
        with open(filename, "rb") as audio_file:
            result = client.speech_to_text.transcribe(
                file=audio_file,
                model="saaras:v3",
                mode="transcribe",
            )
    except ForbiddenError as exc:
        raise RuntimeError(
            "Sarvam authentication failed (403 invalid_api_key_error). "
            "Check your key in SARVAM_API_KEY and rotate if needed."
        ) from exc
    return result.transcript if hasattr(result, "transcript") else result["transcript"]


def _extract_json_object(raw_text):
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        raise ValueError("Model response did not contain a JSON object.")

    return json.loads(match.group(0))


def text_to_intent_json(text, client):
    today = datetime.today().strftime("%Y-%m-%d")
    prompt = f"""
You are an intent extraction engine.

Convert the following sentence into STRICT JSON.
No explanations. No markdown.
Resolve relative dates like today/tomorrow using today's date: {today}.
If a field is missing, return an empty string.

Sentence:
{text}

JSON format:
{{
  "intent": "BOOK_AMENITY | CANCEL_BOOKING",
  "building_id": "string",
  "user_id": "string",
  "amenity": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}}
"""

    resp = client.chat.completions(
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )

    content = (
        resp.choices[0].message.content
        if hasattr(resp, "choices")
        else resp["choices"][0]["message"]["content"]
    )
    data = _extract_json_object(content)

    return {
        "intent": data.get("intent", ""),
        "building_id": data.get("building_id", ""),
        "user_id": data.get("user_id", ""),
        "amenity": data.get("amenity", ""),
        "date": data.get("date", ""),
        "time": data.get("time", ""),
    }


def post_booking_intent(intent_payload):
    api_base = os.getenv("VOICE_BOOKING_API_BASE_URL", "http://localhost:8000").rstrip("/")
    api_key = os.getenv("VOICE_BOOKING_API_KEY", "").strip().strip('"').strip("'")
    default_building_id = os.getenv("VOICE_BOOKING_DEFAULT_BUILDING_ID", "").strip().strip('"').strip("'")
    default_user_id = os.getenv("VOICE_BOOKING_DEFAULT_USER_ID", "").strip().strip('"').strip("'")

    payload = dict(intent_payload)
    if not payload.get("building_id"):
        payload["building_id"] = default_building_id
    if not payload.get("user_id"):
        payload["user_id"] = default_user_id

    if not api_key:
        raise RuntimeError("Missing required environment variable: VOICE_BOOKING_API_KEY")
    if not payload.get("building_id") or not payload.get("user_id"):
        raise RuntimeError(
            "Intent is missing building_id/user_id. Set them in speech or configure "
            "VOICE_BOOKING_DEFAULT_BUILDING_ID and VOICE_BOOKING_DEFAULT_USER_ID."
        )

    endpoint = f"{api_base}/v1/bookings"
    body = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        },
    )

    try:
        with urllib_request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Booking API request failed ({exc.code}): {detail}") from exc


if __name__ == "__main__":
    client = get_client()
    record_audio()
    transcript = transcribe_audio(client)

    print("\nTranscribed Text:")
    print(transcript)

    intent_json = text_to_intent_json(transcript, client)
    print("\nIntent JSON:")
    print(json.dumps(intent_json, indent=2, ensure_ascii=False))

    booking_response = post_booking_intent(intent_json)
    print("\nBooking API Response:")
    print(json.dumps(booking_response, indent=2, ensure_ascii=False))
