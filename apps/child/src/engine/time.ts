export const pad = (n: number) => String(n).padStart(2, '0');
/** 'HH:MM' or 'HH:MM:SS' or '05:12 (WAT)' -> minutes since midnight; null if unusable */
export function toMin(v?: string | null): number | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v).trim());
  if (!m) return null;
  const h = +m[1], mm = +m[2];
  return h > 23 || mm > 59 ? null : h * 60 + mm;
}
export const minOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
/** ISO weekday: Monday 1 ... Sunday 7 */
export const isoDay = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const atMinute = (d: Date, min: number) => { const x = new Date(d); x.setHours(Math.floor(min / 60), min % 60, 0, 0); return x; };
export const nextMidnight = (d: Date) => { const x = new Date(d); x.setHours(24, 0, 0, 0); return x; };
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
