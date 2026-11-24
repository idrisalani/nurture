import React, { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, Icon, Notice, Txt } from '../ui';
import ChildScreen from '../ui/ChildScreen';
import Enforcer from '../../modules/nurturenet-enforcer';
import { askLocation, askNotifications, PermState, readPermissions } from '../services/permissions';

export default function PermissionsScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const [p, setP] = useState<PermState | null>(null);
  const refresh = useCallback(async () => setP(await readPermissions()), []);
  useEffect(() => { refresh(); const s = AppState.addEventListener('change', st => st === 'active' && refresh()); return () => s.remove(); }, [refresh]);
  if (!p) return null;

  const steps: { key: keyof PermState; icon: any; title: string; why: string; cta: string; act: () => Promise<void>; need: boolean }[] = [
    { key: 'usage', icon: 'stats-chart', need: true, title: t('perm.usage', 'See which apps you use'), why: t('perm.usage_why', 'So NurtureNet can count your screen time. Android will open a list: find NurtureNet and switch it on.'), cta: t('perm.open', 'Open settings'), act: () => Enforcer.openSettings('usage') },
    { key: 'accessibility', icon: 'hand-left', need: true, title: t('perm.access', 'Pause apps when the rules say so'),
      why: t('perm.access_why', 'NurtureNet uses the Accessibility setting only to see which app is on screen, so it can show a rest page at bedtime, school or prayer. It does not read what you type, your messages or your passwords. In the list, tap NurtureNet and switch it on.'), cta: t('perm.open', 'Open settings'), act: () => Enforcer.openSettings('accessibility') },
    { key: 'location', icon: 'location', need: false, title: t('perm.loc', 'Share where you are'), why: t('perm.loc_why', 'So your parent can see you are safe. Choose "Allow all the time" so it keeps working when the app is closed.'), cta: t('perm.allow', 'Allow'), act: askLocation },
    { key: 'notifications', icon: 'notifications', need: false, title: t('perm.notif', 'Show the "NurtureNet is on" notice'), why: t('perm.notif_why', 'NurtureNet always tells you when it is on.'), cta: t('perm.allow', 'Allow'), act: askNotifications },
    { key: 'battery', icon: 'battery-charging', need: false, title: t('perm.battery', 'Keep working in the background'), why: t('perm.battery_why', 'Stops the phone from switching NurtureNet off to save battery.'), cta: t('perm.allow', 'Allow'), act: () => Enforcer.openSettings('battery') },
  ];
  const ready = p.usage && p.accessibility;
  return (
    <ChildScreen title={t('perm.title', 'Let NurtureNet work')} subtitle={t('perm.sub', 'Switch these on one by one. Come back here after each one.')}
      footer={<Button label={ready ? t('perm.done', 'Done') : t('perm.need', 'Switch on the first two to continue')} onPress={onDone} disabled={!ready} />}>
      {steps.map(s => {
        const ok = p[s.key];
        return (
          <View key={s.key} style={{ backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: ok ? c.safeTint : c.primaryTint, alignItems: 'center', justifyContent: 'center' }}><Icon name={ok ? 'checkmark' : s.icon} tone={ok ? 'safe' : 'primary'} /></View>
              <View style={{ flex: 1 }}><Txt v="label" tone="ink">{s.title}</Txt>{!s.need && !ok ? <Txt v="caption" tone="muted">{t('perm.optional', 'Recommended')}</Txt> : null}</View>
            </View>
            {!ok ? <><Txt tone="muted">{s.why}</Txt><Button small variant="secondary" label={s.cta} onPress={async () => { await s.act(); refresh(); }} /></> : null}
          </View>
        );
      })}
      {!p.location ? <Notice kind="info">{t('perm.loc_note', 'Without location, your parent cannot see where you are and SOS cannot share it.')}</Notice> : null}
    </ChildScreen>
  );
}
