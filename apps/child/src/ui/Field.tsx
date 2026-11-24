import React, { useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/tokens';
import Txt from './Txt';
import Icon from './Icon';

interface Props extends TextInputProps { label: string; hint?: string; error?: string; prefix?: string; secureToggle?: boolean; }
export default function Field({ label, hint, error, prefix, secureToggle, style, ...rest }: Props) {
  const { c } = useTheme();
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(!!secureToggle);
  const border = error ? c.danger : focus ? c.primary : c.line;
  return (
    <View style={{ gap: 6 }}>
      <Txt v="label" tone="ink">{label}</Txt>
      <View style={[s.box, { backgroundColor: c.surface, borderColor: border, borderWidth: focus || error ? 2 : 1.5 }]}>
        {prefix ? <Txt tone="muted" style={{ marginRight: 8 }}>{prefix}</Txt> : null}
        <TextInput
          {...rest} accessibilityLabel={label} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          secureTextEntry={secureToggle ? hidden : rest.secureTextEntry}
          placeholderTextColor={c.muted}
          style={[{ flex: 1, fontFamily: fonts.regular, fontSize: 17, color: c.ink, paddingVertical: 12, outlineStyle: 'none' } as any, style]} />
        {secureToggle ? (
          <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden(h => !h)} hitSlop={10}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} tone="muted" />
          </Pressable>) : null}
      </View>
      {error ? <Txt v="caption" tone="danger">{error}</Txt> : hint ? <Txt v="caption" tone="muted">{hint}</Txt> : null}
    </View>
  );
}
const s = StyleSheet.create({ box: { minHeight: 54, borderRadius: radius.field, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' } });
