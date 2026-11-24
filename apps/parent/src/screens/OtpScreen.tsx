import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Field, Notice } from '../ui';
import { useToast } from '../ui';
import AuthFrame from './AuthFrame';
import api, { apiError } from '../services/axios.client';

export default function OtpScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const toast = useToast();
  const phone: string = route.params.phone;
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) { setErr(t('auth.otp_invalid', 'Enter the 6-digit code from the SMS.')); return; }
    setBusy(true); setErr('');
    try {
      await api.post('/auth/verify-otp', { phone, otp });
      toast(t('auth.verified', 'Phone confirmed. You can sign in now.'), 'safe');
      navigation.navigate('Login');
    } catch (x) {
      setErr(apiError(x, t('auth.otp_failed', 'That code did not work. Check it and try again.'), t('common.offline', 'No connection. Check your network and try again.')));
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame title={t('auth.otp_title', 'Confirm your phone')} subtitle={t('auth.otp_sub', 'We sent a 6-digit code to {{phone}}.', { phone })}>
      <View style={{ gap: 16 }}>
        {err ? <Notice kind="danger">{err}</Notice> : null}
        <Field label={t('auth.otp', 'Code')} value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad"
          autoComplete="sms-otp" maxLength={6} placeholder="000000" />
        <Button label={t('auth.otp_cta', 'Confirm')} onPress={verify} loading={busy} />
        <Button label={t('common.back', 'Back')} variant="quiet" onPress={() => navigation.goBack()} />
      </View>
    </AuthFrame>
  );
}
