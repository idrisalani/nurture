import { Config } from './types';
import { decideAt, minutesLeft, windowEnd } from './decide';
import { buildPolicy, buildSegments } from './timeline';

// Test clock is Africa/Lagos (see package.json "test" script). Months are 0-based: 10 = November.
// 2026-11-24 is a Tuesday, 2026-11-27 a Friday, 2026-11-29 a Sunday, 2026-11-28 a Saturday.
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const prayer = { Fajr: '05:12', Dhuhr: '12:20', Asr: '15:38', Maghrib: '18:24', Isha: '19:38' };

const base = (): Config => ({
  server_time: '', child: { id: 'k', full_name: 'Amara Bello' },
  limits: { weekday_mins: 120, weekend_mins: 180,
    school: { enabled: true, days: [1, 2, 3, 4, 5], start: '08:00', end: '15:00' },
    bedtime: { enabled: true, days: [1, 2, 3, 4, 5, 6, 7], start: '21:00', end: '06:00' },
    paused: false, paused_until: null },
  prayer: null, exam: null, app_rules: [],
});
const withPrayer = (c: Config, extra: Partial<NonNullable<Config['prayer']>> = {}) => ({
  ...c, prayer: { city: 'Kano', locked: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'], buffer_mins: 15,
    jumuah: { enabled: true, start: '12:30', end: '14:00' }, church: { enabled: false, start: '09:00', end: '13:00' }, ...extra },
});

describe('windows', () => {
  it('handles a same-day window', () => {
    const w = { days: [1, 2, 3, 4, 5], start: '08:00', end: '15:00' };
    expect(windowEnd(at(24, 9), w)).toEqual(at(24, 15));
    expect(windowEnd(at(24, 15), w)).toBeNull();      // end is exclusive
    expect(windowEnd(at(28, 9), w)).toBeNull();       // Saturday
  });
  it('handles a window that crosses midnight', () => {
    const w = { start: '21:00', end: '06:00' };
    expect(windowEnd(at(24, 22), w)).toEqual(at(25, 6));
    expect(windowEnd(at(25, 2), w)).toEqual(at(25, 6));
    expect(windowEnd(at(25, 6), w)).toBeNull();
    expect(windowEnd(at(24, 12), w)).toBeNull();
  });
  it('uses the day the window STARTED for the morning part', () => {
    const w = { days: [5], start: '21:00', end: '06:00' };         // Friday nights only
    expect(windowEnd(at(28, 2), w)).toEqual(at(28, 6));            // Saturday 02:00 belongs to Friday's window
    expect(windowEnd(at(27, 2), w)).toBeNull();                    // Friday 02:00 belongs to Thursday's
  });
  it('ignores empty or unreadable windows', () => {
    expect(windowEnd(at(24, 9), { start: null, end: '10:00' })).toBeNull();
    expect(windowEnd(at(24, 9), { start: '09:00', end: '09:00' })).toBeNull();
  });
});

describe('decideAt', () => {
  it('is open after school and before bedtime', () => {
    expect(decideAt(base(), at(24, 16))).toEqual({ mode: 'open', reason: null, until: null });
  });
  it('locks during school on weekdays only', () => {
    expect(decideAt(base(), at(24, 10))).toMatchObject({ mode: 'lock', reason: 'school', until: at(24, 15) });
    expect(decideAt(base(), at(28, 10)).mode).toBe('open');
  });
  it('locks at bedtime until morning', () => {
    expect(decideAt(base(), at(24, 21, 30))).toMatchObject({ reason: 'bedtime', until: at(25, 6) });
    expect(decideAt(base(), at(25, 5, 59))).toMatchObject({ reason: 'bedtime', until: at(25, 6) });
  });
  it('respects a disabled bedtime', () => {
    const c = base(); c.limits!.bedtime.enabled = false;
    expect(decideAt(c, at(24, 22)).mode).toBe('open');
  });
  it('a manual pause beats everything, and lasts until resumed when no end is set', () => {
    const c = base(); c.limits!.paused = true;
    expect(decideAt(c, at(24, 16))).toEqual({ mode: 'lock', reason: 'paused', until: null });
  });
  it('a timed pause ends on time', () => {
    const c = base(); c.limits!.paused = true; c.limits!.paused_until = at(24, 17).toISOString();
    expect(decideAt(c, at(24, 16, 30))).toMatchObject({ reason: 'paused', until: at(24, 17) });
    expect(decideAt(c, at(24, 17, 1)).mode).toBe('open');
  });
  it('locks around prayer times, buffer both sides', () => {
    const c = withPrayer(base());
    expect(decideAt(c, at(24, 16), prayer).mode).toBe('open');
    expect(decideAt(c, at(24, 15, 23), prayer)).toMatchObject({ reason: 'prayer', until: at(24, 15, 53) });
    expect(decideAt(c, at(24, 15, 53), prayer).mode).toBe('open');
    expect(decideAt(c, at(24, 15, 22), prayer).mode).toBe('open');
  });
  it('only locks the prayers the parent chose', () => {
    const c = withPrayer(base(), { locked: ['fajr'] });
    expect(decideAt(c, at(24, 15, 38), prayer).mode).toBe('open');
  });
  it('survives missing or bad prayer times', () => {
    const c = withPrayer(base());
    expect(() => decideAt(c, at(24, 16), {})).not.toThrow();
    expect(decideAt(c, at(24, 16), { Asr: 'n/a' }).mode).toBe('open');
  });
  it("locks for Jumu'ah on Fridays only", () => {
    const c = withPrayer(base(), { locked: [] });
    c.limits!.school.enabled = false;
    expect(decideAt(c, at(27, 13))).toMatchObject({ reason: 'jumuah', until: at(27, 14) });
    expect(decideAt(c, at(24, 13)).mode).toBe('open');
  });
  it('locks for church on Sundays only', () => {
    const c = withPrayer(base(), { locked: [], church: { enabled: true, start: '09:00', end: '13:00' } });
    expect(decideAt(c, at(29, 10))).toMatchObject({ reason: 'church', until: at(29, 13) });
    expect(decideAt(c, at(28, 10)).mode).toBe('open');
  });
  it('reads Aladhan style times with a zone suffix', () => {
    const c = withPrayer(base()); c.limits!.school.enabled = false;
    expect(decideAt(c, at(24, 12, 20), { Dhuhr: '12:20 (WAT)' }).reason).toBe('prayer');
  });
  it('switches to allowlist during exam study hours', () => {
    const c = base(); c.limits!.school.enabled = false;
    c.exam = { body: 'WAEC', start_date: '2026-11-20', end_date: '2026-12-20', allowed_packages: ['com.khan'], block: { social: true, gaming: true, entertainment: true, messaging: false }, study: { enabled: true, start: '08:00', end: '20:00' } };
    expect(decideAt(c, at(24, 10))).toMatchObject({ mode: 'allowlist', reason: 'exam_study', until: at(24, 20) });
    expect(decideAt(c, at(24, 20, 30)).mode).toBe('open');
  });
  it('exam mode does nothing outside its dates', () => {
    const c = base(); c.limits!.school.enabled = false;
    c.exam = { body: 'WAEC', start_date: '2027-05-03', end_date: '2027-06-18', allowed_packages: [], block: { social: true, gaming: true, entertainment: true, messaging: false }, study: { enabled: true, start: '08:00', end: '20:00' } };
    expect(decideAt(c, at(24, 10)).mode).toBe('open');
  });
  it('locks when the daily limit is used up, until midnight', () => {
    expect(decideAt(base(), at(24, 16), {}, 119).mode).toBe('open');
    expect(decideAt(base(), at(24, 16), {}, 120)).toMatchObject({ reason: 'limit', until: at(25, 0) });
  });
  it('uses the weekend limit on Saturday and Sunday', () => {
    expect(decideAt(base(), at(28, 12), {}, 150).mode).toBe('open');   // limit 180
    expect(decideAt(base(), at(28, 12), {}, 180).reason).toBe('limit');
  });
  it('0 minutes means no limit', () => {
    const c = base(); c.limits!.weekday_mins = 0;
    expect(decideAt(c, at(24, 16), {}, 9999).mode).toBe('open');
  });
  it('a parent with no rules at all means an open phone', () => {
    const c = base(); c.limits = null;
    expect(decideAt(c, at(24, 10), {}, 500).mode).toBe('open');
  });
});

describe('minutesLeft', () => {
  it('counts down and never goes below zero', () => {
    expect(minutesLeft(base(), at(24, 12), 85)).toBe(35);
    expect(minutesLeft(base(), at(24, 12), 500)).toBe(0);
  });
  it('is null with no limit', () => {
    const c = base(); c.limits!.weekday_mins = 0;
    expect(minutesLeft(c, at(24, 12), 10)).toBeNull();
  });
});

describe('segments and policy', () => {
  it('merges minutes into whole windows', () => {
    const segs = buildSegments(base(), {}, at(24, 0), 1);
    expect(segs.map(s => [s.reason, new Date(s.start).getHours(), new Date(s.end).getHours() % 24])).toEqual([
      ['bedtime', 0, 6], ['school', 8, 15], ['bedtime', 21, 0],
    ]);
  });
  it('shows prayer windows only where nothing stronger already locks the phone', () => {
    // Tuesday: Fajr is inside bedtime and Dhuhr is inside school, so only Asr, Maghrib and Isha show up.
    const segs = buildSegments(withPrayer(base()), prayer, at(24, 0), 1).filter(s => s.reason === 'prayer');
    expect(segs.map(s => [new Date(s.start).getHours(), new Date(s.start).getMinutes()])).toEqual([[15, 23], [18, 9], [19, 23]]);
  });
  it('covers a full week', () => {
    const p = buildPolicy(base(), {}, at(24, 12), { lock: 'x' });
    expect(Object.keys(p.limitByDate)).toHaveLength(7);
    expect(p.limitByDate['2026-11-24']).toBe(120);
    expect(p.limitByDate['2026-11-28']).toBe(180);
    expect(p.validUntil - p.generatedAt).toBe(7 * 86400000);
  });
  it('turns backend rules into package and category blocks', () => {
    const c = base();
    c.app_rules = [{ package: null, category: 'social_media', blocked: true, daily_limit_mins: 60 }, { package: 'com.bad.app', category: null, blocked: true, daily_limit_mins: 0 }, { package: null, category: 'gaming', blocked: false, daily_limit_mins: 60 }];
    const p = buildPolicy(c, {}, at(24, 12), {});
    expect(p.blockedPackages).toEqual(expect.arrayContaining(['com.bad.app', 'com.instagram.android', 'com.facebook.katana']));
    expect(p.blockedCategories).toEqual(['social']);
  });
  it('exam whitelist wins over exam blocks', () => {
    const c = base();
    c.exam = { body: 'JAMB', start_date: '2026-11-01', end_date: '2026-12-01', allowed_packages: ['com.google.android.youtube'], block: { social: false, gaming: true, entertainment: true, messaging: false }, study: { enabled: false, start: null, end: null } };
    const p = buildPolicy(c, {}, at(24, 12), {});
    expect(p.blockedPackages).not.toContain('com.google.android.youtube');
    expect(p.blockedPackages).toContain('com.netflix.mediaclient');
    expect(p.blockedCategories).toEqual(expect.arrayContaining(['game', 'video']));
  });
});
