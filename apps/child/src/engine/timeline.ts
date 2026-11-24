import { Config, NativePolicy, PrayerTimes, Segment, Reason } from './types';
import { addDays, nextMidnight, ymd } from './time';
import { decideAt, dailyLimit } from './decide';
import { CATEGORY_RULES, PACKAGES } from './categories';

/**
 * Walk the next `days` days minute by minute and merge the result into a few segments.
 * The phone enforces these offline. Daily-limit locking is NOT in the segments: it depends on live usage, so the native side does it.
 */
export function buildSegments(cfg: Config, prayer: PrayerTimes, from: Date, days = 7): Segment[] {
  const out: Segment[] = [];
  const end = from.getTime() + days * 86400000;
  const t0 = new Date(from); t0.setSeconds(0, 0);
  let cur: Segment | null = null;
  for (let t = t0.getTime(); t < end; t += 60000) {
    const d = decideAt(cfg, new Date(t), prayer); // no usage => no 'limit'
    if (d.mode === 'open') { if (cur) { out.push(cur); cur = null; } continue; }
    if (cur && cur.mode === d.mode && cur.reason === d.reason && cur.end === t) cur.end = t + 60000;
    else { if (cur) out.push(cur); cur = { start: t, end: t + 60000, mode: d.mode, reason: d.reason as Reason }; }
  }
  if (cur) out.push(cur);
  // A manual pause with no end time lasts until the parent resumes: keep it going to the end of the window.
  return out;
}

export function buildPolicy(cfg: Config, prayer: PrayerTimes, now: Date, strings: Record<string, string>, days = 7): NativePolicy {
  const blockedPackages = new Set<string>();
  const blockedCategories = new Set<'game' | 'social' | 'video'>();
  for (const r of cfg.app_rules) {
    if (!r.blocked) continue;
    if (r.package) blockedPackages.add(r.package);
    const rule = r.category ? CATEGORY_RULES[r.category] : undefined;
    if (rule) { rule.packages.forEach(p => blockedPackages.add(p)); if (rule.android) blockedCategories.add(rule.android); }
  }
  if (cfg.exam && ymd(now) >= String(cfg.exam.start_date).slice(0, 10) && ymd(now) <= String(cfg.exam.end_date).slice(0, 10)) {
    const b = cfg.exam.block;
    if (b.social) { PACKAGES.social.forEach(p => blockedPackages.add(p)); blockedCategories.add('social'); }
    if (b.gaming) blockedCategories.add('game');
    if (b.entertainment) { PACKAGES.entertainment.forEach(p => blockedPackages.add(p)); blockedCategories.add('video'); }
    if (b.messaging) PACKAGES.messaging.forEach(p => blockedPackages.add(p));
  }
  const allowed = new Set(cfg.exam?.allowed_packages || []);
  // never block something the exam whitelist explicitly allows
  allowed.forEach(p => blockedPackages.delete(p));
  const limitByDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) { const d = addDays(now, i); limitByDate[ymd(d)] = dailyLimit(cfg, d); }
  return {
    version: 1, generatedAt: now.getTime(), validUntil: now.getTime() + days * 86400000,
    segments: buildSegments(cfg, prayer, now, days), limitByDate,
    blockedPackages: [...blockedPackages], blockedCategories: [...blockedCategories], allowedPackages: [...allowed], strings,
  };
}
export { nextMidnight };
