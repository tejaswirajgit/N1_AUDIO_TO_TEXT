import sounddevice as sd
from scipy.io.wavfile import write
import whisper
import re
from datetime import datetime, timedelta

FS = 16000
SECONDS = 5

print("🔄 Loading Whisper model...")
model = whisper.load_model("small")
print("✅ Model loaded.")

# ------------------
# Record Audio
# ------------------
def record_audio(filename="input.wav"):
    print("\n🎤 Speak now...")
    audio = sd.rec(int(SECONDS * FS), samplerate=FS, channels=1)
    sd.wait()
    write(filename, FS, audio)
    print("✅ Audio saved:", filename)


# ------------------
# Extract Booking Details
# ------------------
def extract_booking_details(text):
    text_lower = text.lower()

    intent = None
    item = None
    date = None
    time = None

    # ------------------
    # Intent detection
    # ------------------
    if "book" in text_lower:
        intent = "book"
    elif "cancel" in text_lower:
        intent = "cancel"

    # ------------------
    # Item detection
    # ------------------
    amenities = ["gym", "pool", "hall", "amenity", "court"]
    for a in amenities:
        if a in text_lower:
            item = a
            break

    # ------------------
    # Date detection
    # ------------------
    today = datetime.today()

    if "today" in text_lower:
        date = today.strftime("%Y-%m-%d")

    elif "tomorrow" in text_lower:
        tomorrow = today + timedelta(days=1)
        date = tomorrow.strftime("%Y-%m-%d")

    # ------------------
    # Time detection
    # Handles: 5 pm, 5PM, 5 p.m., 5P
    # ------------------
    clean_text = text_lower.replace(".", "")

    time_match = re.search(r"(\d{1,2})\s?(am|pm)", clean_text)
    if time_match:
        hour = time_match.group(1)
        ampm = time_match.group(2).upper()
        time = f"{hour} {ampm}"

    short_time_match = re.search(r"(\d{1,2})(a|p)\b", clean_text)
    if short_time_match:
        hour = short_time_match.group(1)
        ampm = short_time_match.group(2).upper()
        time = f"{hour} {'AM' if ampm == 'A' else 'PM'}"

    return intent, item, date, time


# ------------------
# Transcribe Audio
# ------------------
def transcribe_audio(filename="input.wav"):
    result = model.transcribe(filename)
    text = result["text"]

    print("\n📝 Transcribed Text:")
    print(text)

    intent, item, date, time = extract_booking_details(text)

    print("\n📋 Booking Details:")
    print("Intent:", intent if intent else "Not detected")
    print("Item:", item if item else "Not detected")
    print("Date:", date if date else "Not detected")
    print("Time:", time if time else "Not detected")


# ------------------
# Main
# ------------------
if __name__ == "__main__":
    record_audio()
    transcribe_audio()
