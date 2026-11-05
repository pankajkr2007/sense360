"""SENSE360 audio inference service: YAMNet environmental sound classification.

Audio is processed in memory and never written to disk.
Run:  uvicorn main:app --port 8000
"""
import csv
import io
from contextlib import asynccontextmanager

import librosa
import numpy as np
import soundfile as sf
import tensorflow as tf
import tensorflow_hub as hub
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# SENSE360 event -> YAMNet AudioSet display names
EVENT_CLASSES = {
    "horn": ["Vehicle horn, car horn, honking", "Car alarm"],
    "siren": ["Siren", "Civil defense siren", "Police car (siren)",
              "Ambulance (siren)", "Fire engine, fire truck (siren)", "Emergency vehicle"],
    "alarm": ["Alarm", "Smoke detector, smoke alarm", "Fire alarm", "Buzzer", "Alarm clock"],
    "doorbell": ["Doorbell", "Ding-dong"],
}
MAX_BYTES = 10 * 1024 * 1024
state: dict = {"model": None, "names": [], "event_idx": {}, "error": None}


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        model = hub.load("https://tfhub.dev/google/yamnet/1")  # downloaded once, then cached
        path = model.class_map_path().numpy().decode("utf-8")
        with tf.io.gfile.GFile(path) as f:
            names = [row["display_name"] for row in csv.DictReader(f)]
        state["event_idx"] = {
            ev: [names.index(c) for c in classes if c in names]
            for ev, classes in EVENT_CLASSES.items()
        }
        state["model"], state["names"] = model, names
    except Exception as exc:  # report through /health instead of crashing
        state["error"] = f"{type(exc).__name__}: {exc}"
    yield


app = FastAPI(title="SENSE360 audio inference", lifespan=lifespan)
# Local demo only: tighten allow_origins before any real deployment.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": state["model"] is not None, "error": state["error"]}


@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    if state["model"] is None:
        raise HTTPException(503, f"YAMNet is not loaded. {state['error'] or 'Still loading.'}")
    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "Audio file is larger than 10 MB.")
    try:
        data, sr = sf.read(io.BytesIO(raw), dtype="float32", always_2d=False)
    except Exception:
        raise HTTPException(400, "Could not read audio. Send a WAV, FLAC or OGG file.")
    if data.ndim > 1:
        data = data.mean(axis=1)
    if sr != 16000:
        data = librosa.resample(data, orig_sr=sr, target_sr=16000)
    if len(data) < 15360:  # YAMNet needs at least one 0.96 s frame
        data = np.pad(data, (0, 15360 - len(data)))
    scores = state["model"](data)[0].numpy()  # (frames, 521)
    mean, peak = scores.mean(axis=0), scores.max(axis=0)
    top = np.argsort(mean)[::-1][:5]
    return {
        "model": "yamnet",
        "simulated": False,
        "duration_s": round(len(data) / 16000, 2),
        "top": [{"label": state["names"][i], "score": float(mean[i])} for i in top],
        # per-event score = strongest frame among the mapped YAMNet classes
        "events": {ev: float(peak[idx].max()) if idx else 0.0 for ev, idx in state["event_idx"].items()},
    }
