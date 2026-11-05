import { EVENTS, EVENT_TYPES } from '../lib/events';
import { resetSettings, updateSettings, useSettings } from '../lib/settings';
import { KEYS, clearKey } from '../lib/storage';

function Toggle({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[48px] cursor-pointer items-start gap-3 py-2">
      <input type="checkbox" className="mt-1 h-6 w-6 accent-teal" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span><span className="font-bold">{label}</span>{help && <span className="muted block text-sm">{help}</span>}</span>
    </label>
  );
}

export default function Settings() {
  const s = useSettings();
  return (
    <section>
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="card mt-5">
        <h2 className="text-xl font-bold">Alert thresholds</h2>
        <p className="muted mt-1">An alert fires when a sound scores at or above its threshold. Scores from half the threshold up are shown as uncertain.</p>
        <div className="mt-4 space-y-4">
          {EVENT_TYPES.map((t) => (
            <div key={t}>
              <label htmlFor={`th-${t}`} className="flex justify-between font-bold"><span>{EVENTS[t].label}</span><span>{Math.round(s.thresholds[t] * 100)}%</span></label>
              <input id={`th-${t}`} type="range" min={10} max={95} step={5} className="mt-1 h-8 w-full accent-teal" value={Math.round(s.thresholds[t] * 100)}
                onChange={(e) => updateSettings({ thresholds: { ...s.thresholds, [t]: Number(e.target.value) / 100 } })} />
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-5">
        <h2 className="text-xl font-bold">Preferences</h2>
        <Toggle label="Mute low-urgency alerts" help="Skips doorbell alerts." checked={s.muteNonUrgent} onChange={(v) => updateSettings({ muteNonUrgent: v })} />
        <Toggle label="Vibrate this phone" help="Works only where the browser supports vibration." checked={s.phoneVibration} onChange={(v) => updateSettings({ phoneVibration: v })} />
        <Toggle label="Speak Vision results" checked={s.speakResults} onChange={(v) => updateSettings({ speakResults: v })} />
        <Toggle label="High-contrast mode" checked={s.highContrast} onChange={(v) => updateSettings({ highContrast: v })} />
        <Toggle label="Save history on this device" help="Stores alert names, scores and detected text. Never audio or images." checked={s.saveHistory} onChange={(v) => updateSettings({ saveHistory: v })} />
      </div>

      <div className="card mt-5">
        <h2 className="text-xl font-bold">Audio server</h2>
        <label htmlFor="backend" className="muted mt-1 block">Address of the FastAPI backend</label>
        <input id="backend" type="url" className="mt-1 min-h-[48px] w-full rounded-xl border border-line bg-ink px-3 text-base" value={s.backendUrl} onChange={(e) => updateSettings({ backendUrl: e.target.value.trim() })} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn" onClick={() => { clearKey(KEYS.alerts); clearKey(KEYS.vision); }}>Clear saved history</button>
        <button className="btn" onClick={resetSettings}>Reset settings</button>
      </div>
    </section>
  );
}
