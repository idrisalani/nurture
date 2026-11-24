import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { View } from 'react-native';
import { RootState } from '../store/store';
import { finishBoot, logout, restoreSession } from '../store/authSlice';
import { setLanguage } from '../store/localeSlice';
import api, { setAuthFailureHandler } from '../services/axios.client';
import { storage } from '../utils/storage';
import { useTheme } from '../theme/ThemeProvider';
import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import { MainStackParams } from './types';
import AddChildScreen from '../screens/AddChildScreen';
import PrayerTimeScreen from '../screens/PrayerTimeScreen';
import ExamModeScreen from '../screens/ExamModeScreen';
import PanicButtonScreen from '../screens/PanicButtonScreen';
import AlertsScreen from '../screens/AlertsScreen';
import FilterScreen from '../screens/FilterScreen';
import PlansScreen from '../screens/PlansScreen';
import LinkDeviceScreen from '../screens/LinkDeviceScreen';
import LanguageScreen from '../screens/LanguageScreen';
import AppearanceScreen from '../screens/AppearanceScreen';

const Stack = createNativeStackNavigator<MainStackParams>();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { c, scheme } = useTheme();
  const { isAuthenticated, booting } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    setAuthFailureHandler(() => dispatch(logout()));
    (async () => {
      const lang = await storage.get('language');
      if (lang) dispatch(setLanguage(lang));
      const token = await storage.get('token');
      if (!token) { dispatch(finishBoot()); return; }
      try {
        const { data } = await api.get('/auth/me');
        dispatch(restoreSession({ token: (await storage.get('token')) || token, refreshToken: await storage.get('refreshToken'), parent: data }));
      } catch (e: any) {
        // Offline at start-up should not sign the parent out; only a real auth failure does.
        if (e?.response?.status === 401) dispatch(logout()); else dispatch(finishBoot());
      }
    })();
  }, [dispatch]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: c.bg, card: c.surface, text: c.text, border: c.line, primary: c.primary } };

  if (booting) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="Tabs" component={BottomTabNavigator} />
          <Stack.Screen name="AddChild" component={AddChildScreen} />
          <Stack.Screen name="Prayer" component={PrayerTimeScreen} />
          <Stack.Screen name="Exam" component={ExamModeScreen} />
          <Stack.Screen name="Panic" component={PanicButtonScreen} />
          <Stack.Screen name="Alerts" component={AlertsScreen} />
          <Stack.Screen name="Filter" component={FilterScreen} />
          <Stack.Screen name="Plans" component={PlansScreen} />
          <Stack.Screen name="LinkDevice" component={LinkDeviceScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Appearance" component={AppearanceScreen} />
        </Stack.Navigator>
      ) : <AuthNavigator />}
    </NavigationContainer>
  );
}
