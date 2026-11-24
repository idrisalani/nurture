import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, ChildPicker, Empty, Field, Group, Notice, Row, Screen, Txt, useToast } from '../ui';
import { useSelectedChild } from '../hooks/useSelectedChild';
import api from '../services/axios.client';
import { useLoad } from '../hooks/useLoad';
import { confirm } from '../utils/confirm';
import { isValidNgPhone, normalisePhone } from '../utils/time';
import { timeAgo } from '../utils/format';

export default function PanicButtonScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const child = useSelectedChild();
  const [sending, setSending] = useState(false);
  const contacts = useLoad<any[]>(() => api.get('/panic/contacts').then(r => r.data), []);
  const history = useLoad<any[]>(() => api.get('/panic/history').then(r => r.data).catch(() => []), []);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', relationship: '' });
  const [err, setErr] = useState<{ name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const e: typeof err = {};
    if (f.name.trim().length < 2) e.name = t('sos.name_required', 'Enter a name.');
    if (!isValidNgPhone(f.phone)) e.phone = t('auth.phone_invalid', 'Enter a Nigerian mobile number, for example 0803 123 4567.');
    setErr(e); if (e.name || e.phone) return;
    setBusy(true);
    try { await api.post('/panic/contacts', { name: f.name.trim(), phone: normalisePhone(f.phone), relationship: f.relationship.trim() || undefined }); setF({ name: '', phone: '', relationship: '' }); setAdding(false); contacts.reload(); }
    catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setBusy(false);
  };
  const remove = async (ct: any) => {
    if (!(await confirm(t('sos.remove_title', 'Remove {{name}}?', { name: ct.name }), t('sos.remove_body', 'They will no longer get SOS messages.'), t('common.remove', 'Remove'), t('common.cancel', 'Cancel')))) return;
    try { await api.delete(`/panic/contacts/${ct.id}`); contacts.reload(); } catch { toast(t('common.try_again', 'That did not work. Try again.'), 'danger'); }
  };

  const sendSos = async () => {
    if (!child) return;
    const name = child.full_name.split(' ')[0];
    if (!(await confirm(t('sos.send_title', 'Send SOS for {{name}}?', { name }), t('sos.send_body', 'Your emergency contacts get a text with {{name}}’s last known location.', { name }), t('sos.send', 'Send SOS'), t('common.cancel', 'Cancel')))) return;
    setSending(true);
    try { await api.post('/panic/trigger-parent', { child_id: child.id }); toast(t('sos.sent', 'SOS sent to your emergency contacts.'), 'safe'); history.reload(); }
    catch (x: any) { toast(x?.response?.data?.error || t('common.try_again', 'That did not work. Try again.'), 'danger'); }
    setSending(false);
  };
  const list = contacts.data || [];
  return (
    <Screen title={t('sos.title', 'Emergency contacts')} back onRefresh={() => { contacts.reload(); history.reload(); }} refreshing={contacts.loading}>
      <Txt tone="muted">{t('sos.intro', 'When your child presses SOS on their phone, these people get a text with where your child is.')}</Txt>
      {list.length && child ? (
        <View style={{ gap: 10 }}>
          <ChildPicker />
          <Button variant="danger" icon="alert-circle" label={t('sos.send_cta', 'Send SOS for {{name}}', { name: child.full_name.split(' ')[0] })} onPress={sendSos} loading={sending} />
          <Txt v="caption" tone="muted">{t('sos.send_note', 'Use this in a real emergency. It texts every contact below.')}</Txt>
        </View>
      ) : null}
      {contacts.failed && !contacts.data ? <Notice kind="warn">{t('common.offline', 'No connection. Check your network and try again.')}</Notice> : null}
      {contacts.data && !list.length && !adding ? <Empty icon="call-outline" title={t('sos.none_title', 'No contacts yet')} body={t('sos.none_body', 'Add at least one person who can act fast, like a relative or neighbour.')} /> : null}
      {list.length ? <Group>{list.map(ct => <Row key={ct.id} icon="call" tint="danger" title={ct.name} subtitle={[ct.relationship, ct.phone].filter(Boolean).join(', ')} onPress={() => remove(ct)} />)}</Group> : null}
      {list.length ? <Txt v="caption" tone="muted">{t('sos.tap_remove', 'Tap a contact to remove them.')}</Txt> : null}
      {adding ? (
        <View style={{ gap: 14 }}>
          <Field label={t('sos.name', 'Name')} value={f.name} onChangeText={v => setF({ ...f, name: v })} error={err.name} />
          <Field label={t('auth.phone', 'Phone number')} prefix="+234" value={f.phone} onChangeText={v => setF({ ...f, phone: v })} keyboardType="phone-pad" error={err.phone} />
          <Field label={t('sos.relationship', 'Relationship (optional)')} value={f.relationship} onChangeText={v => setF({ ...f, relationship: v })} />
          <Button label={t('sos.add', 'Add contact')} onPress={add} loading={busy} />
          <Button variant="quiet" label={t('common.cancel', 'Cancel')} onPress={() => setAdding(false)} />
        </View>
      ) : <Button variant="secondary" icon="add" label={t('sos.add_cta', 'Add an emergency contact')} onPress={() => setAdding(true)} />}
      {(history.data || []).length ? (
        <View style={{ gap: 8 }}>
          <Txt v="title" tone="ink">{t('sos.history', 'Past SOS alerts')}</Txt>
          <Group>{(history.data || []).slice(0, 10).map((h: any) => <Row key={h.id} icon="alert-circle" tint="danger" title={h.child_name || t('sos.a_child', 'A child')} subtitle={timeAgo(h.triggered_at || h.created_at, t)} />)}</Group>
        </View>
      ) : null}
    </Screen>
  );
}
