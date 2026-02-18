import json
import os
import re
import sys
from datetime import datetime

import sounddevice as sd
from sarvamai import SarvamAI
from sarvamai.errors.forbidden_error import ForbiddenError
from scipy.io.wavfile import write

FS = 16000
SECONDS = 5
DEFAULT_API_KEY = "sk_t5lvafpk_L0KIjxovj4h1o9wkdqES8B05"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def record_audio(filename="input.wav"):
    print("\nRecording. Speak now...")
    audio = sd.rec(int(SECONDS * FS), samplerate=FS, channels=1)
    sd.wait()
    write(filename, FS, audio)
    print("Audio saved:", filename)


def get_client():
    api_key = os.getenv("SARVAM_API_KEY", DEFAULT_API_KEY)
    if api_key:
        api_key = api_key.strip().strip('"').strip("'")
    if not api_key:
        raise ValueError(
            "Missing API key. Set SARVAM_API_KEY or DEFAULT_API_KEY."
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
            "Check your key in SARVAM_API_KEY/default constant, rotate if needed."
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
  "intent": "BOOK_AMENITY | CANCEL_BOOKING | CHECK_AVAILABILITY",
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
        "amenity": data.get("amenity", ""),
        "date": data.get("date", ""),
        "time": data.get("time", ""),
    }


def save_intent_json(payload, filename="booking_intent.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print("JSON saved:", filename)


if __name__ == "__main__":
    client = get_client()
    record_audio()
    transcript = transcribe_audio(client)

    print("\nTranscribed Text:")
    print(transcript)

    intent_json = text_to_intent_json(transcript, client)
    print("\nIntent JSON:")
    print(json.dumps(intent_json, indent=2, ensure_ascii=False))

    save_intent_json(intent_json)
