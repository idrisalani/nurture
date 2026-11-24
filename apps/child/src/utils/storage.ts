import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore on phones, localStorage in the browser preview. Never throws.
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return window.localStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch { return null; }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') window.localStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch { /* storage unavailable: keep going without it */ }
  },
  async del(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') window.localStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch { /* ignore */ }
  },
};
