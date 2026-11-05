import { useSyncExternalStore } from 'react';
import { EventType } from './events';
import { KEYS } from './storage';

export interface Settings {
  thresholds: Record<EventType, number>;
  muteNonUrgent: boolean;
  phoneVibration: boolean;
  speakResults: boolean;
  highContrast: boolean;
  saveHistory: boolean;
  backendUrl: string;
}
export const DEFAULTS: Settings = {
  thresholds: { horn: 0.5, siren: 0.5, alarm: 0.5, doorbell: 0.5 },
  muteNonUrgent: false, phoneVibration: true, speakResults: true,
  highContrast: false, saveHistory: true, backendUrl: 'http://localhost:8000',
};

function read(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
    return { ...DEFAULTS, ...saved, thresholds: { ...DEFAULTS.thresholds, ...(saved.thresholds || {}) } };
  } catch { return DEFAULTS; }
}
let current: Settings = read();
const subs = new Set<() => void>();

export const getSettings = () => current;
export function applyTheme() { document.documentElement.classList.toggle('hc', current.highContrast); }
export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEYS.settings, JSON.stringify(current)); } catch { /* ignore */ }
  applyTheme();
  subs.forEach((f) => f());
}
export function resetSettings() { updateSettings(DEFAULTS); }
export function useSettings() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
}
