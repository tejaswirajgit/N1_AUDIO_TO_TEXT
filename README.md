
# Voice Booking

Audio-to-text and intent extraction using Sarvam AI.

This project now supports both:
1. Local mic script (`live_asr.py`)
2. Production-style HTTP API (`api_server.py`)

## Requirements
- Python 3.10+
- Sarvam API key

Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment

Set API key (recommended for API mode):

```powershell
$env:SARVAM_API_KEY="your_key_here"
$env:VOICE_BOOKING_API_KEY="your_plugin_api_key_here"
```

`VOICE_BOOKING_API_KEY` is mandatory for all `/v1/*` routes.

## Run Local Script

```bash
python live_asr.py
```

This records from mic and saves extracted JSON to `booking_intent.json`.

## Run API Server

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Open docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### `GET /health/live`
Liveness probe.

### `GET /health/ready`
Readiness probe (checks API key availability).

### `POST /v1/transcribe`
Requires header:
- `X-API-Key: <VOICE_BOOKING_API_KEY>`

Multipart form:
- `file`: audio file
- `language_code` (optional, default `en-IN`)

Response:

```json
{
  "transcript": "..."
}
```

### `POST /v1/intent`
Requires header:
- `X-API-Key: <VOICE_BOOKING_API_KEY>`

JSON body:

```json
{
  "text": "hey i wanna book gym tomorrow at 5 pm"
}
```

Response:

```json
{
  "intent": "BOOK_AMENITY",
  "amenity": "gym",
  "date": "2026-02-19",
  "time": "17:00"
}
```

### `POST /v1/audio-to-intent`
Requires header:
- `X-API-Key: <VOICE_BOOKING_API_KEY>`

Multipart form:
- `file`: audio file
- `language_code` (optional, default `en-IN`)

Response:

```json
{
  "transcript": "...",
  "intent_json": {
    "intent": "BOOK_AMENITY",
    "amenity": "gym",
    "date": "2026-02-19",
    "time": "17:00"
  }
}
```

## Notes
- Max audio size for API upload is `25 MB`.
- If you get `401` auth errors, verify `SARVAM_API_KEY`.
- If you get `401 Invalid or missing API key`, verify `X-API-Key` and `VOICE_BOOKING_API_KEY`.
- `live_asr.py` currently has a default hardcoded key fallback. For production, prefer env-only keys.
