export function loadList<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
}
export function pushList<T>(key: string, item: T, max = 100) {
  try { localStorage.setItem(key, JSON.stringify([item, ...loadList<T>(key)].slice(0, max))); } catch { /* storage full or blocked */ }
}
export function clearKey(key: string) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
export const KEYS = { alerts: 'sense360.alerts', vision: 'sense360.vision', settings: 'sense360.settings' };
