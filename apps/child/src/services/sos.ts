import * as Location from 'expo-location';
import api from '../api/client';
import { readJson, writeJson } from '../utils/cache';

type Fix = { latitude: number; longitude: number; accuracy_metres?: number };
export type SosResult = 'sent' | 'queued' | 'no_location';

async function bestFix(): Promise<Fix | null> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const p = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>(r => setTimeout(() => r(null), 8000)),
    ]);
    const c = p?.coords ?? (await Location.getLastKnownPositionAsync())?.coords;
    return c ? { latitude: c.latitude, longitude: c.longitude, accuracy_metres: c.accuracy ?? undefined } : null;
  } catch { return null; }
}

/** Tell the parent's emergency contacts where the child is. If the network is down the alert waits and is retried. */
export async function sendSos(): Promise<SosResult> {
  const fix = await bestFix();
  if (!fix) return 'no_location';
  try { await api.post('/panic/trigger', fix); return 'sent'; }
  catch {
    const q = (await readJson<Fix[]>('sos_queue')) || [];
    await writeJson('sos_queue', [...q, fix].slice(-3));
    return 'queued';
  }
}
export async function flushSosQueue() {
  const q = (await readJson<Fix[]>('sos_queue')) || [];
  if (!q.length) return;
  const left: Fix[] = [];
  for (const fix of q) { try { await api.post('/panic/trigger', fix); } catch { left.push(fix); } }
  await writeJson('sos_queue', left);
}
