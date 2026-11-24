import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { Button, ChildScreen, Chip, DayRhythm, Group, HoldButton, Icon, Meter, Notice, Row, Txt, useToast } from '../ui';
import Enforcer from '../../modules/nurturenet-enforcer';
import { Config, PrayerTimes } from '../engine/types';
import { dailyLimit, decideAt, minutesLeft } from '../engine/decide';
import { syncAll } from '../services/sync';
import { sendSos } from '../services/sos';
import { readPermissions, PermState } from '../services/permissions';
import { startBackgroundWork } from '../services/tasks';
import { loadConfig, loadLastSync, loadPrayer } from '../state/session';
import { LANGUAGES, setLanguage } from '../i18n';
import { toHHMM } from '../utils/time';

const APPS: Record<string, string> = { 'com.zhiliaoapp.musically': 'TikTok', 'com.ss.android.ugc.trill': 'TikTok', 'com.google.android.youtube': 'YouTube', 'com.whatsapp': 'WhatsApp', 'com.facebook.katana': 'Facebook', 'com.instagram.android': 'Instagram', 'com.snapchat.android': 'Snapchat', 'org.telegram.messenger': 'Telegram', 'com.twitter.android': 'X', 'com.supercell.clashofclans': 'Clash of Clans', 'com.tencent.ig': 'PUBG Mobile', 'com.dts.freefireth': 'Free Fire' };
const appName = (pkg: string) => APPS[pkg] || (pkg.split('.').pop() || pkg).replace(/^./, ch => ch.toUpperCase());
const hm = (s: string | null | undefined) => { if (!s) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const span = (w?: { enabled: boolean; start: string | null; end: string | null }) => (w?.enabled && w.start && w.end ? { start: hm(w.start)!, end: hm(w.end)! } : null);

export default function HomeScreen({ lang, onUnlinked, onFixPermissions }: { lang: string; onUnlinked: () => void; onFixPermissions: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const toast = useToast();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [prayer, setPrayer] = useState<PrayerTimes>({});
  const [usage, setUsage] = useState(0);
  const [now, setNow] = useState(new Date());
  const [perm, setPerm] = useState<PermState | null>(null);
  const [lastSync, setLastSync] = useState(0);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);

  const refreshLocal = useCallback(async () => {
    setNow(new Date());
    try { setUsage(await Enforcer.getUsageTotalMinutes()); } catch {}
    try { setPerm(await readPermissions()); } catch {}
  }, []);
  const sync = useCallback(async () => {
    setBusy(true);
    const r = await syncAll();
    if (r.unlinked) { setBusy(false); onUnlinked(); return; }
    setOffline(!!r.offline);
    if (r.config) setCfg(r.config);
    setPrayer(r.prayer);
    setLastSync(await loadLastSync());
    await refreshLocal(); setBusy(false);
  }, [onUnlinked, refreshLocal]);

  useEffect(() => {
    (async () => { setCfg(await loadConfig()); const p = await loadPrayer(); if (p) setPrayer(p.times); setLastSync(await loadLastSync()); await refreshLocal(); })();
    sync();
    startBackgroundWork({ title: t('notif.title', 'NurtureNet is on'), body: t('notif.body', 'Your parent set rules for this phone. Tap to see them.') });
    const id = setInterval(refreshLocal, 30000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') { refreshLocal(); } });
    return () => { clearInterval(id); sub.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cfg) return <ChildScreen title={t('home.loading', 'Getting your rules…')} onRefresh={sync} refreshing={busy}>{offline ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}</ChildScreen>;

  const d = decideAt(cfg, now, prayer, usage);
  const left = minutesLeft(cfg, now, usage);
  const limit = dailyLimit(cfg, now);
  const L = cfg.limits;
  const first = cfg.child.full_name.split(' ')[0];
  const reasonText: Record<string, string> = {
    paused: t('home.r_paused', 'Your parent paused the phone.'), bedtime: t('home.r_bedtime', 'It is sleep time.'), school: t('home.r_school', 'It is school time.'),
    prayer: t('home.r_prayer', 'It is prayer time.'), jumuah: t('home.r_jumuah', "It is Jumu'ah."), church: t('home.r_church', 'It is church time.'),
    exam_study: t('home.r_exam', 'Study time. Only study apps are open.'), limit: t('home.r_limit', "Today's screen time is used up."),
  };
  const open = d.mode === 'open';
  const hmLeft = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} ${t('units.h', 'h')}${m % 60 ? ` ${m % 60} ${t('units.min', 'min')}` : ''}` : `${m} ${t('units.min', 'min')}`);
  const rhythmPrayers = cfg.prayer ? cfg.prayer.locked.map(n => ({ n, min: hm(prayer[n]) })).filter(p => p.min !== null).map(p => ({ min: p.min as number, label: t(`prayer.${p.n.toLowerCase()}`, p.n) })) : [];
  const extra: { start: number; end: number; label: string }[] = [];
  if (cfg.prayer?.jumuah?.enabled && now.getDay() === 5 && cfg.prayer.jumuah.start && cfg.prayer.jumuah.end) extra.push({ start: hm(cfg.prayer.jumuah.start)!, end: hm(cfg.prayer.jumuah.end)!, label: t('lock.jumuah', "Jumu'ah") });
  if (cfg.prayer?.church?.enabled && now.getDay() === 0 && cfg.prayer.church.start && cfg.prayer.church.end) extra.push({ start: hm(cfg.prayer.church.start)!, end: hm(cfg.prayer.church.end)!, label: t('lock.church', 'Church time') });

  const needsFix = perm && (!perm.usage || !perm.accessibility);
  const doSos = async () => {
    const r = await sendSos();
    toast(r === 'sent' ? t('sos.sent', 'Help is on the way. Your family has been told where you are.')
      : r === 'queued' ? t('sos.queued', 'No network. Your alert will send as soon as you are back online.')
      : t('sos.no_loc', 'Could not find your location. Turn on location, or call someone now.'), r === 'sent' ? 'safe' : 'info');
  };
  const ago = lastSync ? Math.max(0, Math.round((Date.now() - lastSync) / 60000)) : null;

  return (
    <ChildScreen title={`${t('home.hi', 'Hi')} ${first}`} onRefresh={sync} refreshing={busy}
      subtitle={open ? t('home.open', 'Your phone is open.') : reasonText[d.reason || 'paused']}>
      {needsFix ? <Notice kind="danger" title={t('home.fix_title', 'NurtureNet needs a setting back on')}><Txt tone="danger">{t('home.fix_body', 'Some settings were turned off. Your parent will see this.')}</Txt><View style={{ height: 8 }} /><Button small variant="secondary" label={t('home.fix_cta', 'Fix it now')} onPress={onFixPermissions} /></Notice> : null}
      {offline ? <Notice kind="warn">{t('home.offline', 'No connection. Your rules still work. We will update them when you are online.')}</Notice> : null}

      <View style={{ backgroundColor: open ? c.safeTint : c.warnTint, borderRadius: 24, padding: 20, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name={open ? 'checkmark-circle' : 'moon'} tone={open ? 'safe' : 'warn'} size={28} />
          <Txt v="title" tone={open ? 'safe' : 'warn'}>{open ? t('home.status_open', 'Open') : t('home.status_rest', 'Resting')}</Txt>
        </View>
        {!open && d.until ? <Txt tone="warn">{t('lock.until', 'Back at {time}.').replace('{time}', toHHMM(d.until.getHours() * 60 + d.until.getMinutes()))}</Txt> : null}
        {!open && d.reason === 'paused' && !d.until ? <Txt tone="warn">{t('lock.until_parent', 'Your parent will turn it back on.')}</Txt> : null}
      </View>

      {L && limit > 0 ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="label" tone="ink">{t('home.today', 'Screen time today')}</Txt>
            <Txt v="label" tone="muted">{hmLeft(usage)} / {hmLeft(limit)}</Txt>
          </View>
          <Meter ratio={usage / limit} />
          <Txt tone="muted">{left === 0 ? t('home.limit_done', 'All used up for today.') : t('home.left', '{{left}} left.', { left: hmLeft(left ?? 0) })}</Txt>
        </View>
      ) : null}

      <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 16, gap: 10 }}>
        <Txt v="label" tone="ink">{t('home.rhythm', "Today's plan")}</Txt>
        <DayRhythm rest={span(L?.bedtime)} school={span(L?.school) && (L?.school.days || [1, 2, 3, 4, 5]).includes(((now.getDay() + 6) % 7) + 1) ? span(L?.school) : null}
          prayers={rhythmPrayers} bufferMins={cfg.prayer?.buffer_mins ?? 15} extra={extra} now={now.getHours() * 60 + now.getMinutes()}
          labels={{ rest: t('rhythm.rest', 'Sleep'), school: t('rhythm.school', 'School'), prayer: t('rhythm.prayer', 'Prayer'), now: t('rhythm.now', 'Now') }} />
      </View>

      {cfg.app_rules.some(r => r.blocked || r.daily_limit_mins > 0) ? (
        <Group>
          {cfg.app_rules.filter(r => r.blocked || r.daily_limit_mins > 0).slice(0, 8).map((r, i) => (
            <Row key={i} icon={r.blocked ? 'close-circle' : 'time'} tint={r.blocked ? 'danger' : 'warn'}
              title={r.package ? appName(r.package) : r.category || ''} subtitle={r.blocked ? t('home.app_off', 'Off') : t('home.app_limit', '{{n}} min a day', { n: r.daily_limit_mins })} />
          ))}
        </Group>
      ) : null}

      <View style={{ gap: 8 }}>
        <HoldButton label={t('home.sos', 'I need help')} holdLabel={t('home.sos_hold', 'Press and hold')} onComplete={doSos} />
        <Txt v="caption" tone="muted" center>{t('home.sos_note', 'Holding this tells your family where you are.')}</Txt>
      </View>

      <View style={{ gap: 10 }}>
        <Txt v="label" tone="ink">{t('lang.title', 'Language')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{LANGUAGES.map(l => <Chip key={l.code} label={l.label} selected={lang === l.code} onPress={() => setLanguage(l.code)} />)}</View>
      </View>

      <View style={{ gap: 10 }}>
        <Button variant="secondary" icon="refresh" loading={busy} label={t('home.sync', 'Update my rules')} onPress={sync} />
        <Txt v="caption" tone="muted" center>{ago === null ? t('home.never', 'Not updated yet') : t('home.synced', 'Updated {{n}} min ago', { n: ago })}</Txt>
      </View>
    </ChildScreen>
  );
}
