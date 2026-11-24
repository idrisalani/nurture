import React, { useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Field, Notice } from '../ui';
import AuthFrame from './AuthFrame';
import api, { apiError } from '../services/axios.client';
import { RootState } from '../store/store';
import { isValidNgPhone, normalisePhone } from '../utils/time';

export default function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const lang = useSelector((s: RootState) => s.locale.language);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ name?: string; phone?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const e: typeof err = {};
    if (name.trim().length < 2) e.name = t('auth.name_required', 'Enter your name.');
    if (!isValidNgPhone(phone)) e.phone = t('auth.phone_invalid', 'Enter a Nigerian mobile number, for example 0803 123 4567.');
    if (password.length < 6) e.password = t('auth.password_short', 'Use at least 6 characters.');
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const p = normalisePhone(phone);
    try {
      await api.post('/auth/register', { full_name: name.trim(), phone: p, password, preferred_language: lang });
      navigation.navigate('Otp', { phone: p });
    } catch (x) {
      setErr({ form: apiError(x, t('auth.register_failed', 'We could not create your account. Try again.'), t('common.offline', 'No connection. Check your network and try again.')) });
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame title={t('auth.register_title', 'Create your account')} subtitle={t('auth.register_sub', 'We send a 6-digit code to your phone to confirm it is you.')}>
      <View style={{ gap: 16 }}>
        {err.form ? <Notice kind="danger">{err.form}</Notice> : null}
        <Field label={t('auth.full_name', 'Your name')} value={name} onChangeText={setName} autoComplete="name" error={err.name} />
        <Field label={t('auth.phone', 'Phone number')} prefix="+234" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="803 123 4567" error={err.phone} />
        <Field label={t('auth.password', 'Password')} value={password} onChangeText={setPassword} secureToggle error={err.password}
          hint={t('auth.password_hint', 'At least 6 characters.')} />
        <Button label={t('auth.register_cta', 'Create account')} onPress={submit} loading={busy} />
        <Button label={t('auth.have_account', 'I already have an account')} variant="quiet" onPress={() => navigation.navigate('Login')} />
      </View>
    </AuthFrame>
  );
}
