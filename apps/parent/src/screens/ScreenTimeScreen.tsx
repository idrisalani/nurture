import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, ChildPicker, Empty, Group, Notice, Row, Screen, Stepper, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';
import { duration } from '../utils/format';
import { toHHMM, toMin } from '../utils/time';

const wrap = (m: number) => ((m % 1440) + 1440) % 1440;

export default function ScreenTimeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const child = useSelectedChild();
  const { data, loading, failed, reload } = useLoad<any>(() => child ? api.get(`/screentime/${child.id}`).then(r => r.data) : Promise.resolve(null), [child?.id]);
  const [f, setF] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const l = data?.limits;
    if (l) setF({ weekday: l.weekday_limit_mins, weekend: l.weekend_limit_mins, school: !!l.school_lock_enabled, bed: !!l.bedtime_lock_enabled, bs: toMin(l.bedtime_start), be: toMin(l.bedtime_end), ss: toMin(l.school_lock_start), se: toMin(l.school_lock_end) });
  }, [data]);

  if (!child) return <Screen title={t('limits.title', 'Screen time')}><Empty icon="time-outline" title={t('home.empty_title', 'Add your first child')} body={t('limits.empty', 'Add a child to set daily limits and bedtime.')} action={t('home.add_child', 'Add a child')} onAction={() => navigation.navigate('AddChild')} /></Screen>;

  const lim = (m: number) => m === 0 ? t('limits.none', 'No limit') : duration(m, t);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const dirty = f && data?.limits && (f.weekday !== data.limits.weekday_limit_mins || f.weekend !== data.limits.weekend_limit_mins || f.school !== !!data.limits.school_lock_enabled || f.bed !== !!data.limits.bedtime_lock_enabled || f.bs !== toMin(data.limits.bedtime_start) || f.be !== toMin(data.limits.bedtime_end) || f.ss !== toMin(data.limits.school_lock_start) || f.se !== toMin(data.limits.school_lock_end));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/screentime/${child.id}`, { weekday_limit_mins: f.weekday, weekend_limit_mins: f.weekend, school_lock_enabled: f.school, bedtime_lock_enabled: f.bed, bedtime_start: toHHMM(f.bs), bedtime_end: toHHMM(f.be), school_lock_start: toHHMM(f.ss), school_lock_end: toHHMM(f.se) });
      toast(t('limits.saved', 'Saved for {{name}}.', { name: child.full_name.split(' ')[0] }), 'safe'); reload();
    } catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setSaving(false);
  };
  const sw = (v: boolean, on: (v: boolean) => void, label: string) => <Switch value={v} onValueChange={on} accessibilityLabel={label} trackColor={{ true: c.safeFill, false: c.line }} thumbColor="#fff" />;

  return (
    <Screen title={t('limits.title', 'Screen time')} subtitle={child.full_name} onRefresh={reload} refreshing={loading}
      footer={f ? <Button label={t('common.save', 'Save')} onPress={save} loading={saving} disabled={!dirty} /> : undefined}>
      <ChildPicker />
      {failed && !f ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {f ? (
        <>
          <View style={{ backgroundColor: c.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8 }}>
            <Stepper label={t('limits.weekday', 'School days')} value={lim(f.weekday)} onMinus={() => set('weekday', Math.max(0, f.weekday - 15))} onPlus={() => set('weekday', Math.min(600, f.weekday + 15))} />
            <View style={{ height: 1, backgroundColor: c.line }} />
            <Stepper label={t('limits.weekend', 'Weekends')} value={lim(f.weekend)} onMinus={() => set('weekend', Math.max(0, f.weekend - 15))} onPlus={() => set('weekend', Math.min(600, f.weekend + 15))} />
          </View>
          <Group>
            <Row icon="moon" title={t('limits.bedtime', 'Bedtime lock')} subtitle={f.bed ? `${toHHMM(f.bs)} – ${toHHMM(f.be)}` : t('home.off', 'Off')} right={sw(f.bed, v => set('bed', v), t('limits.bedtime', 'Bedtime lock'))} />
          </Group>
          {f.bed ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8 }}>
              <Stepper label={t('limits.bed_start', 'Phone locks at')} value={toHHMM(f.bs)} onMinus={() => set('bs', wrap(f.bs - 15))} onPlus={() => set('bs', wrap(f.bs + 15))} />
              <View style={{ height: 1, backgroundColor: c.line }} />
              <Stepper label={t('limits.bed_end', 'Phone unlocks at')} value={toHHMM(f.be)} onMinus={() => set('be', wrap(f.be - 15))} onPlus={() => set('be', wrap(f.be + 15))} />
            </View>
          ) : null}
          <Group>
            <Row icon="school" title={t('limits.school', 'School hours lock')} subtitle={f.school ? `${toHHMM(f.ss)} – ${toHHMM(f.se)}, ${t('limits.mon_fri', 'Monday to Friday')}` : t('home.off', 'Off')} right={sw(f.school, v => set('school', v), t('limits.school', 'School hours lock'))} />
          </Group>
          {f.school ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 8 }}>
              <Stepper label={t('limits.school_start', 'School starts')} value={toHHMM(f.ss)} onMinus={() => set('ss', wrap(f.ss - 15))} onPlus={() => set('ss', wrap(f.ss + 15))} />
              <View style={{ height: 1, backgroundColor: c.line }} />
              <Stepper label={t('limits.school_end', 'School ends')} value={toHHMM(f.se)} onMinus={() => set('se', wrap(f.se - 15))} onPlus={() => set('se', wrap(f.se + 15))} />
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
