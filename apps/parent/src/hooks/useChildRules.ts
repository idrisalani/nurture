import api from '../services/axios.client';
import { useLoad } from './useLoad';
import { toMin } from '../utils/time';

export interface Rules {
  limits: any | null; prayer: any | null; exam: any | null; prayerTimes: Record<string, string>; used: number; limitToday: number; paused: boolean;
}
const safe = <T,>(p: Promise<{ data: T }>, fb: T): Promise<T> => p.then(r => r.data).catch(() => fb);

/** Everything the Home screen needs about one child, loaded in parallel. One failed call does not blank the screen. */
export function useChildRules(childId: string | null) {
  return useLoad<Rules | null>(async () => {
    if (!childId) return null;
    const [summary, limits, prayer, exam] = await Promise.all([
      safe<any>(api.get(`/children/${childId}/summary`), null),
      safe<any>(api.get(`/screentime/${childId}`), null),
      safe<any>(api.get(`/prayer/schedule/${childId}`), {}),
      safe<any>(api.get(`/exam/${childId}`), { is_active: false }),
    ]);
    let prayerTimes: Record<string, string> = {};
    if (prayer?.is_enabled && prayer?.city) {
      const r: any = await safe<any>(api.get(`/prayer/times`, { params: { city: prayer.city } }), {});
      prayerTimes = r?.timings || {};
    }
    const day = new Date().getDay();
    const weekend = day === 0 || day === 6;
    const l = limits?.limits;
    return {
      limits: l || null, prayer: prayer?.id ? prayer : null, exam: exam?.is_active ? exam : null, prayerTimes,
      used: Number(summary?.today_mins_used || 0),
      limitToday: Number(weekend ? l?.weekend_limit_mins : l?.weekday_limit_mins) || 0,
      paused: !!l?.internet_paused,
    };
  }, [childId]);
}
export { toMin };
