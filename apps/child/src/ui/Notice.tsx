import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon, { IconName } from './Icon';

type Kind = 'info' | 'safe' | 'warn' | 'danger';
const ICON: Record<Kind, IconName> = { info: 'information-circle', safe: 'checkmark-circle', warn: 'alert-circle', danger: 'warning' };
export default function Notice({ kind = 'info', title, children }: { kind?: Kind; title?: string; children?: React.ReactNode }) {
  const { c } = useTheme();
  const bg = { info: c.primaryTint, safe: c.safeTint, warn: c.warnTint, danger: c.dangerTint }[kind];
  const tone = ({ info: 'primary', safe: 'safe', warn: 'warn', danger: 'danger' } as const)[kind];
  return (
    <View accessibilityRole={kind === 'danger' ? 'alert' : undefined} style={[s.box, { backgroundColor: bg }]}>
      <Icon name={ICON[kind]} tone={tone} size={22} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <Txt v="label" tone="ink">{title}</Txt> : null}
        {typeof children === 'string' ? <Txt v="caption" tone="text">{children}</Txt> : children}
      </View>
    </View>
  );
}
const s = StyleSheet.create({ box: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, alignItems: 'flex-start' } });
