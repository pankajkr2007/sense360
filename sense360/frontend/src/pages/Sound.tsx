import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EVENTS, EVENT_TYPES, EventType } from '../lib/events';
import { raiseAlert } from '../lib/alerts';
import { toWav16k } from '../lib/audio';
import { useSettings } from '../lib/settings';

interface Result { model: string; simulated: boolean; top: { label: string; score: number }[]; events: Record<EventType, number>; duration_s?: number }
type Backend = 'checking' | 'online' | 'loading-model' | 'offline';
type Verdict = { kind: 'detected'; type: EventType; conf: number } | { kind: 'uncertain'; type: EventType; conf: number } | { kind: 'none' };
const MAX_SECONDS = 8;
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function Sound() {
  const s = useSettings();
  const [backend, setBackend] = useState<Backend>('checking');
  const [backendMsg, setBackendMsg] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>(0);

  const checkBackend = useCallback(async () => {
    setBackend('checking'); setBackendMsg('');
    try {
      const r = await fetch(`${s.backendUrl}/health`);
      const j = await r.json();
      if (j.model_loaded) setBackend('online');
      else { setBackend('loading-model'); setBackendMsg(j.error || 'YAMNet is still downloading or loading.'); }
    } catch { setBackend('offline'); }
  }, [s.backendUrl]);
  useEffect(() => { void checkBackend(); }, [checkBackend]);

  const releaseMic = useCallback(() => { window.clearTimeout(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; }, []);
  useEffect(() => () => { if (recRef.current?.state === 'recording') recRef.current.stop(); releaseMic(); }, [releaseMic]);

  function evaluate(r: Result, source: 'yamnet' | 'simulated') {
    setResult(r);
    const scored = EVENT_TYPES.map((t) => ({ t, c: r.events[t] ?? 0 })).sort((a, b) => b.c - a.c);
    const hit = scored.find((x) => x.c >= s.thresholds[x.t]);
    if (hit) { raiseAlert(hit.t, hit.c, source); setVerdict({ kind: 'detected', type: hit.t, conf: hit.c }); return; }
    const maybe = scored.find((x) => x.c >= s.thresholds[x.t] * 0.5);
    setVerdict(maybe ? { kind: 'uncertain', type: maybe.t, conf: maybe.c } : { kind: 'none' });
  }

  async function analyse(blob: Blob) {
    setBusy(true); setError('');
    try {
      const wav = await toWav16k(blob);
      const fd = new FormData(); fd.append('file', wav, 'clip.wav');
      let res: Response;
      try { res = await fetch(`${s.backendUrl}/classify`, { method: 'POST', body: fd }); }
      catch { setBackend('offline'); throw new Error('The audio server is not reachable. Start the backend, or use demo mode below.'); }
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.detail || `The server returned an error (${res.status}).`); }
      evaluate({ ...(await res.json()), simulated: false }, 'yamnet');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function startRec() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('This browser cannot record audio. Upload an audio file instead.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream); const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => { releaseMic(); setRecording(false); void analyse(new Blob(chunks, { type: rec.mimeType })); };
      recRef.current = rec; rec.start(); setRecording(true);
      timerRef.current = window.setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, MAX_SECONDS * 1000);
    } catch (e) {
      const n = (e as DOMException).name;
      setError(n === 'NotAllowedError' ? 'Microphone access is blocked. Allow the microphone in your browser’s site settings, then press Record again.' : n === 'NotFoundError' ? 'No microphone was found. Upload an audio file instead.' : 'The microphone could not be started.');
    }
  }
  const stopRec = () => { if (recRef.current?.state === 'recording') recRef.current.stop(); };

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (f) void analyse(f);
  }

  function simulate(t: EventType) {
    const conf = 0.6 + Math.random() * 0.35;
    const events = Object.fromEntries(EVENT_TYPES.map((x) => [x, x === t ? conf : Math.random() * 0.08])) as Record<EventType, number>;
    evaluate({ model: 'none (demo data)', simulated: true, top: [{ label: `${EVENTS[t].label} (simulated)`, score: conf }], events }, 'simulated');
  }

  const badge: Record<Backend, string> = { checking: 'Checking audio server…', online: 'Audio server online · YAMNet loaded', 'loading-model': 'Audio server up, model not ready', offline: 'Audio server offline' };

  return (
    <section>
      <h1 className="text-3xl font-bold">Sound mode</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className={`badge ${backend === 'online' ? 'badge-real' : 'badge-sim'}`} role="status">{badge[backend]}</span>
        <button className="btn" onClick={checkBackend}>Check connection</button>
      </div>
      {backend === 'offline' && <p className="muted mt-2">Start it with <code>uvicorn main:app --port 8000</code> in the backend folder. Until then, only demo mode works.</p>}
      {backendMsg && <p className="muted mt-2">{backendMsg}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        {!recording ? <button className="btn btn-primary" onClick={startRec} disabled={busy}>Record {MAX_SECONDS} seconds</button> : <button className="btn btn-primary" onClick={stopRec}>Stop and analyse</button>}
        <label className={`btn cursor-pointer ${busy ? 'opacity-50' : ''}`}>Upload audio<input type="file" accept="audio/*" className="sr-only" disabled={busy} onChange={onFile} /></label>
      </div>
      {recording && <p className="mt-3 font-bold text-teal" role="status">Recording… the microphone is on.</p>}
      {busy && <p className="mt-3 muted" role="status">Analysing audio…</p>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-400 bg-red-400/10 p-3 text-red-200">{error}</p>}

      {verdict && result && (
        <div className="card mt-5" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">
              {verdict.kind === 'detected' && `${EVENTS[verdict.type].label} detected · ${pct(verdict.conf)}`}
              {verdict.kind === 'uncertain' && `Uncertain: possibly ${EVENTS[verdict.type].label.toLowerCase()} · ${pct(verdict.conf)}`}
              {verdict.kind === 'none' && 'No tracked sound detected'}
            </h2>
            <span className={`badge ${result.simulated ? 'badge-sim' : 'badge-real'}`}>{result.simulated ? 'Simulated demo data' : 'Real YAMNet inference'}</span>
          </div>
          {verdict.kind === 'uncertain' && <p className="muted mt-2">The score is below your threshold, so no alert was sent. Lower the threshold in <Link className="underline" to="/settings">Settings</Link> or record again.</p>}
          {verdict.kind === 'detected' && <p className="muted mt-2">Vibration sent to the wristband. <Link className="underline" to="/wristband">View wristband</Link></p>}
          <h3 className="mt-4 font-bold">Event scores</h3>
          <ul className="mt-2 space-y-2">
            {EVENT_TYPES.map((t) => { const c = result.events[t] ?? 0; return (
              <li key={t}><div className="flex justify-between"><span>{EVENTS[t].label}</span><span>{pct(c)} <span className="muted">(alert at {pct(s.thresholds[t])})</span></span></div>
                <div className="mt-1 h-2 rounded bg-ink"><div className="h-2 rounded bg-volt" style={{ width: pct(Math.min(1, c)) }} /></div></li>); })}
          </ul>
          <h3 className="mt-4 font-bold">Top sounds heard</h3>
          <ul className="mt-1">{result.top.map((p) => <li key={p.label} className="flex justify-between"><span>{p.label}</span><span className="muted">{pct(p.score)}</span></li>)}</ul>
        </div>
      )}

      <div className="card mt-5 border-amber-400/60">
        <h2 className="text-xl font-bold">Demo mode (simulated)</h2>
        <p className="muted mt-1">Use this when the audio server or microphone is unavailable. These buttons create made-up results, labelled as simulated, and do not use AI.</p>
        <div className="mt-3 flex flex-wrap gap-3">{EVENT_TYPES.map((t) => <button key={t} className="btn" onClick={() => simulate(t)}>Simulate {EVENTS[t].label.toLowerCase()}</button>)}</div>
      </div>
    </section>
  );
}
