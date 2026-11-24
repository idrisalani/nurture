import i18n from '../i18n';
import api, { isOffline, isUnlinked } from '../api/client';
import Enforcer from '../../modules/nurturenet-enforcer';
import { Config, PrayerTimes } from '../engine/types';
import { buildPolicy } from '../engine/timeline';
import { clearSession, getSession, loadConfig, loadPrayer, saveConfig, saveLastSync, savePrayer } from '../state/session';
import { lockStrings } from './lockStrings';
import { flushSosQueue } from './sos';

export type SyncResult = { ok: boolean; unlinked?: boolean; offline?: boolean; config: Config | null; prayer: PrayerTimes };

/** Pull the parent's rules, hand them to the Android enforcer, report usage. Safe to call as often as you like. */
export async function syncAll(): Promise<SyncResult> {
  const session = await getSession();
  if (!session) return { ok: false, unlinked: true, config: null, prayer: {} };

  let config = await loadConfig(); let offline = false;
  try { config = (await api.get<Config>('/devices/config')).data; await saveConfig(config); }
  catch (e) {
    if (isUnlinked(e)) { await clearSession(); try { await Enforcer.stopService(); } catch {} return { ok: false, unlinked: true, config: null, prayer: {} }; }
    offline = isOffline(e);
  }
  if (!config) return { ok: false, offline, config: null, prayer: {} };

  let prayer: PrayerTimes = {};
  const cached = await loadPrayer();
  if (config.prayer) {
    try { prayer = (await api.get('/prayer/times', { params: { city: config.prayer.city } })).data.timings || {}; await savePrayer({ city: config.prayer.city, times: prayer }); }
    catch { if (cached && cached.city === config.prayer.city) prayer = cached.times; }
  }

  try {
    const policy = buildPolicy(config, prayer, new Date(), lockStrings(i18n.t.bind(i18n) as any));
    await Enforcer.setPolicy(JSON.stringify(policy));
    await Enforcer.startService();
  } catch { /* the enforcer is missing (browser preview) or a permission is off: the home screen explains */ }

  if (!offline) {
    try {
      const usage = await Enforcer.getUsageToday();
      if (usage.length) await api.post('/screentime/sync', { usage: usage.map(u => ({ app_package: u.package, app_name: u.name, minutes_used: u.minutes })) });
      await api.post('/devices/heartbeat', { app_version: '1.0.0' });
      await flushSosQueue();
      await saveLastSync(Date.now());
    } catch { /* will retry on the next sync */ }
  }
  return { ok: !offline, offline, config, prayer };
}
