import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function Meter({ ratio, height = 12 }: { ratio: number; height?: number }) {
  const { c } = useTheme();
  const r = Math.max(0, Math.min(1, ratio));
  const fill = r >= 1 ? c.danger : r >= 0.8 ? c.warnFill : c.safeFill;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(r * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${r * 100}%`, height: '100%', borderRadius: height / 2, backgroundColor: fill }} />
    </View>
  );
}
