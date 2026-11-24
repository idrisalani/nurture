import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, Chip, Group, Notice, Row, Screen, Stepper, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';
import ChildPickerBar from '../ui/ChildPicker';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const FALLBACK_CITIES = ['Lagos', 'Kano', 'Abuja', 'Kaduna', 'Ibadan', 'Port Harcourt', 'Sokoto', 'Maiduguri'];

export default function PrayerTimeScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const child = useSelectedChild();
  const sched = useLoad<any>(() => child ? api.get(`/prayer/schedule/${child.id}`).then(r => r.data) : Promise.resolve(null), [child?.id]);
  const cities = useLoad<string[]>(() => api.get('/prayer/cities').then(r => (r.data as any[]).slice(0, 10).map(x => x.city)).catch(() => FALLBACK_CITIES), []);
  const [f, setF] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const s = sched.data;
    if (s) setF({ on: !!s.is_enabled, city: s.city || 'Lagos', locked: s.locked_prayers || PRAYERS, buffer: s.lock_buffer_mins ?? 15, jumuah: s.include_jumuah ?? true, church: !!s.christian_lock_enabled });
  }, [sched.data]);
  const times = useLoad<Record<string, string>>(() => f?.city ? api.get('/prayer/times', { params: { city: f.city } }).then(r => r.data.timings).catch(() => ({})) : Promise.resolve({}), [f?.city]);

  if (!child || !f) return <Screen title={t('prayer.title', 'Prayer times')} back>{sched.failed ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}</Screen>;
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggle = (p: string) => set('locked', f.locked.includes(p) ? f.locked.filter((x: string) => x !== p) : [...f.locked, p]);
  const save = async () => {
    setBusy(true);
    try {
      await api.post(`/prayer/schedule/${child.id}`, {
        is_enabled: f.on, city: f.city, locked_prayers: f.locked, lock_buffer_mins: f.buffer, include_jumuah: f.jumuah, christian_lock_enabled: f.church,
        service_type: f.church ? (f.locked.length || f.jumuah ? 'both' : 'christian') : 'islamic',
      });
      toast(t('prayer.saved', 'Prayer times saved.'), 'safe'); sched.reload();
    } catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setBusy(false);
  };
  const sw = (v: boolean, on: (v: boolean) => void, label: string) => <Switch value={v} onValueChange={on} accessibilityLabel={label} trackColor={{ true: c.safeFill, false: c.line }} thumbColor="#fff" />;
  const tm = times.data || {};

  return (
    <Screen title={t('prayer.title', 'Prayer times')} subtitle={child.full_name} back footer={<Button label={t('common.save', 'Save')} onPress={save} loading={busy} />}>
      <ChildPickerBar />
      <Txt tone="muted">{t('prayer.intro', 'The phone locks for a short while around each prayer, so your child can pray without distraction.')}</Txt>
      <Group><Row icon="moon" tint="warn" title={t('prayer.enable', 'Lock during prayer')} right={sw(f.on, v => set('on', v), t('prayer.enable', 'Lock during prayer'))} /></Group>
      {f.on ? (
        <>
          <View style={{ gap: 8 }}>
            <Txt v="label" tone="ink">{t('prayer.city', 'City')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(cities.data || FALLBACK_CITIES).map(ci => <Chip key={ci} label={ci} selected={f.city === ci} onPress={() => set('city', ci)} />)}</View>
          </View>
          <View style={{ gap: 8 }}>
            <Txt v="label" tone="ink">{t('prayer.which', 'Which prayers')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PRAYERS.map(p => <Chip key={p} selected={f.locked.includes(p)} onPress={() => toggle(p)} label={`${t(`prayer.${p}`, p[0].toUpperCase() + p.slice(1))}${tm[p[0].toUpperCase() + p.slice(1)] ? ' ' + tm[p[0].toUpperCase() + p.slice(1)] : ''}`} />)}
            </View>
          </View>
          <View style={{ backgroundColor: c.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8 }}>
            <Stepper label={t('prayer.buffer', 'Lock before and after')} value={`${f.buffer} ${t('units.min', 'min')}`} onMinus={() => set('buffer', Math.max(5, f.buffer - 5))} onPlus={() => set('buffer', Math.min(45, f.buffer + 5))} />
          </View>
          <Group>
            <Row icon="people" title={t('prayer.jumuah_long', "Friday Jumu'ah")} subtitle={t('prayer.jumuah_sub', 'Longer lock on Fridays')} right={sw(f.jumuah, v => set('jumuah', v), t('prayer.jumuah_long', "Friday Jumu'ah"))} />
            <Row icon="home" title={t('prayer.church', 'Sunday church service')} subtitle={t('prayer.church_sub', 'Lock on Sunday mornings')} right={sw(f.church, v => set('church', v), t('prayer.church', 'Sunday church service'))} />
          </Group>
        </>
      ) : null}
    </Screen>
  );
}
