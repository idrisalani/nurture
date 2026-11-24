import React, { useState } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Chip, Field, Notice, Screen, Txt, useToast } from '../ui';
import api, { apiError } from '../services/axios.client';
import { selectChild } from '../store/childSlice';
import { useRefreshChildren } from '../hooks/useChildren';

const EMOJI = ['🧒', '👧', '👦', '🧑🏾', '👩🏾', '⚽', '📚', '🎨'];

export default function AddChildScreen({ navigation }: any) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { refresh } = useRefreshChildren();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [emoji, setEmoji] = useState(EMOJI[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ name?: string; dob?: string; form?: string; limit?: boolean }>({});

  const save = async () => {
    const e: typeof err = {};
    if (name.trim().length < 2) e.name = t('child.name_required', "Enter your child's name.");
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) e.dob = t('child.dob_invalid', 'Use the format YYYY-MM-DD, for example 2014-09-30.');
    setErr(e); if (e.name || e.dob) return;
    setBusy(true);
    try {
      const { data } = await api.post('/children', { full_name: name.trim(), avatar_emoji: emoji, ...(dob ? { date_of_birth: dob } : {}) });
      await refresh(); if (data?.id) dispatch(selectChild(data.id));
      toast(t('child.added', '{{name}} added.', { name: name.trim().split(' ')[0] }), 'safe');
      navigation.goBack();
    } catch (x: any) {
      setErr({ form: apiError(x, t('child.add_failed', 'We could not add your child. Try again.'), t('common.offline', 'No connection. Check your network and try again.')), limit: x?.response?.status === 403 });
    } finally { setBusy(false); }
  };

  return (
    <Screen title={t('child.add_title', 'Add a child')} back footer={<Button label={t('common.save', 'Save')} onPress={save} loading={busy} />}>
      {err.form ? <Notice kind="danger">{err.form}</Notice> : null}
      {err.limit ? <Button variant="secondary" label={t('child.see_plans', 'See plans')} onPress={() => navigation.navigate('Plans')} /> : null}
      <View style={{ alignItems: 'center' }}><Avatar name={name || '?'} emoji={emoji} size={84} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {EMOJI.map(e => <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />)}
      </View>
      <Field label={t('child.name', "Child's name")} value={name} onChangeText={setName} error={err.name} />
      <Field label={t('child.dob', 'Date of birth (optional)')} value={dob} onChangeText={setDob} placeholder="2014-09-30" keyboardType="numbers-and-punctuation"
        error={err.dob} hint={t('child.dob_hint', 'Helps us suggest age-appropriate rules.')} />
      <Txt tone="muted">{t('child.link_later', 'You can link their phone later in Settings.')}</Txt>
    </Screen>
  );
}
