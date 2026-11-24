import React, { useEffect, useState } from 'react';
import { Switch } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store/store';
import { useTheme } from '../theme/ThemeProvider';
import { Button, ChildPicker, Group, Notice, Row, Screen, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';

const ICONS: Record<string, any> = { adult: 'eye-off', gambling: 'dice', violence: 'warning', drugs: 'medkit', social_media: 'chatbubbles', gaming: 'game-controller', education: 'book' };

export default function FilterScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const lang = useSelector((s: RootState) => s.locale.language);
  const child = useSelectedChild();
  const { data, failed, reload } = useLoad<any>(() => child ? api.get(`/filter/${child.id}`).then(r => r.data) : Promise.resolve(null), [child?.id]);
  const [blocked, setBlocked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!data) return;
    const m: Record<string, boolean> = {};
    for (const cat of data.categories) { const row = (data.app_limits || []).find((r: any) => r.app_category === cat.key); m[cat.key] = row ? !!row.is_blocked : !!cat.blocked; }
    setBlocked(m);
  }, [data]);

  const save = async () => {
    setBusy(true);
    try { await api.put(`/filter/${child!.id}`, { categories: Object.entries(blocked).map(([key, b]) => ({ key, blocked: b })) }); toast(t('filter.saved', 'Filter saved.'), 'safe'); reload(); }
    catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setBusy(false);
  };
  return (
    <Screen title={t('filter.title', 'Content filter')} subtitle={child?.full_name} back footer={data ? <Button label={t('common.save', 'Save')} onPress={save} loading={busy} /> : undefined}>
      <ChildPicker />
      <Txt tone="muted">{t('filter.intro', 'Turn on what you want blocked on your child’s phone.')}</Txt>
      {failed && !data ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {data ? (
        <Group>
          {data.categories.map((cat: any) => (
            <Row key={cat.key} icon={ICONS[cat.key] || 'ellipse'} tint={blocked[cat.key] ? 'danger' : 'primary'} title={cat[`label_${lang}`] || cat.label_en}
              subtitle={blocked[cat.key] ? t('filter.blocked', 'Blocked') : t('filter.allowed', 'Allowed')}
              right={<Switch value={!!blocked[cat.key]} onValueChange={v => setBlocked(p => ({ ...p, [cat.key]: v }))} accessibilityLabel={cat.label_en} trackColor={{ true: c.danger, false: c.line }} thumbColor="#fff" />} />
          ))}
        </Group>
      ) : null}
    </Screen>
  );
}
