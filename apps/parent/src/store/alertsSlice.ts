import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert { id: string; alert_type: string; severity: string; title_en: string; body_en: string; is_read: boolean; created_at: string; metadata?: any; }

const alertsSlice = createSlice({
  name: 'alerts',
  initialState: { alerts: [] as Alert[], unreadCount: 0 },
  reducers: {
    setAlerts: (state, action: PayloadAction<Alert[]>) => { state.alerts = action.payload; state.unreadCount = action.payload.filter(a => !a.is_read).length; },
    markRead: (state, action: PayloadAction<string>) => { const a = state.alerts.find(x => x.id === action.payload); if (a && !a.is_read) { a.is_read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); } },
  },
});

export const { setAlerts, markRead } = alertsSlice.actions;
export default alertsSlice.reducer;
