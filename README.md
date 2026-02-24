# Amenity Booking Engine (Voice + API)

Production-oriented booking backend using FastAPI + SQLAlchemy on Supabase Postgres.

- Voice is an input channel, not a separate booking system.
- Booking engine is the single source of truth for booking writes and rule enforcement.
- Admin APIs configure amenities/rules.
- User APIs consume availability and bookings.

## Requirements
- Python 3.10+
- Supabase Postgres
- Sarvam AI API key

Install:

```bash
pip install -r requirements.txt
```

## Environment

Create `.env` from `.env.example`:

```env
ADMIN_API_KEY=your_admin_api_key_here
VOICE_BOOKING_API_KEY=your_voice_booking_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
VOICE_BOOKING_DEFAULT_BUILDING_ID=your_default_building_id
VOICE_BOOKING_DEFAULT_USER_ID=your_default_user_id
VOICE_BOOKING_API_BASE_URL=http://localhost:8000
```

Auth headers:
- User routes: `X-API-Key: <VOICE_BOOKING_API_KEY>`
- Admin routes: `X-Admin-API-Key: <ADMIN_API_KEY>`

## Run

API server:

```bash
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Voice client:

```bash
python live_asr.py
```

OpenAPI:
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Booking Contract (Voice and UI)

Both voice and UI must use the same booking payload:

```json
{
  "intent": "BOOK_AMENITY | CANCEL_BOOKING",
  "building_id": "string",
  "user_id": "string",
  "amenity": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}
```

`POST /v1/bookings` is the canonical booking write endpoint.

## Health and Compatibility

- `GET /health/live`
- `GET /health/ready`

Startup and readiness perform DB compatibility checks (read-only):
- required tables: `buildings`, `amenities`, `amenity_rules`, `bookings`
- required columns: `amenity_rules.building_id`, `amenity_rules.created_at`

## User APIs (`X-API-Key`)

- `GET /v1/amenities?building_id=...`
- `GET /v1/amenities/{amenity_id}/availability?building_id=...&day=YYYY-MM-DD`
- `POST /v1/bookings`
- `POST /v1/bookings/{booking_id}/cancel`
- `GET /v1/bookings/my?user_id=...&building_id=...`
- `GET /v1/bookings/history?user_id=...&building_id=...`

## Voice Helper APIs (`X-API-Key`)

- `POST /v1/transcribe`
- `POST /v1/intent`
  - accepts `text`, optional `building_id`, `user_id`
  - returns unified booking contract
- `POST /v1/audio-to-intent`
  - accepts audio + optional `building_id`, `user_id`
  - returns transcript + unified booking contract

## Admin APIs (`X-Admin-API-Key`)

- `POST /v1/admin/amenities`
- `POST /v1/admin/rules`

## Deprecated Route

- `POST /v1/bookings/execute` returns `410 Gone`
  - message: `Deprecated. Use POST /v1/bookings`

## Notes

- Max upload size for audio endpoints: `25 MB`.
- No secrets are hardcoded; all secrets are env-based.
