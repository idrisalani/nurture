import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import { RootState } from '../store/store';
import { LANGUAGES, setLanguage } from '../store/localeSlice';
import { Chip, Icon, Txt } from '../ui';

/** Shared frame for sign-in screens. Language choice sits at the top because it must work before anyone can read the rest. */
export default function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { c } = useTheme();
  const dispatch = useDispatch();
  const lang = useSelector((s: RootState) => s.locale.language);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield-checkmark" tone="onPrimary" size={22} />
            </View>
            <Txt v="title" tone="ink">NurtureNet</Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGES.map(l => <Chip key={l.code} label={l.label} selected={lang === l.code} onPress={() => dispatch(setLanguage(l.code))} />)}
          </View>
          <View style={{ gap: 6 }}>
            <Txt v="headline" tone="ink" accessibilityRole="header">{title}</Txt>
            {subtitle ? <Txt tone="muted">{subtitle}</Txt> : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
