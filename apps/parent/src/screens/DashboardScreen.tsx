import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { useTheme } from '../theme/ThemeProvider';
import { Avatar, Button, ChildPicker, Chip, DayRhythm, Empty, Group, Icon, Meter, Notice, Row, Screen, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useRefreshChildren } from '../hooks/useChildren';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useChildRules } from '../hooks/useChildRules';
import { useLoad } from '../hooks/useLoad';
import { duration } from '../utils/format';
import { nowMin, toMin } from '../utils/time';

const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function DashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const parent = useSelector((s: RootState) => s.auth.parent);
  const loaded = useSelector((s: RootState) => s.children.loaded);
  const lang = useSelector((s: RootState) => s.locale.language);
  const child = useSelectedChild();
  const { refresh, refreshing } = useRefreshChildren();
  const rules = useChildRules(child?.id ?? null);
  const unread = useLoad<number>(() => api.get('/alerts', { params: { unread_only: true } }).then(r => (Array.isArray(r.data) ? r.data.length : 0)).catch(() => 0), []);
  const tip = useLoad<string>(() => api.get('/insights/tips', { params: { lang } }).then(r => r.data.tip as string).catch(() => ''), [lang]);
  const [pauseOpen, setPauseOpen] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); rules.reload(); unread.reload(); }, [child?.id])); // eslint-disable-line react-hooks/exhaustive-deps

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.morning', 'Good morning') : hour < 17 ? t('home.afternoon', 'Good afternoon') : t('home.evening', 'Good evening');
  const first = parent?.full_name?.split(' ')[0] || '';
  const bell = (
    <Pressable accessibilityRole="button" accessibilityLabel={t('nav.alerts', 'Alerts')} onPress={() => navigation.navigate('Alerts')}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="notifications-outline" size={26} tone="ink" />
      {(unread.data || 0) > 0 ? <View style={{ position: 'absolute', top: 8, right: 8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
        <Txt v="caption" tone="onPrimary" style={{ fontSize: 11, lineHeight: 14 }}>{unread.data}</Txt></View> : null}
    </Pressable>
  );

  const pause = async (mins?: number) => {
    if (!child) return;
    try {
      await api.post('/screentime/pause', { child_id: child.id, duration_mins: mins });
      toast(t('home.paused_toast', 'Internet paused for {{name}}.', { name: child.full_name.split(' ')[0] }), 'safe');
      setPauseOpen(false); rules.reload();
    } catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
  };
  const resume = async () => {
    if (!child) return;
    try { await api.post('/screentime/resume', { child_id: child.id }); toast(t('home.resumed_toast', 'Internet is back on.'), 'safe'); rules.reload(); }
    catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
  };

  if (loaded && !child) {
    return (
      <Screen title={`${greeting}${first ? ', ' + first : ''}`} right={bell} onRefresh={refresh} refreshing={refreshing}>
        <Empty icon="people-outline" title={t('home.empty_title', 'Add your first child')}
          body={t('home.empty_body', 'Tell us who to look after. Then you can set screen time, prayer breaks and more.')}
          action={t('home.add_child', 'Add a child')} onAction={() => navigation.navigate('AddChild')} />
      </Screen>
    );
  }

  const r = rules.data;
  const name = child?.full_name.split(' ')[0] || '';
  const limit = r?.limitToday || 0;
  const ratio = limit ? (r?.used || 0) / limit : 0;
  const left = Math.max(0, limit - (r?.used || 0));
  const now = nowMin();
  const day = new Date().getDay();
  const l = r?.limits;
  const prayers = r?.prayer?.is_enabled ? PRAYER_KEYS.filter(k => (r.prayer.locked_prayers || []).includes(k.toLowerCase()) && r.prayerTimes[k]).map(k => ({ min: toMin(r.prayerTimes[k]), label: t(`prayer.${k.toLowerCase()}`, k) })) : [];
  const extra: any[] = [];
  if (r?.prayer?.is_enabled && r.prayer.include_jumuah && day === 5) extra.push({ start: toMin(r.prayer.jumuah_start), end: toMin(r.prayer.jumuah_end), label: t('prayer.jumuah', "Jumu'ah") });
  if (r?.prayer?.christian_lock_enabled && day === 0) extra.push({ start: toMin(r.prayer.christian_start), end: toMin(r.prayer.christian_end), label: t('prayer.service', 'Church service') });

  return (
    <Screen title={`${greeting}${first ? ', ' + first : ''}`} right={bell} onRefresh={() => { refresh(); rules.reload(); unread.reload(); }} refreshing={refreshing || rules.loading}>
      <ChildPicker />
      {child ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={child.full_name} emoji={child.avatar_emoji || undefined} size={52} />
            <View style={{ flex: 1 }}>
              <Txt v="title" tone="ink">{child.full_name}</Txt>
              {r?.paused ? <Txt tone="warn" v="label">{t('home.paused', 'Internet paused')}</Txt> : <Txt tone="muted">{t('home.online_rules', 'Rules are on')}</Txt>}
            </View>
          </View>
          {rules.failed && !r ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
          {limit ? (
            <View style={{ gap: 10 }}>
              <Txt v="bodyL" tone="ink">{t('home.used_of', '{{name}} has used {{used}} of {{limit}} today.', { name, used: duration(r?.used || 0, t), limit: duration(limit, t) })}</Txt>
              <Meter ratio={ratio} />
              <Txt tone={ratio >= 1 ? 'danger' : 'muted'}>{ratio >= 1 ? t('home.limit_reached', 'Daily limit reached.') : t('home.left', '{{left}} left.', { left: duration(left, t) })}</Txt>
            </View>
          ) : rules.loading ? null : <Txt tone="muted">{t('home.no_limit', 'No daily limit set yet.')}</Txt>}
        </View>
      ) : null}

      {child && l ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 20, gap: 14 }}>
          <Txt v="label" tone="ink">{t('home.rhythm', "Today's rhythm")}</Txt>
          <DayRhythm now={now}
            rest={l.bedtime_lock_enabled ? { start: toMin(l.bedtime_start), end: toMin(l.bedtime_end) } : null}
            school={l.school_lock_enabled && day >= 1 && day <= 5 ? { start: toMin(l.school_lock_start), end: toMin(l.school_lock_end) } : null}
            prayers={prayers} bufferMins={r?.prayer?.lock_buffer_mins ?? 15} extra={extra}
            labels={{ rest: t('rhythm.rest', 'Bedtime'), school: t('rhythm.school', 'School'), prayer: t('rhythm.prayer', 'Prayer'), now: t('rhythm.now', 'Now') }} />
        </View>
      ) : null}

      {child ? (
        <>
          {r?.exam ? <Notice kind="info" title={t('home.exam_on', 'Exam mode is on')}>{t('home.exam_on_body', '{{exam}} until {{date}}. Only study apps are open.', { exam: r.exam.exam_body, date: String(r.exam.end_date).slice(0, 10) })}</Notice> : null}
          <Group>
            {r?.paused
              ? <Row icon="play" tint="safe" title={t('home.resume', 'Turn internet back on')} subtitle={t('home.resume_sub', 'Ends the pause now')} onPress={resume} chevron />
              : <Row icon="pause" tint="warn" title={t('home.pause', 'Pause internet')} subtitle={t('home.pause_sub', 'Cut access right now, for a time you choose')} onPress={() => setPauseOpen(o => !o)} chevron />}
            {pauseOpen && !r?.paused ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 4 }}>
                <Chip label={t('home.pause_30', '30 min')} onPress={() => pause(30)} />
                <Chip label={t('home.pause_60', '1 hour')} onPress={() => pause(60)} />
                <Chip label={t('home.pause_120', '2 hours')} onPress={() => pause(120)} />
                <Chip label={t('home.pause_until', 'Until I turn it on')} onPress={() => pause(undefined)} />
              </View>
            ) : null}
            <Row icon="moon" title={t('home.prayer', 'Prayer times')} subtitle={r?.prayer?.is_enabled ? t('home.prayer_on', 'On for {{city}}', { city: r.prayer.city }) : t('home.off', 'Off')} onPress={() => navigation.navigate('Prayer')} chevron />
            <Row icon="school" title={t('home.exam', 'Exam mode')} subtitle={r?.exam ? t('home.on', 'On') : t('home.off', 'Off')} onPress={() => navigation.navigate('Exam')} chevron />
            <Row icon="funnel" title={t('home.filter', 'Content filter')} subtitle={t('home.filter_sub', 'Choose what is blocked')} onPress={() => navigation.navigate('Filter')} chevron />
          </Group>
        </>
      ) : null}

      <Group>
        <Row icon="alert-circle" tint="danger" title={t('home.sos', 'Emergency contacts and SOS')} subtitle={t('home.sos_sub', 'Who is told when a child presses SOS')} onPress={() => navigation.navigate('Panic')} chevron />
        <Row icon="person-add" title={t('home.add_child', 'Add a child')} onPress={() => navigation.navigate('AddChild')} chevron />
      </Group>

      {tip.data ? (
        <View style={{ backgroundColor: c.primaryTint, borderRadius: 18, padding: 16, gap: 4 }}>
          <Txt v="label" tone="primary">{t('home.tip', 'A tip for today')}</Txt>
          <Txt>{tip.data}</Txt>
        </View>
      ) : null}
    </Screen>
  );
}
