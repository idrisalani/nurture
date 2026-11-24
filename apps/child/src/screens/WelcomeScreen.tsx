import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, Group, Icon, Row, Txt, Chip } from '../ui';
import { LANGUAGES } from '../i18n';

export default function WelcomeScreen({ lang, onLang, onNext }: { lang: string; onLang: (l: string) => void; onNext: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 20, gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}><Icon name="shield-checkmark" tone="onPrimary" size={24} /></View>
        <Txt v="title" tone="ink">NurtureNet</Txt>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{LANGUAGES.map(l => <Chip key={l.code} label={l.label} selected={lang === l.code} onPress={() => onLang(l.code)} />)}</View>
      <View style={{ gap: 8 }}>
        <Txt v="headline" tone="ink">{t('welcome.title', 'Hi! This phone uses NurtureNet.')}</Txt>
        <Txt v="bodyL" tone="muted">{t('welcome.sub', 'Your parent chose it to help you use your phone in a healthy way. Here is what it does.')}</Txt>
      </View>
      <Group>
        <Row icon="time" title={t('welcome.time', 'Keeps rules your parent set')} subtitle={t('welcome.time_sub', 'Like time for sleep, school and prayer.')} />
        <Row icon="location" title={t('welcome.where', 'Shares where your phone is')} subtitle={t('welcome.where_sub', 'So your parent knows you are safe.')} />
        <Row icon="alert-circle" tint="danger" title={t('welcome.sos', 'Lets you ask for help')} subtitle={t('welcome.sos_sub', 'Hold the red button and your family is told where you are.')} />
      </Group>
      <Txt tone="muted">{t('welcome.no_read', 'NurtureNet does not read your messages, photos or passwords. It always shows a notice when it is on.')}</Txt>
      <View style={{ flex: 1 }} />
      <Button label={t('welcome.cta', 'I have a code from my parent')} onPress={onNext} />
    </SafeAreaView>
  );
}
