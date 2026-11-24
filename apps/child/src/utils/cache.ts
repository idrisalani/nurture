import { Platform } from 'react-native';
import * as FS from 'expo-file-system';

// Rules and prayer times can be bigger than SecureStore allows, so they live in a plain file. Credentials stay in SecureStore.
const dir = () => (FS.documentDirectory || '');
export async function readJson<T>(name: string): Promise<T | null> {
  try {
    if (Platform.OS === 'web') { const v = window.localStorage.getItem('cache_' + name); return v ? JSON.parse(v) : null; }
    const p = dir() + name + '.json';
    if (!(await FS.getInfoAsync(p)).exists) return null;
    return JSON.parse(await FS.readAsStringAsync(p));
  } catch { return null; }
}
export async function writeJson(name: string, value: unknown): Promise<void> {
  try {
    if (Platform.OS === 'web') { window.localStorage.setItem('cache_' + name, JSON.stringify(value)); return; }
    await FS.writeAsStringAsync(dir() + name + '.json', JSON.stringify(value));
  } catch { /* cache is best effort */ }
}
