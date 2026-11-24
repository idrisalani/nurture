import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import Txt from './Txt';
import Icon from './Icon';

interface Props {
  title: string; subtitle?: string; back?: boolean; right?: React.ReactNode; footer?: React.ReactNode;
  children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void; gap?: number;
}
/** Page frame: title sits on the page itself (no coloured band), content scrolls, actions can stick to the bottom. */
export default function Screen({ title, subtitle, back, right, footer, children, refreshing, onRefresh, gap = 20 }: Props) {
  const { c } = useTheme();
  const nav = useNavigation();
  const { t } = useTranslation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: footer ? 24 : 40, gap }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}>
        <View style={s.head}>
          <View style={{ flex: 1, gap: 4 }}>
            {back ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('common.back', 'Back')} onPress={() => nav.goBack()} hitSlop={10}
                style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -6, marginBottom: 4, minHeight: 44 }}>
                <Icon name="chevron-back" tone="primary" size={26} />
              </Pressable>) : null}
            <Txt v="headline" tone="ink" accessibilityRole="header">{title}</Txt>
            {subtitle ? <Txt tone="muted">{subtitle}</Txt> : null}
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
      {footer ? <View style={[s.footer, { backgroundColor: c.bg, borderTopColor: c.line }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
});
