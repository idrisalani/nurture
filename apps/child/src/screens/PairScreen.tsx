import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import * as Device from 'expo-device';
import { useTranslation } from 'react-i18next';
import { Button, Field, Notice, Txt } from '../ui';
import ChildScreen from '../ui/ChildScreen';
import api, { apiMessage } from '../api/client';
import { saveSession } from '../state/session';

export default function PairScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    if (!/^\d{6}$/.test(code)) { setErr(t('pair.invalid', 'The code has 6 numbers. Check it and try again.')); return; }
    setBusy(true); setErr('');
    try {
      const { data } = await api.post('/devices/pair', {
        code, device_name: Device.deviceName || Device.modelName || 'Android phone', device_model: Device.modelName || undefined,
        platform: 'android', os_version: Device.osVersion || undefined, app_version: '1.0.0',
      });
      await saveSession({ device_id: data.device_id, child_id: data.child_id });
      onDone();
    } catch (e) {
      setErr(apiMessage(e, t('pair.failed', 'That code did not work. Ask your parent for a new one.'), t('common.offline', 'No connection. Check your network and try again.')));
    } finally { setBusy(false); }
  };
  return (
    <ChildScreen title={t('pair.title', 'Enter the code')} subtitle={t('pair.sub', 'Ask your parent to open NurtureNet on their phone, go to Settings, then Link a phone.')}
      footer={<><Button label={t('pair.cta', 'Link this phone')} onPress={submit} loading={busy} /><Button variant="quiet" label={t('common.back', 'Back')} onPress={onBack} /></>}>
      {err ? <Notice kind="danger">{err}</Notice> : null}
      <Field label={t('pair.label', '6-digit code')} value={code} onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" />
      <Txt tone="muted">{t('pair.note', 'The code works once, for 15 minutes.')}</Txt>
    </ChildScreen>
  );
}
