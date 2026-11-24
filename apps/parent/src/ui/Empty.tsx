import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon, { IconName } from './Icon';
import Button from './Button';

export default function Empty({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 32, paddingHorizontal: 16 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} tone="primary" size={30} />
      </View>
      <Txt v="title" tone="ink" center>{title}</Txt>
      <Txt tone="muted" center style={{ maxWidth: 320 }}>{body}</Txt>
      {action && onAction ? <Button label={action} onPress={onAction} style={{ marginTop: 8, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}
