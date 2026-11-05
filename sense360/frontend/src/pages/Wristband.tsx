import { useEffect, useRef, useState } from 'react';
import Band from '../components/Band';
import { EVENTS, EVENT_TYPES, EventType } from '../lib/events';
import { onAlert, phoneCanVibrate, raiseAlert, toggleBand, useBand } from '../lib/alerts';

const SIMULATED_BATTERY = 82;

export default function Wristband() {
  const band = useBand();
  const [active, setActive] = useState<EventType | null>(null);
  const timer = useRef(0);

  useEffect(() => {
    const off = onAlert((a, pattern) => {
      setActive(a.type);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setActive(null), pattern.reduce((x, y) => x + y, 0) + 300);
    });
    return () => { off(); window.clearTimeout(timer.current); };
  }, []);

  const connected = band === 'connected';
  return (
    <section>
      <h1 className="text-3xl font-bold">Virtual wristband</h1>
      <p className="mt-3 rounded-xl border border-amber-400 bg-amber-400/10 p-3 text-amber-200" role="note">No physical wristband or ESP32 is connected. The connection and battery below are simulated for the demo.</p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="card">
          <Band vibrating={active !== null} connected={connected} />
          <p className="mt-3 text-center text-lg font-bold" role="status" aria-live="polite">{active ? `Vibrating: ${EVENTS[active].label}` : 'Idle'}</p>
        </div>
        <div className="card space-y-4">
          <div>
            <h2 className="text-xl font-bold">Connection <span className="badge badge-sim ml-1">Simulated</span></h2>
            <p className="muted mt-1" role="status">{band === 'connected' ? 'Connected (simulated Bluetooth LE)' : band === 'connecting' ? 'Connecting…' : 'Disconnected'}</p>
            <button className="btn mt-2" onClick={toggleBand} disabled={band === 'connecting'}>{connected ? 'Disconnect' : 'Connect wristband'}</button>
          </div>
          <div>
            <h2 className="text-xl font-bold">Battery <span className="badge badge-sim ml-1">Simulated</span></h2>
            <div className="mt-2 h-3 rounded bg-ink"><div className="h-3 rounded bg-teal" style={{ width: `${SIMULATED_BATTERY}%` }} /></div>
            <p className="muted mt-1">{SIMULATED_BATTERY}% (fixed demo value)</p>
          </div>
          <p className="muted">Phone vibration: {phoneCanVibrate() ? 'supported on this device' : 'not supported here (common on iPhones and desktops). The wristband animation shows the pattern instead.'}</p>
        </div>
      </div>

      <div className="card mt-5">
        <h2 className="text-xl font-bold">Vibration patterns</h2>
        <p className="muted mt-1">Each event has its own rhythm. Press Test to feel or see it.</p>
        <ul className="mt-4 space-y-4">
          {EVENT_TYPES.map((t) => (
            <li key={t} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-40"><p className="font-bold">{EVENTS[t].label}</p><p className="muted text-sm">{EVENTS[t].hint}{EVENTS[t].urgent ? '' : ' · low urgency'}</p></div>
              <div className="flex h-4 items-center gap-0.5" aria-hidden="true">{EVENTS[t].pattern.map((ms, i) => <div key={i} className={`h-4 rounded-sm ${i % 2 === 0 ? 'bg-teal' : 'bg-transparent'}`} style={{ width: ms / 12 }} />)}</div>
              <button className="btn" onClick={() => raiseAlert(t, 1, 'test')}>Test {EVENTS[t].label.toLowerCase()}</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
