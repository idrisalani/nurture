import React from 'react';
import { RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';

export default function ChildScreen({ title, subtitle, children, footer, onRefresh, refreshing }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; onRefresh?: () => void; refreshing?: boolean }) {
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: footer ? 24 : 40, gap: 18 }} keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}>
        <View style={{ gap: 6 }}>
          <Txt v="headline" tone="ink" accessibilityRole="header">{title}</Txt>
          {subtitle ? <Txt tone="muted" v="bodyL">{subtitle}</Txt> : null}
        </View>
        {children}
      </ScrollView>
      {footer ? <View style={[s.footer, { backgroundColor: c.bg, borderTopColor: c.line }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({ footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1, gap: 10 } });
