import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import Enforcer from '../../modules/nurturenet-enforcer';

export interface PermState { usage: boolean; accessibility: boolean; location: boolean; backgroundLocation: boolean; notifications: boolean; battery: boolean }
export async function readPermissions(): Promise<PermState> {
  const p = await Enforcer.getPermissions();
  let location = false, backgroundLocation = false, notifications = true;
  try { location = (await Location.getForegroundPermissionsAsync()).granted; backgroundLocation = (await Location.getBackgroundPermissionsAsync()).granted; } catch {}
  try { if (Platform.OS === 'android' && Number(Platform.Version) >= 33) notifications = await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS' as any); } catch {}
  return { usage: p.usageAccess, accessibility: p.accessibility, location, backgroundLocation, notifications, battery: p.batteryUnrestricted };
}
export async function askLocation() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.granted) await Location.requestBackgroundPermissionsAsync();
}
export async function askNotifications() {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any);
}
