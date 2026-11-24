import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import Icon, { IconName } from '../ui/Icon';
import DashboardScreen from '../screens/DashboardScreen';
import ScreenTimeScreen from '../screens/ScreenTimeScreen';
import LocationScreen from '../screens/LocationScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const icons: Record<string, [IconName, IconName]> = {
  Home: ['home', 'home-outline'], Limits: ['time', 'time-outline'], Location: ['location', 'location-outline'],
  Reports: ['bar-chart', 'bar-chart-outline'], Settings: ['settings', 'settings-outline'],
};
export default function BottomTabNavigator() {
  const { c } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const labels: Record<string, string> = {
    Home: t('nav.home', 'Home'), Limits: t('nav.limits', 'Limits'), Location: t('nav.location', 'Location'),
    Reports: t('nav.reports', 'Reports'), Settings: t('nav.settings', 'Settings'),
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.muted,
        tabBarLabel: labels[route.name],
        tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 12, marginBottom: 2 },
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line, height: 62 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 4 },
        tabBarIcon: ({ focused, color }) => <Icon name={icons[route.name][focused ? 0 : 1]} size={24} tone={focused ? 'primary' : 'muted'} />,
      })}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Limits" component={ScreenTimeScreen} />
      <Tab.Screen name="Location" component={LocationScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
