import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, ChildMap, ChildPicker, Empty, Group, Notice, Row, Screen, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';
import { timeAgo } from '../utils/format';
import { confirm } from '../utils/confirm';

const SMS_NUMBER = process.env.EXPO_PUBLIC_SMS_LOCATE_NUMBER || '';
const KINDS: { key: string; icon: any; label: [string, string] }[] = [
  { key: 'home', icon: 'home', label: ['place.home', 'Home'] }, { key: 'school', icon: 'school', label: ['place.school', 'School'] },
];

export default function LocationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const child = useSelectedChild();
  const loc = useLoad<any>(() => child ? api.get(`/location/${child.id}`).then(r => r.data).catch(e => { if (e?.response?.status === 404) return null; throw e; }) : Promise.resolve(null), [child?.id]);
  const places = useLoad<any[]>(() => api.get('/location/places').then(r => r.data), []);
  const [saving, setSaving] = useState('');

  if (!child) return <Screen title={t('loc.title', 'Location')}><Empty icon="location-outline" title={t('home.empty_title', 'Add your first child')} body={t('loc.empty', 'Add a child to see where they are.')} action={t('home.add_child', 'Add a child')} onAction={() => navigation.navigate('AddChild')} /></Screen>;

  const l = loc.data;
  const name = child.full_name.split(' ')[0];
  const savePlace = async (kind: typeof KINDS[number]) => {
    if (!l) return;
    setSaving(kind.key);
    try {
      await api.post('/location/places', { name: t(...kind.label), latitude: Number(l.latitude), longitude: Number(l.longitude), radius_metres: 150, icon: kind.icon, alert_on_arrive: true, alert_on_leave: true });
      toast(t('loc.place_saved', '{{place}} saved. You will get an alert when {{name}} arrives or leaves.', { place: t(...kind.label), name }), 'safe'); places.reload();
    } catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setSaving('');
  };
  const removePlace = async (p: any) => {
    if (!(await confirm(t('loc.remove_title', 'Remove {{place}}?', { place: p.name }), t('loc.remove_body', 'You will stop getting alerts for this place.'), t('common.remove', 'Remove'), t('common.cancel', 'Cancel')))) return;
    try { await api.delete(`/location/places/${p.id}`); places.reload(); } catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
  };

  return (
    <Screen title={t('loc.title', 'Location')} subtitle={child.full_name} onRefresh={() => { loc.reload(); places.reload(); }} refreshing={loc.loading}>
      <ChildPicker />
      {loc.failed && !l ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {l ? (
        <View style={{ gap: 12 }}>
          <ChildMap latitude={Number(l.latitude)} longitude={Number(l.longitude)} label={name} places={places.data || []} />
          <Txt v="bodyL" tone="ink">{t('loc.last_seen', '{{name}} was last seen {{when}}.', { name, when: timeAgo(l.recorded_at || l.last_seen, t) })}</Txt>
          {l.battery_pct != null ? <Txt tone="muted">{t('loc.battery', 'Phone battery: {{n}}%', { n: l.battery_pct })}</Txt> : null}
        </View>
      ) : !loc.loading ? (
        <View style={{ gap: 12 }}>
          <Empty icon="location-outline" title={t('loc.none_title', 'No location yet')} body={t('loc.none_body', 'We will show where {{name}} is once their phone is linked and sends a location.', { name })} action={t('link.title', 'Link a phone')} onAction={() => navigation.navigate('LinkDevice')} />
          {SMS_NUMBER ? <Notice kind="info" title={t('loc.sms_title', 'No data on the phone?')}>{t('loc.sms_body', 'Text LOCATE from {{name}}’s phone to {{num}} and we reply with where it is.', { name, num: SMS_NUMBER })}</Notice> : null}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <Txt v="title" tone="ink">{t('loc.places', 'Saved places')}</Txt>
        {(places.data || []).length ? (
          <Group>{(places.data || []).map(p => <Row key={p.id} icon={p.icon === 'school' ? 'school' : 'home'} title={p.name} subtitle={t('loc.alerts_on', 'Alerts when someone arrives or leaves')} onPress={() => removePlace(p)} />)}</Group>
        ) : <Txt tone="muted">{t('loc.places_none', 'No places yet. Stand where the phone is, then save it as home or school.')}</Txt>}
        {l ? <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {KINDS.map(k => <Button key={k.key} small variant="secondary" icon={k.icon} label={t('loc.save_as', 'Save this spot as {{place}}', { place: t(...k.label).toLowerCase() })} loading={saving === k.key} onPress={() => savePlace(k)} />)}
        </View> : null}
        <Txt v="caption" tone="muted">{t('loc.tap_remove', 'Tap a place to remove it.')}</Txt>
      </View>
    </Screen>
  );
}
