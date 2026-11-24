import axios, { AxiosError } from 'axios';
import { storage } from '../utils/storage';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: BASE_URL, timeout: 12000 });

let onAuthFailure: () => void = () => {};
export const setAuthFailureHandler = (fn: () => void) => { onAuthFailure = fn; };

api.interceptors.request.use(async (config) => {
  const token = await storage.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;
async function refreshToken(): Promise<string | null> {
  const refresh = await storage.get('refreshToken');
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
    await storage.set('token', data.accessToken);
    if (data.refreshToken) await storage.set('refreshToken', data.refreshToken);
    return data.accessToken as string;
  } catch { return null; }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const cfg: any = err.config;
    if (err.response?.status === 401 && cfg && !cfg._retried && !String(cfg.url).includes('/auth/')) {
      cfg._retried = true;
      refreshing = refreshing || refreshToken().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) { cfg.headers.Authorization = `Bearer ${token}`; return api(cfg); }
      onAuthFailure();
    }
    return Promise.reject(err);
  }
);

/** Turn any failure into a short sentence a parent can act on. */
export function apiError(e: unknown, fallback: string, offline: string): string {
  const err = e as AxiosError<{ error?: string }>;
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED' || !err?.response) return offline;
  return fallback;
}
export default api;
