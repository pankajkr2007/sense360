# SENSE360

Hackathon prototype of an assistive wearable ecosystem. Runs locally, costs ₹0, uses only free and open-source parts.

- **Vision mode** (blind / low-vision): webcam or photo → COCO-SSD object boxes with confidence, Tesseract.js text reading, spoken results.
- **Sound mode** (deaf / hard-of-hearing): microphone or audio file → FastAPI + YAMNet → horn, siren, alarm, doorbell events with configurable thresholds and an "uncertain" state.
- **Virtual wristband**: per-event vibration patterns, phone vibration where supported, on-screen animation otherwise.

## What is real and what is simulated

| Part | Status |
|---|---|
| Object detection, OCR, YAMNet classification | Real model output |
| Demo-mode sound buttons | Simulated, labelled "Simulated demo data" |
| Wristband BLE connection and battery | Simulated, labelled as such |
| Physical ESP32 / wearable | Not built, not connected |

Vision mode lists object types only. It is not scene understanding and not a navigation or safety aid.

## Setup

Requires Node 18+ and Python 3.10–3.12.

```bash
# Terminal 1: backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000

# Terminal 2: frontend
cd frontend
npm install
npm run dev        # http://localhost:5173
```

First run needs internet once: YAMNet (TF Hub), the COCO-SSD weights and Tesseract language data are downloaded and cached by the browser or TensorFlow Hub. The camera and microphone work on `localhost` or HTTPS only.

## Three-minute demo script

1. **Welcome → Choose a mode.** State the limits shown on screen.
2. **Sound.** Confirm the green "YAMNet loaded" badge. Upload a siren clip, show the event scores, the alert banner and the "Real YAMNet inference" label.
3. **Wristband.** Connect (simulated), press Test siren, then Test doorbell to show two distinct patterns.
4. **Settings.** Raise the siren threshold above its score, re-run the clip, and show the **Uncertain** result.
5. **Vision.** Start camera, show boxes and confidence, press Announce objects. Hold up printed text and press Read text aloud.
6. **History.** Show saved alerts. No audio or images are stored.
7. **Fallback.** Stop the backend, press Check connection, then use demo mode and point out the "Simulated" labels.

## Privacy

Camera frames and audio are processed in memory. Audio goes only to your own local server. Only alert names, scores and detected text are saved in LocalStorage, and this can be switched off in Settings.

## Project layout

```
backend/   main.py, requirements.txt   FastAPI + YAMNet
frontend/  React + Vite + TypeScript + Tailwind
docs/      ARCHITECTURE.md, TESTING.md
```
