import axios, { AxiosError } from 'axios';
import { getSession } from '../state/session';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// The backend identifies a child's phone by these two headers (see deviceAuth.middleware.js).
// If you put nginx in front of the API, set `underscores_in_headers on;` or it will drop them.
api.interceptors.request.use(async (config) => {
  const s = await getSession();
  if (s) { config.headers.device_id = s.device_id; config.headers.child_id = s.child_id; }
  return config;
});
export const isUnlinked = (e: unknown) => (e as AxiosError)?.response?.status === 401;
export const isOffline = (e: unknown) => { const x = e as AxiosError; return !x?.response; };
export const apiMessage = (e: unknown, fallback: string, offline: string) => {
  const x = e as AxiosError<{ error?: string }>;
  return x?.response?.data?.error || (isOffline(e) ? offline : fallback);
};
export default api;
