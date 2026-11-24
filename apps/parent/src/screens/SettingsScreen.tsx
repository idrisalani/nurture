import React from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { LANGUAGES } from '../store/localeSlice';
import { useTheme } from '../theme/ThemeProvider';
import { Avatar, Button, Group, Row, Screen, Txt } from '../ui';
import api from '../services/axios.client';
import { confirm } from '../utils/confirm';

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export default function SettingsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { c, appearance } = useTheme();
  const dispatch = useDispatch();
  const parent = useSelector((s: RootState) => s.auth.parent);
  const lang = useSelector((s: RootState) => s.locale.language);
  const out = async () => {
    if (!(await confirm(t('settings.logout_title', 'Sign out?'), t('settings.logout_body', 'Your rules stay saved. You can sign back in any time.'), t('settings.logout', 'Sign out'), t('common.cancel', 'Cancel')))) return;
    api.post('/auth/logout').catch(() => {});
    dispatch(logout());
  };
  return (
    <Screen title={t('settings.title', 'Settings')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.surface, borderRadius: 24, padding: 18 }}>
        <Avatar name={parent?.full_name || '?'} size={56} />
        <View style={{ flex: 1 }}><Txt v="title" tone="ink">{parent?.full_name}</Txt><Txt tone="muted">{parent?.phone}</Txt></View>
      </View>
      <Group>
        <Row icon="diamond" title={t('settings.plan', 'Plan')} subtitle={cap(parent?.subscription_plan || 'free')} onPress={() => navigation.navigate('Plans')} chevron />
        <Row icon="phone-portrait" title={t('link.title', 'Link a phone')} subtitle={t('settings.link_sub', 'Make a code for your child’s phone')} onPress={() => navigation.navigate('LinkDevice')} chevron />
      </Group>
      <Group>
        <Row icon="language" title={t('lang.title', 'Language')} subtitle={LANGUAGES.find(l => l.code === lang)?.label} onPress={() => navigation.navigate('Language')} chevron />
        <Row icon="contrast" title={t('appearance.title', 'Appearance')} subtitle={t(`appearance.${appearance}`, appearance)} onPress={() => navigation.navigate('Appearance')} chevron />
        <Row icon="notifications" title={t('alerts.title', 'Alerts')} onPress={() => navigation.navigate('Alerts')} chevron />
      </Group>
      <Button variant="danger" label={t('settings.logout', 'Sign out')} onPress={out} />
      <Txt v="caption" tone="muted" center>NurtureNet 1.0</Txt>
    </Screen>
  );
}
