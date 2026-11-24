import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon from './Icon';

/** Browser preview has no native map. Show the coordinates with a link to an open map instead. */
export default function ChildMap({ latitude, longitude, label }: { latitude: number; longitude: number; label: string; places?: any[] }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`)}
      style={{ height: 240, borderRadius: 18, backgroundColor: c.primaryTint, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Icon name="location" size={36} tone="primary" />
      <View style={{ alignItems: 'center' }}>
        <Txt v="label" tone="ink">{label}</Txt>
        <Txt tone="muted">{latitude.toFixed(4)}, {longitude.toFixed(4)}</Txt>
      </View>
    </Pressable>
  );
}
