import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon from './Icon';

type Kind = 'safe' | 'danger' | 'info';
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const [toast, setToast] = useState<{ msg: string; kind: Kind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((msg: string, kind: Kind = 'safe') => {
    setToast({ msg, kind });
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null)), 2800);
  }, [opacity]);
  return (
    <Ctx.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: 20, right: 20, bottom: 96, opacity }}>
          <View style={{ backgroundColor: c.ink, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name={toast.kind === 'danger' ? 'alert-circle' : toast.kind === 'info' ? 'information-circle' : 'checkmark-circle'} tone="bg" size={20} />
            <Txt tone="bg" style={{ flex: 1 }}>{toast.msg}</Txt>
          </View>
        </Animated.View>) : null}
    </Ctx.Provider>
  );
}
