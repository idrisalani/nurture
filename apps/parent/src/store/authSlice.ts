import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage } from '../utils/storage';

export interface Parent { id: string; full_name: string; phone: string; preferred_language: string; subscription_plan: string; }
interface AuthState { token: string | null; refreshToken: string | null; parent: Parent | null; isAuthenticated: boolean; booting: boolean; }
const initialState: AuthState = { token: null, refreshToken: null, parent: null, isAuthenticated: false, booting: true };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, a: PayloadAction<{ accessToken: string; refreshToken: string; parent: Parent }>) => {
      state.token = a.payload.accessToken; state.refreshToken = a.payload.refreshToken;
      state.parent = a.payload.parent; state.isAuthenticated = true; state.booting = false;
      storage.set('token', a.payload.accessToken); storage.set('refreshToken', a.payload.refreshToken);
    },
    restoreSession: (state, a: PayloadAction<{ token: string; refreshToken: string | null; parent: Parent }>) => {
      state.token = a.payload.token; state.refreshToken = a.payload.refreshToken; state.parent = a.payload.parent;
      state.isAuthenticated = true; state.booting = false;
    },
    finishBoot: (state) => { state.booting = false; },
    logout: (state) => {
      state.token = null; state.refreshToken = null; state.parent = null; state.isAuthenticated = false; state.booting = false;
      storage.del('token'); storage.del('refreshToken');
    },
  },
});
export const { setCredentials, restoreSession, finishBoot, logout } = authSlice.actions;
export default authSlice.reducer;
