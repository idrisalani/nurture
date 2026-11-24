import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { Palette } from '../theme/tokens';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export default function Icon({ name, size = 22, tone = 'text' }: { name: IconName; size?: number; tone?: keyof Palette }) {
  const { c } = useTheme();
  return <Ionicons name={name} size={size} color={c[tone] as string} accessibilityElementsHidden importantForAccessibility="no" />;
}
