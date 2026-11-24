// Shapes returned by GET /devices/config (see backend devices.controller.js).
export interface Window { enabled: boolean; days?: number[]; start: string | null; end: string | null }
export interface Config {
  server_time: string;
  child: { id: string; full_name: string };
  limits: null | {
    weekday_mins: number; weekend_mins: number; warn_at_percent?: number;
    school: Window; bedtime: Window; paused: boolean; paused_until: string | null;
  };
  prayer: null | {
    city: string; locked: string[]; buffer_mins: number;
    jumuah: Window & { enabled: boolean }; church: Window & { enabled: boolean };
  };
  exam: null | {
    body: string; start_date: string; end_date: string; allowed_packages: string[];
    block: { social: boolean; gaming: boolean; entertainment: boolean; messaging: boolean };
    study: Window;
  };
  app_rules: { package: string | null; category: string | null; blocked: boolean; daily_limit_mins: number }[];
}
export type PrayerTimes = Record<string, string>; // { Fajr: '05:12', Dhuhr: ... }

export type Reason = 'paused' | 'bedtime' | 'school' | 'prayer' | 'jumuah' | 'church' | 'exam_study' | 'limit';
export interface Decision { mode: 'open' | 'lock' | 'allowlist'; reason: Reason | null; until: Date | null }
export interface Segment { start: number; end: number; mode: 'lock' | 'allowlist'; reason: Reason }

/** What the native enforcer reads. Keep in sync with NurtureEnforcerModule.kt / PolicyStore.kt */
export interface NativePolicy {
  version: 1;
  generatedAt: number; validUntil: number;
  segments: Segment[];
  limitByDate: Record<string, number>;   // 'YYYY-MM-DD' -> minutes, 0 = no limit
  blockedPackages: string[];
  blockedCategories: ('game' | 'social' | 'video')[];
  allowedPackages: string[];             // used in 'allowlist' mode
  strings: Record<string, string>;       // localised lock-screen text
}
