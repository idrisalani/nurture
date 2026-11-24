import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { type, TypeVariant, Palette } from '../theme/tokens';

export type Tone = 'bg' | 'ink' | 'text' | 'muted' | 'primary' | 'onPrimary' | 'safe' | 'warn' | 'danger';
interface Props extends TextProps { v?: TypeVariant; tone?: Tone; center?: boolean; }

export default function Txt({ v = 'body', tone = 'text', center, style, ...rest }: Props) {
  const { c } = useTheme();
  const t = type[v];
  const s: TextStyle = { fontFamily: t.font, fontSize: t.size, lineHeight: t.line, color: c[tone as keyof Palette] as string, textAlign: center ? 'center' : undefined };
  return <Text {...rest} style={[s, style]} />;
}
