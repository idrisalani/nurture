import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import Txt from './Txt';

export default function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} accessibilityLabel={label} onPress={onPress}
      style={[s.chip, { backgroundColor: selected ? c.primary : c.surface, borderColor: selected ? c.primary : c.line }]}>
      <Txt v="label" tone={selected ? 'onPrimary' : 'text'}>{label}</Txt>
    </Pressable>
  );
}
const s = StyleSheet.create({ chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center' } });
