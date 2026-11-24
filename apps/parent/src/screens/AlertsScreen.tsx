import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { Button, Empty, Group, Notice, Row, Screen } from '../ui';
import api from '../services/axios.client';
import { useLoad } from '../hooks/useLoad';
import { timeAgo } from '../utils/format';

export default function AlertsScreen() {
  const { t } = useTranslation();
  const lang = useSelector((s: RootState) => s.locale.language);
  const { data, loading, failed, reload } = useLoad<any[]>(() => api.get('/alerts').then(r => r.data), []);
  const list = data || [];
  const unread = list.filter(a => !a.is_read).length;
  const open = async (a: any) => { if (!a.is_read) { try { await api.put(`/alerts/${a.id}/read`); reload(); } catch { /* ignore */ } } };
  const readAll = async () => { try { await api.put('/alerts/read-all'); reload(); } catch { /* ignore */ } };
  return (
    <Screen title={t('alerts.title', 'Alerts')} back onRefresh={reload} refreshing={loading}
      right={unread ? <Button small variant="quiet" label={t('alerts.read_all', 'Mark all read')} onPress={readAll} /> : undefined}>
      {failed && !data ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {data && !list.length ? <Empty icon="notifications-outline" title={t('alerts.none_title', 'All quiet')} body={t('alerts.none_body', 'When something needs your attention, it shows up here.')} /> : null}
      {list.length ? (
        <Group>
          {list.map(a => (
            <Row key={a.id} onPress={() => open(a)} tint={a.severity === 'critical' || a.severity === 'high' ? 'danger' : a.severity === 'warning' ? 'warn' : 'primary'}
              icon={a.is_read ? 'notifications-outline' : 'notifications'} title={a[`title_${lang}`] || a.title_en} subtitle={`${a[`body_${lang}`] || a.body_en}${a.created_at ? `\n${timeAgo(a.created_at, t)}` : ''}`} />
          ))}
        </Group>
      ) : null}
    </Screen>
  );
}
