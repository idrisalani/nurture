import { Config, Decision, PrayerTimes, Reason } from './types';
import { addDays, atMinute, isoDay, minOfDay, nextMidnight, toMin, ymd } from './time';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const lock = (reason: Reason, until: Date | null): Decision => ({ mode: 'lock', reason, until });

/** Is `now` inside a daily window, allowing windows that cross midnight? Returns the end Date, or null. */
export function windowEnd(now: Date, w: { days?: number[]; start: string | null; end: string | null }): Date | null {
  const s = toMin(w.start), e = toMin(w.end);
  if (s === null || e === null || s === e) return null;
  const m = minOfDay(now);
  const days = w.days && w.days.length ? w.days : [1, 2, 3, 4, 5, 6, 7];
  if (s < e) { // same-day window
    return days.includes(isoDay(now)) && m >= s && m < e ? atMinute(now, e) : null;
  }
  // crosses midnight: evening part belongs to today, morning part to yesterday's window
  if (m >= s && days.includes(isoDay(now))) return atMinute(addDays(now, 1), e);
  if (m < e && days.includes(isoDay(addDays(now, -1)))) return atMinute(now, e);
  return null;
}

function examActive(cfg: Config, now: Date) {
  const x = cfg.exam; if (!x) return false;
  const d = ymd(now);
  return d >= String(x.start_date).slice(0, 10) && d <= String(x.end_date).slice(0, 10);
}

/**
 * What should the phone do at `now`? Pure: no clock, no network.
 * Priority: parent pause, bedtime, school, prayer, Jumu'ah, church, exam study hours, daily limit.
 * `usageMins` is today's total screen time; pass it to include the daily limit.
 */
export function decideAt(cfg: Config, now: Date, prayer: PrayerTimes = {}, usageMins?: number): Decision {
  const L = cfg.limits;
  if (L?.paused) {
    const until = L.paused_until ? new Date(L.paused_until) : null;
    if (!until || until > now) return lock('paused', until);
  }
  if (L?.bedtime.enabled) { const e = windowEnd(now, L.bedtime); if (e) return lock('bedtime', e); }
  if (L?.school.enabled) { const e = windowEnd(now, L.school); if (e) return lock('school', e); }

  const P = cfg.prayer;
  if (P) {
    const buf = Math.max(0, P.buffer_mins || 0);
    const m = minOfDay(now);
    for (const k of PRAYERS) {
      if (!P.locked.map(x => x.toLowerCase()).includes(k)) continue;
      const t = toMin(prayer[k[0].toUpperCase() + k.slice(1)]);
      if (t === null) continue;
      if (m >= t - buf && m < t + buf) return lock('prayer', atMinute(now, t + buf));
    }
    if (P.jumuah.enabled && isoDay(now) === 5) { const e = windowEnd(now, { start: P.jumuah.start, end: P.jumuah.end }); if (e) return lock('jumuah', e); }
    if (P.church.enabled && isoDay(now) === 7) { const e = windowEnd(now, { start: P.church.start, end: P.church.end }); if (e) return lock('church', e); }
  }

  if (examActive(cfg, now) && cfg.exam!.study.enabled) {
    const e = windowEnd(now, cfg.exam!.study);
    if (e) return { mode: 'allowlist', reason: 'exam_study', until: e };
  }

  if (L && usageMins !== undefined) {
    const weekend = isoDay(now) >= 6;
    const limit = weekend ? L.weekend_mins : L.weekday_mins;
    if (limit > 0 && usageMins >= limit) return lock('limit', nextMidnight(now));
  }
  return { mode: 'open', reason: null, until: null };
}

/** Minutes of screen time left today, or null when there is no daily limit. */
export function minutesLeft(cfg: Config, now: Date, usageMins: number): number | null {
  const L = cfg.limits; if (!L) return null;
  const limit = isoDay(now) >= 6 ? L.weekend_mins : L.weekday_mins;
  return limit > 0 ? Math.max(0, limit - usageMins) : null;
}
export const dailyLimit = (cfg: Config, d: Date): number => {
  const L = cfg.limits; if (!L) return 0;
  return (isoDay(d) >= 6 ? L.weekend_mins : L.weekday_mins) || 0;
};
