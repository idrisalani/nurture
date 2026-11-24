import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Chip, ChildPicker, Field, Notice, Screen, Txt, useToast } from '../ui';
import api from '../services/axios.client';
import { useSelectedChild } from '../hooks/useSelectedChild';
import { useLoad } from '../hooks/useLoad';
import { confirm } from '../utils/confirm';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const guess = (md: string, year: number) => { const d = new Date(`${md} ${year} 12:00`); return isNaN(d.getTime()) ? '' : iso(d); };

export default function ExamModeScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const child = useSelectedChild();
  const mode = useLoad<any>(() => child ? api.get(`/exam/${child.id}`).then(r => r.data) : Promise.resolve(null), [child?.id]);
  const cal = useLoad<any[]>(async () => {
    const y = new Date().getFullYear();
    const a = (await api.get('/exam/calendar', { params: { year: y } })).data;
    if (a.length) return a;
    return (await api.get('/exam/calendar', { params: { year: y + 1 } })).data;
  }, []);
  const [pick, setPick] = useState<any>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!child) return <Screen title={t('exam.title', 'Exam mode')} back><View /></Screen>;
  const active = mode.data?.is_active;
  const choose = (e: any) => { setPick(e); setStart(e.start_date ? String(e.start_date).slice(0, 10) : guess(e.typical_start, e.exam_year)); setEnd(e.end_date ? String(e.end_date).slice(0, 10) : guess(e.typical_end, e.exam_year)); setErr(''); };

  const activate = async () => {
    if (!pick) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) { setErr(t('exam.dates_invalid', 'Enter dates as YYYY-MM-DD. The end date must come after the start date.')); return; }
    setBusy(true);
    try { await api.post(`/exam/${child.id}/activate`, { exam_body: pick.exam_body, start_date: start, end_date: end }); toast(t('exam.on_toast', 'Exam mode is on.'), 'safe'); mode.reload(); }
    catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setBusy(false);
  };
  const stop = async () => {
    if (!(await confirm(t('exam.stop_title', 'Turn off exam mode?'), t('exam.stop_body', 'Games and social apps will open again.'), t('exam.stop', 'Turn off'), t('common.cancel', 'Cancel')))) return;
    try { await api.delete(`/exam/${child.id}/deactivate`); toast(t('exam.off_toast', 'Exam mode is off.'), 'safe'); mode.reload(); }
    catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
  };

  return (
    <Screen title={t('exam.title', 'Exam mode')} subtitle={child.full_name} back footer={!active && pick ? <Button label={t('exam.activate', 'Turn on exam mode')} onPress={activate} loading={busy} /> : undefined}>
      <ChildPicker />
      <Txt tone="muted">{t('exam.intro', 'During exams, games and social media are blocked and only study apps stay open.')}</Txt>
      {active ? (
        <View style={{ gap: 14 }}>
          <Notice kind="info" title={t('home.exam_on', 'Exam mode is on')}>{t('exam.range', '{{exam}}, {{start}} to {{end}}.', { exam: mode.data.exam_body, start: String(mode.data.start_date).slice(0, 10), end: String(mode.data.end_date).slice(0, 10) })}</Notice>
          <Button variant="secondary" label={t('exam.stop', 'Turn off')} onPress={stop} />
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <Txt v="label" tone="ink">{t('exam.which', 'Which exam?')}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(cal.data || []).map(e => <Chip key={e.id} label={e.exam_name} selected={pick?.id === e.id} onPress={() => choose(e)} />)}
          </View>
          {cal.failed ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
          {pick ? (
            <>
              {!pick.is_confirmed ? <Notice kind="warn">{t('exam.approx', 'These dates are approximate. Check the official timetable and change them if needed.')}</Notice> : null}
              {pick.notes_en ? <Txt tone="muted">{pick.notes_en}</Txt> : null}
              <Field label={t('exam.start', 'Starts')} value={start} onChangeText={setStart} placeholder="2027-05-03" />
              <Field label={t('exam.end', 'Ends')} value={end} onChangeText={setEnd} placeholder="2027-06-18" error={err} />
            </>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
