import { storage } from '../utils/storage';
import { readJson, writeJson } from '../utils/cache';
import { Config, PrayerTimes } from '../engine/types';

export interface Session { device_id: string; child_id: string }
export const getSession = async (): Promise<Session | null> => {
  const [d, c] = await Promise.all([storage.get('device_id'), storage.get('child_id')]);
  return d && c ? { device_id: d, child_id: c } : null;
};
export const saveSession = async (s: Session) => { await storage.set('device_id', s.device_id); await storage.set('child_id', s.child_id); };
export const clearSession = async () => { await storage.del('device_id'); await storage.del('child_id'); await writeJson('config', null); await writeJson('prayer', null); await writeJson('sos_queue', null); };

export const loadConfig = () => readJson<Config>('config');
export const saveConfig = (c: Config) => writeJson('config', c);
export const loadPrayer = () => readJson<{ city: string; times: PrayerTimes }>('prayer');
export const savePrayer = (p: { city: string; times: PrayerTimes }) => writeJson('prayer', p);
export const loadLastSync = async () => Number((await storage.get('last_sync')) || 0);
export const saveLastSync = (t: number) => storage.set('last_sync', String(t));
