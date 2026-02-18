
# Voice Booking (Audio to JSON)

Python script that:
1. Records microphone audio
2. Converts speech to text using Sarvam AI STT
3. Extracts booking intent as strict JSON
4. Saves output to `booking_intent.json`

## Files
- `live_asr.py`: main script
- `input.wav`: recorded audio (generated at runtime)
- `booking_intent.json`: extracted intent output (generated at runtime)

## Requirements
- Python 3.10+
- Working microphone
- Sarvam API key

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run

```bash
python live_asr.py
```

## API Key

`live_asr.py` currently supports:
- hardcoded `DEFAULT_API_KEY` (already present in code)
- optional environment override via `SARVAM_API_KEY`

PowerShell override example:

```powershell
$env:SARVAM_API_KEY="your_key_here"
python live_asr.py
```

## Output JSON Format

```json
{
  "intent": "BOOK_AMENITY | CANCEL_BOOKING | CHECK_AVAILABILITY",
  "amenity": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}
```

## Example

Input speech:
`hey i wanna book gym tomorrow at 5 pm`

Expected JSON shape:

```json
{
  "intent": "BOOK_AMENITY",
  "amenity": "gym",
  "date": "YYYY-MM-DD",
  "time": "17:00"
}
```

## Common Error

If you get:
`403 invalid_api_key_error`

Your key is invalid/revoked or not being passed correctly. Update `DEFAULT_API_KEY` in `live_asr.py` or set a valid `SARVAM_API_KEY`.
