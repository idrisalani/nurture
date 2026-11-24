import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store/store';
import './src/i18n';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { ToastProvider } from './src/ui';
import AppNavigator from './src/navigation/AppNavigator';

function Shell() {
  const { scheme } = useTheme();
  return (<><StatusBar style={scheme === 'dark' ? 'light' : 'dark'} /><AppNavigator /></>);
}
export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider><Shell /></ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
