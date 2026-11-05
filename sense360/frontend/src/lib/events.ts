export type EventType = 'horn' | 'siren' | 'alarm' | 'doorbell';
export interface EventDef { label: string; pattern: number[]; urgent: boolean; hint: string }

// Vibration patterns in ms: vibrate, pause, vibrate, ... (navigator.vibrate format)
export const EVENTS: Record<EventType, EventDef> = {
  horn: { label: 'Vehicle horn', pattern: [300, 120, 300], urgent: true, hint: 'two firm pulses' },
  siren: { label: 'Emergency siren', pattern: [700, 150, 700, 150, 700], urgent: true, hint: 'three long pulses' },
  alarm: { label: 'Alarm', pattern: [120, 80, 120, 80, 120, 80, 120], urgent: true, hint: 'four rapid pulses' },
  doorbell: { label: 'Doorbell', pattern: [150, 250, 150], urgent: false, hint: 'two soft taps' },
};
export const EVENT_TYPES = Object.keys(EVENTS) as EventType[];
