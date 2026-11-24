import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, NotoSans_400Regular, NotoSans_600SemiBold, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { ToastProvider } from './src/ui';
import i18n from './src/i18n';
import { useTranslation } from 'react-i18next';
import { getSession } from './src/state/session';
import { readPermissions } from './src/services/permissions';
import { storage } from './src/utils/storage';
import WelcomeScreen from './src/screens/WelcomeScreen';
import PairScreen from './src/screens/PairScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import HomeScreen from './src/screens/HomeScreen';

type Stage = 'boot' | 'welcome' | 'pair' | 'permissions' | 'home';

function Root() {
  const { c, scheme } = useTheme();
  const { i18n: i } = useTranslation();
  const [stage, setStage] = useState<Stage>('boot');
  const lang = i.language;

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s) return setStage('welcome');
      const p = await readPermissions().catch(() => null);
      setStage(p && p.usage && p.accessibility ? 'home' : 'permissions');
    })();
  }, []);
  const setLang = useCallback((code: string) => { storage.set('language', code); i18n.changeLanguage(code); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {stage === 'boot' ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.primary} /></View> : null}
      {stage === 'welcome' ? <WelcomeScreen lang={lang} onLang={setLang} onNext={() => setStage('pair')} /> : null}
      {stage === 'pair' ? <PairScreen onBack={() => setStage('welcome')} onDone={() => setStage('permissions')} /> : null}
      {stage === 'permissions' ? <PermissionsScreen onDone={() => setStage('home')} /> : null}
      {stage === 'home' ? <HomeScreen lang={lang} onUnlinked={() => setStage('welcome')} onFixPermissions={() => setStage('permissions')} /> : null}
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ NotoSans_400Regular, NotoSans_600SemiBold, NotoSans_700Bold });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <Root />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
