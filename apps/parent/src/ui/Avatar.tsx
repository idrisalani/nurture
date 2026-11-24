import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';

export default function Avatar({ name, emoji, size = 48 }: { name: string; emoji?: string; size?: number }) {
  const { c } = useTheme();
  const tints = [c.primaryTint, c.safeTint, c.warnTint];
  const tint = tints[(name?.charCodeAt(0) || 0) % tints.length];
  return (
    <View accessibilityElementsHidden style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      {emoji ? <Txt style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{emoji}</Txt>
        : <Txt v="title" tone="ink">{(name || '?').trim().charAt(0).toUpperCase()}</Txt>}
    </View>
  );
}
