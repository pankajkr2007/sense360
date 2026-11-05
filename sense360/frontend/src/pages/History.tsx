import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertRecord } from '../lib/alerts';
import { KEYS, clearKey, loadList } from '../lib/storage';
import type { VisionRecord } from './Vision';

export default function History() {
  const [alerts, setAlerts] = useState(() => loadList<AlertRecord>(KEYS.alerts));
  const [vision, setVision] = useState(() => loadList<VisionRecord>(KEYS.vision));
  const clear = () => { clearKey(KEYS.alerts); clearKey(KEYS.vision); setAlerts([]); setVision([]); };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Alert history</h1>
        <button className="btn" onClick={clear} disabled={!alerts.length && !vision.length}>Clear all</button>
      </div>
      <div className="card mt-5">
        <h2 className="text-xl font-bold">Sound alerts</h2>
        {alerts.length === 0 ? <p className="muted mt-2">No alerts yet. <Link className="underline" to="/sound">Open Sound mode</Link> to analyse audio.</p> : (
          <ul className="mt-2 divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-bold">{a.label} · {Math.round(a.confidence * 100)}%</span>
                <span className="flex items-center gap-2"><span className="muted">{new Date(a.timestamp).toLocaleString()}</span>
                  <span className={`badge ${a.source === 'yamnet' ? 'badge-real' : 'badge-sim'}`}>{a.source === 'yamnet' ? 'AI result' : 'Simulated'}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card mt-5">
        <h2 className="text-xl font-bold">Vision detections</h2>
        {vision.length === 0 ? <p className="muted mt-2">Nothing saved yet. <Link className="underline" to="/vision">Open Vision mode</Link>.</p> : (
          <ul className="mt-2 divide-y divide-line">{vision.map((v) => <li key={v.id} className="py-3"><span className="muted">{new Date(v.ts).toLocaleString()} · {v.kind === 'text' ? 'Text' : 'Objects'}:</span> {v.summary}</li>)}</ul>
        )}
      </div>
    </section>
  );
}
