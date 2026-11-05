# Architecture

```
Browser (React + Vite)                                  Local Python server
┌──────────────────────────────────────────────┐        ┌────────────────────────┐
│ Vision page ── COCO-SSD (TF.js) ── canvas     │        │ FastAPI                │
│            └─ Tesseract.js OCR ── Speech API  │        │  GET  /health          │
│ Sound page ── MediaRecorder / file upload     │  WAV   │  POST /classify        │
│            └─ toWav16k (mono, 16 kHz) ────────┼───────▶│  soundfile + librosa   │
│                                               │  JSON  │  YAMNet (TF Hub)       │
│ evaluate(thresholds) ──▶ Alert service ◀──────┼────────│  → event scores        │
│                            │ vibrate / history│        └────────────────────────┘
│ Wristband page ◀── onAlert ┘  LocalStorage    │
└──────────────────────────────────────────────┘
```

## Key decisions

- **Vision stays in the browser.** Frames never leave the device.
- **Sound inference is on a local server.** YAMNet needs TensorFlow in Python. The browser converts any decodable audio to 16 kHz mono WAV so the server needs no ffmpeg.
- **Shared alert service** (`lib/alerts.ts`): one `raiseAlert(type, confidence, source)` call sets the timestamp, vibrates the phone, saves history and notifies listeners (global banner, wristband animation). Sources are `yamnet`, `simulated` or `test`, so real and fake results are never mixed up.
- **Event mapping** (`backend/main.py`): each SENSE360 event maps to several YAMNet classes. Its score is the strongest frame among those classes.
- **Decisions on the client.** The server returns raw scores; thresholds from Settings decide `detected`, `uncertain` (≥ half the threshold) or none.
- **Storage:** LocalStorage keys `sense360.settings`, `.alerts`, `.vision`. No raw media.

## Known limits

- Phone vibration is unsupported on iOS Safari and most desktops; the animation is the fallback.
- YAMNet scores a mixture of sounds; horns and sirens in noisy traffic may be missed or confused. Thresholds are untuned.
- CORS is open (`*`) for local use only.
