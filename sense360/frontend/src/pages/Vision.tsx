import { useCallback, useEffect, useRef, useState } from 'react';
import type { ObjectDetection, DetectedObject } from '@tensorflow-models/coco-ssd';
import { KEYS, loadList, pushList } from '../lib/storage';
import { speak, stopSpeaking, canSpeak } from '../lib/speech';
import { getSettings } from '../lib/settings';

type Status = 'idle' | 'loading' | 'ready' | 'error';
export interface VisionRecord { id: string; ts: number; kind: 'objects' | 'text'; summary: string }

const camError = (e: unknown) => {
  const n = (e as DOMException)?.name;
  if (n === 'NotAllowedError') return 'Camera access is blocked. Allow the camera in your browser’s site settings, then press Start camera.';
  if (n === 'NotFoundError') return 'No camera was found. Upload a photo instead.';
  return 'The camera could not be started. Close other apps using it, or upload a photo instead.';
};

export default function Vision() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<ObjectDetection | null>(null);
  const [source, setSource] = useState<'none' | 'camera' | 'image'>('none');
  const [imgUrl, setImgUrl] = useState('');
  const [model, setModel] = useState<Status>('idle');
  const [dets, setDets] = useState<DetectedObject[]>([]);
  const [error, setError] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrBusy, setOcrBusy] = useState<string>('');
  const [history, setHistory] = useState<VisionRecord[]>(() => loadList<VisionRecord>(KEYS.vision));

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  useEffect(() => () => { stopCamera(); stopSpeaking(); }, [stopCamera]);

  async function loadModel() {
    if (modelRef.current || model === 'loading') return;
    setModel('loading'); setError('');
    try {
      await import('@tensorflow/tfjs');
      const coco = await import('@tensorflow-models/coco-ssd');
      modelRef.current = await coco.load({ base: 'lite_mobilenet_v2' });
      setModel('ready');
    } catch {
      setModel('error');
      setError('The object detection model could not load. Check your internet connection (needed once to download it) and press Load detector again.');
    }
  }

  async function startCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) { setError('This browser does not support camera access. Upload a photo instead.'); return; }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setSource('camera'); setDets([]);
      requestAnimationFrame(async () => { if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => undefined); } });
      void loadModel();
    } catch (e) { setError(camError(e)); }
  }

  function stopAll() { stopCamera(); setSource('none'); setDets([]); clearCanvas(); }
  function clearCanvas() { const c = canvasRef.current; c?.getContext('2d')?.clearRect(0, 0, c.width, c.height); }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    stopCamera();
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(URL.createObjectURL(f)); setSource('image'); setDets([]); setOcrText(''); setError('');
    void loadModel();
    e.target.value = '';
  }

  const el = () => (source === 'camera' ? videoRef.current : imgRef.current);
  const dims = (n: HTMLVideoElement | HTMLImageElement) => n instanceof HTMLVideoElement ? [n.videoWidth, n.videoHeight] : [n.naturalWidth, n.naturalHeight];

  const draw = useCallback((preds: DetectedObject[], w: number, h: number) => {
    const c = canvasRef.current; if (!c) return;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, w, h);
    const lw = Math.max(3, w / 200), fs = Math.max(16, w / 40);
    ctx.lineWidth = lw; ctx.font = `bold ${fs}px sans-serif`; ctx.textBaseline = 'top';
    preds.forEach((p) => {
      const [x, y, bw, bh] = p.bbox, label = `${p.class} ${Math.round(p.score * 100)}%`;
      ctx.strokeStyle = '#14D8C4'; ctx.strokeRect(x, y, bw, bh);
      const tw = ctx.measureText(label).width + 10;
      ctx.fillStyle = '#14D8C4'; ctx.fillRect(x, Math.max(0, y - fs - 6), tw, fs + 6);
      ctx.fillStyle = '#0A1226'; ctx.fillText(label, x + 5, Math.max(0, y - fs - 3));
    });
  }, []);

  const detectOnce = useCallback(async () => {
    const node = el(); const m = modelRef.current;
    if (!node || !m) return;
    const [w, h] = dims(node);
    if (!w || !h) return;
    const preds = (await m.detect(node)).filter((p) => p.score >= 0.5);
    draw(preds, w, h); setDets(preds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, draw]);

  // Live loop for camera; single pass for uploaded images
  useEffect(() => {
    if (model !== 'ready' || source === 'none') return;
    let stop = false; let t: number;
    const loop = async () => { try { await detectOnce(); } catch { /* frame not ready */ } if (!stop && source === 'camera') t = window.setTimeout(loop, 400); };
    if (source === 'image') { const img = imgRef.current; if (img && !img.complete) img.onload = () => void detectOnce(); else void loop(); } else void loop();
    return () => { stop = true; window.clearTimeout(t); };
  }, [model, source, imgUrl, detectOnce]);

  const record = (kind: VisionRecord['kind'], summary: string) => {
    if (!getSettings().saveHistory) return;
    const r = { id: `${Date.now()}`, ts: Date.now(), kind, summary };
    pushList(KEYS.vision, r); setHistory((h) => [r, ...h].slice(0, 100));
  };

  function describe() {
    if (!dets.length) return 'No objects detected above 50% confidence.';
    const counts = new Map<string, number>();
    dets.forEach((d) => counts.set(d.class, (counts.get(d.class) || 0) + 1));
    return 'Detected: ' + [...counts].map(([k, n]) => `${n} ${k}`).join(', ') + '.';
  }
  function announce() {
    const text = describe();
    if (getSettings().speakResults && !speak(text)) setError('Speech is not supported in this browser. The result is shown on screen.');
    record('objects', text);
  }

  async function readText() {
    const node = el();
    if (!node) { setError('Start the camera or upload a photo first.'); return; }
    const [w, h] = dims(node);
    if (!w || !h) { setError('The camera is not ready yet. Wait a moment and try again.'); return; }
    setError(''); setOcrBusy('Loading text reader…');
    try {
      const off = document.createElement('canvas'); off.width = w; off.height = h;
      off.getContext('2d')!.drawImage(node, 0, 0, w, h);
      const { default: Tesseract } = await import('tesseract.js');
      const res = await Tesseract.recognize(off, 'eng', { logger: (m) => { if (m.status) setOcrBusy(`${m.status} ${Math.round((m.progress || 0) * 100)}%`); } });
      const text = res.data.text.trim();
      setOcrText(text || 'No readable text found.');
      if (text) { record('text', text.slice(0, 200)); if (getSettings().speakResults) speak(text); }
    } catch { setError('Text reading failed. Tesseract needs an internet connection the first time to fetch its language data.'); }
    finally { setOcrBusy(''); }
  }

  return (
    <section>
      <h1 className="text-3xl font-bold">Vision mode</h1>
      <p className="mt-3 rounded-xl border border-amber-400 bg-amber-400/10 p-3 text-amber-200" role="note">This lists object types found in a single view. It does not understand scenes and is not safe for navigation. Keep using your cane, guide or usual aids.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" onClick={startCamera}>Start camera</button>
        <label className="btn cursor-pointer">Upload photo<input type="file" accept="image/*" className="sr-only" onChange={onFile} /></label>
        <button className="btn" onClick={stopAll} disabled={source === 'none'}>Stop</button>
        <button className="btn" onClick={loadModel} disabled={model === 'ready' || model === 'loading'}>{model === 'loading' ? 'Loading detector…' : model === 'ready' ? 'Detector ready' : 'Load detector'}</button>
      </div>
      {model === 'loading' && <p className="mt-3 muted" role="status">Loading the COCO-SSD model. This takes a few seconds the first time.</p>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-400 bg-red-400/10 p-3 text-red-200">{error}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="card overflow-hidden p-0">
          {source === 'none' ? (
            <p className="muted p-8 text-center">No image yet. Start the camera or upload a photo.</p>
          ) : (
            <div className="relative">
              {source === 'camera' ? <video ref={videoRef} muted playsInline className="block w-full" aria-label="Live camera view" /> : <img ref={imgRef} src={imgUrl} alt="Uploaded photo being analysed" className="block w-full" />}
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="card">
          <h2 className="text-xl font-bold">Detected objects</h2>
          <ul className="mt-3 space-y-1" aria-live="polite">
            {dets.length === 0 && <li className="muted">{model === 'ready' && source !== 'none' ? 'Nothing detected yet.' : 'Results appear here.'}</li>}
            {dets.map((d, i) => <li key={i} className="flex justify-between"><span>{d.class}</span><span className="font-bold text-teal">{Math.round(d.score * 100)}%</span></li>)}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            <button className="btn btn-primary" onClick={announce} disabled={source === 'none' || model !== 'ready'}>Announce objects</button>
            <button className="btn" onClick={readText} disabled={source === 'none' || !!ocrBusy}>{ocrBusy || 'Read text aloud'}</button>
            {!canSpeak() && <p className="muted text-sm">This browser has no speech output. Results stay on screen.</p>}
          </div>
        </div>
      </div>

      {ocrText && <div className="card mt-5"><h2 className="text-xl font-bold">Text found</h2><p className="mt-2 whitespace-pre-wrap">{ocrText}</p></div>}

      <div className="card mt-5">
        <h2 className="text-xl font-bold">Recent detections</h2>
        {history.length === 0 ? <p className="muted mt-2">Nothing saved yet. Announce objects or read text to add entries. Only text is saved, never images.</p> : (
          <ul className="mt-2 divide-y divide-line">{history.slice(0, 6).map((h) => <li key={h.id} className="py-2"><span className="muted">{new Date(h.ts).toLocaleTimeString()} · {h.kind === 'text' ? 'Text' : 'Objects'}:</span> {h.summary}</li>)}</ul>
        )}
      </div>
    </section>
  );
}
