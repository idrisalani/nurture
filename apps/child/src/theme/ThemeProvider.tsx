import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useFonts, NotoSans_400Regular, NotoSans_600SemiBold, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import { palettes, Palette, Scheme } from './tokens';
import { storage } from '../utils/storage';

export type Appearance = 'auto' | 'light' | 'dark';
interface Ctx { c: Palette; scheme: Scheme; appearance: Appearance; setAppearance: (a: Appearance) => void; }
const ThemeCtx = createContext<Ctx>({ c: palettes.light, scheme: 'light', appearance: 'auto', setAppearance: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>('auto');
  const [fontsLoaded, fontError] = useFonts({ NotoSans_400Regular, NotoSans_600SemiBold, NotoSans_700Bold });

  useEffect(() => {
    storage.get('appearance').then(v => { if (v === 'light' || v === 'dark' || v === 'auto') setAppearanceState(v); });
  }, []);
  const setAppearance = (a: Appearance) => { setAppearanceState(a); storage.set('appearance', a); };

  const scheme: Scheme = appearance === 'auto' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  const value = useMemo(() => ({ c: palettes[scheme], scheme, appearance, setAppearance }), [scheme, appearance]);
  if (!fontsLoaded && !fontError) return null; // splash screen stays up
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
