import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import Txt from './Txt';
import Icon, { IconName } from './Icon';

interface Props {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  icon?: IconName; loading?: boolean; disabled?: boolean; style?: ViewStyle; small?: boolean;
}
export default function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style, small }: Props) {
  const { c } = useTheme();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : variant === 'secondary' ? c.primaryTint : 'transparent';
  const fg = variant === 'primary' ? 'onPrimary' : variant === 'danger' ? 'onPrimary' : 'primary';
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [s.base, { backgroundColor: bg, minHeight: small ? 44 : 52, opacity: off ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={c[fg as 'primary']} /> : (
        <View style={s.inner}>
          {icon ? <Icon name={icon} size={20} tone={fg as 'primary'} /> : null}
          <Txt v="label" tone={fg as 'primary'}>{label}</Txt>
        </View>)}
    </Pressable>
  );
}
const s = StyleSheet.create({
  base: { borderRadius: radius.field + 4, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
