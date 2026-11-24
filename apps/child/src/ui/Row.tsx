import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import Txt from './Txt';
import Icon, { IconName } from './Icon';

/** A grouped list: rows share one surface and are separated by hairlines. */
export function Group({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: radius.group, overflow: 'hidden' }}>
      {items.map((ch, i) => (
        <View key={i}>
          {ch}
          {i < items.length - 1 ? <View style={{ height: 1, backgroundColor: c.line, marginLeft: 64 }} /> : null}
        </View>))}
    </View>
  );
}

interface RowProps { icon?: IconName; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; tint?: 'primary' | 'safe' | 'warn' | 'danger'; chevron?: boolean; }
export function Row({ icon, title, subtitle, right, onPress, tint = 'primary', chevron }: RowProps) {
  const { c } = useTheme();
  const tintBg = { primary: c.primaryTint, safe: c.safeTint, warn: c.warnTint, danger: c.dangerTint }[tint];
  const body = (
    <View style={s.row}>
      {icon ? <View style={[s.icon, { backgroundColor: tintBg }]}><Icon name={icon} tone={tint} size={22} /></View> : null}
      <View style={{ flex: 1 }}>
        <Txt v="label" tone="ink">{title}</Txt>
        {subtitle ? <Txt v="caption" tone="muted">{subtitle}</Txt> : null}
      </View>
      {right}
      {onPress && chevron !== false ? <Icon name="chevron-forward" tone="muted" size={18} /> : null}
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>{body}</Pressable> : body;
}
const s = StyleSheet.create({
  row: { minHeight: 64, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
