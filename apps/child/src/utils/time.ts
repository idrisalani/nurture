/** "08:30" or "08:30:00" -> minutes since midnight */
export const toMin = (hhmm?: string | null): number => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const pad = (n: number) => String(n).padStart(2, '0');
/** minutes since midnight -> "08:30" (wraps at 24 h) */
export const toHHMM = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};
export const nowMin = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
/** Normalise a Nigerian number typed by a parent into +234… */
export const normalisePhone = (raw: string): string => {
  const s = raw.replace(/[\s()-]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('234')) return `+${s}`;
  if (s.startsWith('0')) return `+234${s.slice(1)}`;
  return `+234${s}`;
};
export const isValidNgPhone = (raw: string): boolean => /^\+234[789]\d{9}$/.test(normalisePhone(raw));
export const naira = (kobo: number): string => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;
