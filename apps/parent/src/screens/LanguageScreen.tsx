import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { LANGUAGES, setLanguage } from '../store/localeSlice';
import { Group, Icon, Notice, Row, Screen } from '../ui';
import api from '../services/axios.client';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const lang = useSelector((s: RootState) => s.locale.language);
  const pick = (code: string) => { dispatch(setLanguage(code)); api.put('/auth/profile', { preferred_language: code }).catch(() => {}); };
  return (
    <Screen title={t('lang.title', 'Language')} back>
      <Group>
        {LANGUAGES.map(l => <Row key={l.code} title={l.label} onPress={() => pick(l.code)} right={lang === l.code ? <Icon name="checkmark-circle" tone="safe" size={26} /> : undefined} />)}
      </Group>
      {lang !== 'en' ? <Notice kind="info">{t('lang.draft', 'Some words may still be in English. Translations are being checked by native speakers.')}</Notice> : null}
    </Screen>
  );
}
