import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, ChildPicker, Empty, Group, Notice, Row, Screen, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';
import { timeAgo } from '../utils/format';

/** Parent side of linking: make a one-time code, the child's phone types it in. */
export default function LinkDeviceScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const child = useSelectedChild();
  const devices = useLoad<any[]>(() => child ? api.get(`/children/${child.id}/devices`).then(r => r.data) : Promise.resolve([]), [child?.id]);
  const [code, setCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setCode(null); }, [child?.id]);
  useEffect(() => {
    if (!code) return;
    const tick = () => setLeft(Math.max(0, Math.round((new Date(code.expires_at).getTime() - Date.now()) / 1000)));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [code]);
  // While a code is showing, check every few seconds whether the phone has linked.
  useEffect(() => { if (!code || left === 0) return; const id = setInterval(devices.reload, 5000); return () => clearInterval(id); }, [code, left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!child) return <Screen title={t('link.title', 'Link a phone')} back><Empty icon="people-outline" title={t('home.empty_title', 'Add your first child')} body={t('link.need_child', 'Add a child first, then link their phone.')} action={t('home.add_child', 'Add a child')} onAction={() => navigation.navigate('AddChild')} /></Screen>;

  const make = async () => {
    setBusy(true);
    try { const { data } = await api.post(`/children/${child.id}/pairing-code`); setCode(data); }
    catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setBusy(false);
  };
  const name = child.full_name.split(' ')[0];
  const live = code && left > 0;
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const list = devices.data || [];

  return (
    <Screen title={t('link.title', 'Link a phone')} subtitle={child.full_name} back onRefresh={devices.reload} refreshing={devices.loading}>
      <ChildPicker />
      <Txt tone="muted">{t('link.intro', 'Make a one-time code, then type it into the NurtureNet app on {{name}}’s phone.', { name })}</Txt>
      {live ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 24, alignItems: 'center', gap: 8 }}>
          <Txt v="caption" tone="muted">{t('link.code_label', 'Code for {{name}}’s phone', { name })}</Txt>
          <Txt accessibilityLabel={code!.code.split('').join(' ')} style={{ fontSize: 44, lineHeight: 52, letterSpacing: 8 }} tone="ink">{code!.code}</Txt>
          <Txt tone="muted">{t('link.expires', 'Works for {{time}} more, once only.', { time: mm })}</Txt>
        </View>
      ) : null}
      {code && left === 0 ? <Notice kind="warn">{t('link.expired', 'That code has expired. Make a new one.')}</Notice> : null}
      <Button label={live ? t('link.new_code', 'Make a new code') : t('link.make_code', 'Make a code')} variant={live ? 'secondary' : 'primary'} onPress={make} loading={busy} />
      <Notice kind="info">{t('link.child_app', 'The NurtureNet app for children’s phones is still in development. The code works as soon as it is released.')}</Notice>
      <View style={{ gap: 8 }}>
        <Txt v="title" tone="ink">{t('link.linked', 'Linked phones')}</Txt>
        {list.length ? <Group>{list.map(d => <Row key={d.id} icon="phone-portrait" tint="safe" title={d.device_name} subtitle={d.last_seen_at ? t('link.seen', 'Last seen {{when}}', { when: timeAgo(d.last_seen_at, t) }) : t('link.not_seen', 'Not seen yet')} />)}</Group>
          : <Txt tone="muted">{t('link.none', 'No phone linked to {{name}} yet.', { name })}</Txt>}
      </View>
    </Screen>
  );
}
