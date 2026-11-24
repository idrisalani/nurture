import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import api from '../api/client';
import { syncAll } from './sync';

export const SYNC_TASK = 'nurturenet-sync';
export const LOCATION_TASK = 'nurturenet-location';

// Task bodies must be defined at import time, before React starts (see index.ts).
if (Platform.OS === 'android') {
  TaskManager.defineTask(SYNC_TASK, async () => {
    try { await syncAll(); return BackgroundFetch.BackgroundFetchResult.NewData; } catch { return BackgroundFetch.BackgroundFetchResult.Failed; }
  });
  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
    if (error || !data?.locations?.length) return;
    const c = data.locations[data.locations.length - 1].coords;
    try { await api.post('/location/update', { latitude: c.latitude, longitude: c.longitude, accuracy_metres: Math.round(c.accuracy ?? 0) }); } catch { /* next ping will do */ }
  });
}

export async function startBackgroundWork(notif: { title: string; body: string }) {
  if (Platform.OS !== 'android') return;
  try { await BackgroundFetch.registerTaskAsync(SYNC_TASK, { minimumInterval: 15 * 60, stopOnTerminate: false, startOnBoot: true }); } catch {}
  try {
    const bg = await Location.getBackgroundPermissionsAsync();
    if (bg.granted && !(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced, timeInterval: 5 * 60 * 1000, distanceInterval: 100,
        foregroundService: { notificationTitle: notif.title, notificationBody: notif.body },
      });
    }
  } catch {}
}
export async function stopBackgroundWork() {
  if (Platform.OS !== 'android') return;
  try { await BackgroundFetch.unregisterTaskAsync(SYNC_TASK); } catch {}
  try { if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK); } catch {}
}
