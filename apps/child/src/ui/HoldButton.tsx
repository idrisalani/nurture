import React, { useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon from './Icon';

/** Press and hold to confirm. A child cannot set off an SOS by brushing the screen. */
export default function HoldButton({ label, holdLabel, onComplete, ms = 2500 }: { label: string; holdLabel: string; onComplete: () => void; ms?: number }) {
  const { c } = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [holding, setHolding] = useState(false);
  const start = () => {
    setHolding(true);
    Animated.timing(fill, { toValue: 1, duration: ms, useNativeDriver: false }).start();
    timer.current = setTimeout(() => { setHolding(false); fill.setValue(0); onComplete(); }, ms);
  };
  const stop = () => { setHolding(false); if (timer.current) clearTimeout(timer.current); Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start(); };
  return (
    <Pressable onPressIn={start} onPressOut={stop} accessibilityRole="button" accessibilityLabel={`${label}. ${holdLabel}`}
      style={{ height: 72, borderRadius: 20, backgroundColor: c.dangerTint, overflow: 'hidden', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: c.danger, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Icon name="alert-circle" size={26} tone={holding ? 'onPrimary' : 'danger'} />
        <View><Txt v="label" tone={holding ? 'onPrimary' : 'danger'}>{label}</Txt><Txt v="caption" tone={holding ? 'onPrimary' : 'danger'}>{holdLabel}</Txt></View>
      </View>
    </Pressable>
  );
}
