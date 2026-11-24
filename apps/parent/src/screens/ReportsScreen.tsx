import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { ChildPicker, Empty, Group, Notice, Row, Screen, Txt } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';
import { duration } from '../utils/format';

export default function ReportsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const child = useSelectedChild();
  const rep = useLoad<any>(() => child ? api.get(`/reports/${child.id}/weekly`).then(r => r.data) : Promise.resolve(null), [child?.id]);
  const blocked = useLoad<any[]>(() => child ? api.get(`/reports/${child.id}/blocked`).then(r => r.data).catch(() => []) : Promise.resolve([]), [child?.id]);

  if (!child) return <Screen title={t('rep.title', 'Reports')}><Empty icon="bar-chart-outline" title={t('home.empty_title', 'Add your first child')} body={t('rep.empty', 'Add a child to see their week.')} action={t('home.add_child', 'Add a child')} onAction={() => navigation.navigate('AddChild')} /></Screen>;

  const d = rep.data;
  const days: { date: string; mins: number }[] = (d?.daily_usage || []).map((x: any) => ({ date: String(x.usage_date).slice(0, 10), mins: Number(x.total_mins) }));
  const max = Math.max(60, ...days.map(x => x.mins));
  const avg = days.length ? Math.round(days.reduce((a, x) => a + x.mins, 0) / days.length) : 0;
  const apps: any[] = d?.top_apps || [];
  const topMax = Math.max(1, ...apps.map(a => Number(a.total_mins)));
  const name = child.full_name.split(' ')[0];
  const dayLabel = (iso: string) => t(`days.${new Date(iso + 'T12:00:00').getDay()}`, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso + 'T12:00:00').getDay()]);

  return (
    <Screen title={t('rep.title', 'Reports')} subtitle={t('rep.sub', 'The last 7 days for {{name}}', { name })} onRefresh={() => { rep.reload(); blocked.reload(); }} refreshing={rep.loading}>
      <ChildPicker />
      {rep.failed && !d ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {d && !days.length ? <Empty icon="bar-chart-outline" title={t('rep.none_title', 'Nothing to show yet')} body={t('rep.none_body', 'Usage appears here after {{name}}’s phone is linked and has been used.', { name })} /> : null}
      {days.length ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 24, padding: 20, gap: 16 }}>
          <Txt v="bodyL" tone="ink">{t('rep.avg', '{{name}} averages {{time}} a day.', { name, time: duration(avg, t) })}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 8 }} accessible accessibilityLabel={days.map(x => `${dayLabel(x.date)} ${duration(x.mins, t)}`).join(', ')}>
            {days.map(x => (
              <View key={x.date} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 }}>
                <View style={{ width: '100%', height: Math.max(6, (x.mins / max) * 110), borderRadius: 8, backgroundColor: c.primary }} />
                <Txt v="caption" tone="muted">{dayLabel(x.date)}</Txt>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {apps.length ? (
        <View style={{ gap: 10 }}>
          <Txt v="title" tone="ink">{t('rep.top_apps', 'Most used apps')}</Txt>
          <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 16, gap: 14 }}>
            {apps.slice(0, 6).map(a => (
              <View key={a.app_package} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt tone="ink">{a.app_name}</Txt><Txt tone="muted">{duration(Number(a.total_mins), t)}</Txt>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt }}><View style={{ height: 8, borderRadius: 4, backgroundColor: c.primary, width: `${(Number(a.total_mins) / topMax) * 100}%` }} /></View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {d ? (
        <View style={{ gap: 10 }}>
          <Txt v="title" tone="ink">{t('rep.blocked', 'Blocked this week')}</Txt>
          {Number(d.blocked_attempts) > 0 ? (
            <>
              <Notice kind="info">{t('rep.blocked_count', '{{n}} attempts to open blocked sites or apps.', { n: d.blocked_attempts })}</Notice>
              {(blocked.data || []).length ? <Group>{(blocked.data || []).slice(0, 8).map((b: any, i: number) => <Row key={i} icon="close-circle" tint="danger" title={b.url_domain || t('rep.unknown', 'Unknown site')} subtitle={[b.category, `${b.attempts}×`].filter(Boolean).join(', ')} />)}</Group> : null}
            </>
          ) : <Notice kind="safe">{t('rep.blocked_none', 'No blocked attempts. Good news.')}</Notice>}
        </View>
      ) : null}
    </Screen>
  );
}
