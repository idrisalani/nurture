import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface Permissions { usageAccess: boolean; accessibility: boolean; batteryUnrestricted: boolean }
export interface AppUsage { package: string; name: string; minutes: number }
interface Native {
  getPermissions(): Promise<Permissions>;
  openSettings(kind: 'usage' | 'accessibility' | 'battery' | 'app'): Promise<void>;
  setPolicy(json: string): Promise<void>;
  startService(): Promise<void>; stopService(): Promise<void>;
  getUsageToday(): Promise<AppUsage[]>; getUsageTotalMinutes(): Promise<number>;
}
const native = Platform.OS === 'android' ? requireOptionalNativeModule<Native>('NurtureEnforcer') : null;

/** Whether the Android enforcement layer is present (false in the browser preview, iOS and Expo Go). */
export const isAvailable = !!native;
const demo: Native = {
  getPermissions: async () => ({ usageAccess: true, accessibility: true, batteryUnrestricted: true }),
  openSettings: async () => {}, setPolicy: async () => {}, startService: async () => {}, stopService: async () => {},
  getUsageToday: async () => [], getUsageTotalMinutes: async () => 0,
};
export default (native ?? demo) as Native;
