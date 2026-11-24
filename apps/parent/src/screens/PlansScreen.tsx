import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { useTheme } from '../theme/ThemeProvider';
import { Button, Chip, Notice, Screen, Txt, useToast } from '../ui';
import api, { apiError } from '../services/axios.client';
import { useLoad } from '../hooks/useLoad';
import { naira } from '../utils/time';

export default function PlansScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const lang = useSelector((s: RootState) => s.locale.language);
  const parent = useSelector((s: RootState) => s.auth.parent);
  const plans = useLoad<any[]>(() => api.get('/payments/plans').then(r => r.data), []);
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [busy, setBusy] = useState('');
  const list = (plans.data || []).filter(p => p.billing_cycle === cycle && Number(p.amount_ngn) > 0);

  const choose = async (p: any) => {
    setBusy(p.plan);
    try {
      const { data } = await api.post('/payments/initiate', { plan: p.plan, billing_cycle: cycle, payment_method: 'card' });
      if (data?.payment_url) await Linking.openURL(data.payment_url); else toast(t('plans.no_url', 'Payment could not start. Try again.'), 'danger');
    } catch (x) { toast(apiError(x, t('plans.failed', 'Payment could not start. Try again.'), t('common.offline', 'No connection. Check your network and try again.')), 'danger'); }
    setBusy('');
  };
  return (
    <Screen title={t('plans.title', 'Plans')} back onRefresh={plans.reload} refreshing={plans.loading}
      subtitle={t('plans.current', 'You are on the {{plan}} plan.', { plan: parent?.subscription_plan || 'free' })}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label={t('plans.monthly', 'Monthly')} selected={cycle === 'monthly'} onPress={() => setCycle('monthly')} />
        <Chip label={t('plans.annual', 'Yearly')} selected={cycle === 'annual'} onPress={() => setCycle('annual')} />
      </View>
      {plans.failed && !plans.data ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {list.map(p => {
        const current = parent?.subscription_plan === p.plan;
        return (
          <View key={p.id} style={{ backgroundColor: c.surface, borderRadius: 24, padding: 20, gap: 10, borderWidth: current ? 2 : 0, borderColor: c.primary }}>
            <Txt v="title" tone="ink">{p[`display_name_${lang}`] || p.display_name_en}</Txt>
            <Txt v="headline" tone="primary">{naira(Number(p.amount_ngn))}<Txt tone="muted"> {cycle === 'monthly' ? t('plans.per_month', 'a month') : t('plans.per_year', 'a year')}</Txt></Txt>
            {current ? <Txt tone="safe" v="label">{t('plans.yours', 'Your current plan')}</Txt> : <Button label={t('plans.choose', 'Choose this plan')} onPress={() => choose(p)} loading={busy === p.plan} />}
          </View>
        );
      })}
      {plans.data && !list.length ? <Txt tone="muted">{t('plans.none', 'No paid plans are available right now.')}</Txt> : null}
      <Txt v="caption" tone="muted">{t('plans.secure', 'You pay on Paystack’s secure page. We never see your card details.')}</Txt>
    </Screen>
  );
}
