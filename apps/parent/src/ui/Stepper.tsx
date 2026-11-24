import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon from './Icon';

interface Props { label: string; value: string; onMinus: () => void; onPlus: () => void; hint?: string; }
export default function Stepper({ label, value, onMinus, onPlus, hint }: Props) {
  const { c } = useTheme();
  const Btn = ({ icon, onPress, a11y }: { icon: 'remove' | 'add'; onPress: () => void; a11y: string }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [s.btn, { backgroundColor: c.primaryTint, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} tone="primary" size={24} />
    </Pressable>);
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Txt v="label" tone="ink">{label}</Txt>
        {hint ? <Txt v="caption" tone="muted">{hint}</Txt> : null}
      </View>
      <Btn icon="remove" onPress={onMinus} a11y={`${label}: less`} />
      <Txt v="title" tone="ink" style={{ minWidth: 84, textAlign: 'center' }} accessibilityLiveRegion="polite">{value}</Txt>
      <Btn icon="add" onPress={onPlus} a11y={`${label}: more`} />
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  btn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
