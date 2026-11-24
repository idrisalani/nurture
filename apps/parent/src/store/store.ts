import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import childReducer from './childSlice';
import localeReducer from './localeSlice';
import alertsReducer from './alertsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    children: childReducer,
    locale: localeReducer,
    alerts: alertsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
