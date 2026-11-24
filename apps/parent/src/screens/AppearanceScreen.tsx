import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Group, Icon, Row, Screen } from '../ui';

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { appearance, setAppearance } = useTheme();
  const opts: { k: 'auto' | 'light' | 'dark'; label: string; icon: any }[] = [
    { k: 'auto', label: t('appearance.auto', 'Match my phone'), icon: 'phone-portrait-outline' },
    { k: 'light', label: t('appearance.light', 'Light'), icon: 'sunny-outline' },
    { k: 'dark', label: t('appearance.dark', 'Dark'), icon: 'moon-outline' },
  ];
  return (
    <Screen title={t('appearance.title', 'Appearance')} back>
      <Group>{opts.map(o => <Row key={o.k} icon={o.icon} title={o.label} onPress={() => setAppearance(o.k)} right={appearance === o.k ? <Icon name="checkmark-circle" tone="safe" size={26} /> : undefined} />)}</Group>
    </Screen>
  );
}
