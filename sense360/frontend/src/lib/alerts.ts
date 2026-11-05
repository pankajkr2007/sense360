import { useSyncExternalStore } from 'react';
import { EVENTS, EventType } from './events';
import { getSettings } from './settings';
import { KEYS, pushList } from './storage';

export type AlertSource = 'yamnet' | 'simulated' | 'test';
export interface AlertRecord { id: string; type: EventType; label: string; confidence: number; timestamp: number; source: AlertSource }

type Listener = (a: AlertRecord, pattern: number[]) => void;
const listeners = new Set<Listener>();
export const onAlert = (f: Listener) => { listeners.add(f); return () => { listeners.delete(f); }; };

/** Shared alert service: one place that handles event names, confidence, timestamps, vibration and history. */
export function raiseAlert(type: EventType, confidence: number, source: AlertSource): AlertRecord | null {
  const s = getSettings();
  const def = EVENTS[type];
  if (source !== 'test' && !def.urgent && s.muteNonUrgent) return null;
  const rec: AlertRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type, label: def.label, confidence, timestamp: Date.now(), source,
  };
  if (s.phoneVibration && 'vibrate' in navigator) navigator.vibrate(def.pattern);
  if (source !== 'test' && s.saveHistory) pushList(KEYS.alerts, rec);
  listeners.forEach((f) => f(rec, def.pattern));
  return rec;
}
export const phoneCanVibrate = () => 'vibrate' in navigator;

// Simulated wristband link (no physical device exists)
let bandState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
const bandSubs = new Set<() => void>();
const setBand = (s: typeof bandState) => { bandState = s; bandSubs.forEach((f) => f()); };
export function toggleBand() {
  if (bandState === 'connecting') return;
  if (bandState === 'connected') return setBand('disconnected');
  setBand('connecting');
  setTimeout(() => setBand('connected'), 1200);
}
export function useBand() {
  return useSyncExternalStore((cb) => { bandSubs.add(cb); return () => { bandSubs.delete(cb); }; }, () => bandState);
}
