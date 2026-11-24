import React, { useState } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Field, Notice, Txt } from '../ui';
import AuthFrame from './AuthFrame';
import api, { apiError } from '../services/axios.client';
import { setCredentials } from '../store/authSlice';
import { setLanguage } from '../store/localeSlice';
import { isValidNgPhone, normalisePhone } from '../utils/time';

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ phone?: string; password?: string; form?: string }>({});

  const submit = async () => {
    const e: typeof err = {};
    if (!isValidNgPhone(phone)) e.phone = t('auth.phone_invalid', 'Enter a Nigerian mobile number, for example 0803 123 4567.');
    if (!password) e.password = t('auth.password_required', 'Enter your password.');
    setErr(e);
    if (e.phone || e.password) return;
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', { phone: normalisePhone(phone), password });
      if (data.parent?.preferred_language) dispatch(setLanguage(data.parent.preferred_language));
      dispatch(setCredentials({ accessToken: data.accessToken, refreshToken: data.refreshToken, parent: data.parent }));
    } catch (x: any) {
      if (x?.response?.status === 403) { navigation.navigate('Otp', { phone: normalisePhone(phone) }); }
      setErr({ form: apiError(x, t('auth.login_failed', 'We could not sign you in. Check your number and password.'), t('common.offline', 'No connection. Check your network and try again.')) });
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame title={t('auth.login_title', 'Welcome back')} subtitle={t('auth.login_sub', 'Sign in to see how your children are doing online.')}>
      <View style={{ gap: 16 }}>
        {err.form ? <Notice kind="danger">{err.form}</Notice> : null}
        <Field label={t('auth.phone', 'Phone number')} prefix="+234" value={phone} onChangeText={setPhone} keyboardType="phone-pad"
          autoComplete="tel" placeholder="803 123 4567" error={err.phone} />
        <Field label={t('auth.password', 'Password')} value={password} onChangeText={setPassword} secureToggle autoComplete="password" error={err.password} />
        <Button label={t('auth.login_cta', 'Sign in')} onPress={submit} loading={busy} />
        <Button label={t('auth.no_account', 'Create an account')} variant="quiet" onPress={() => navigation.navigate('Register')} />
      </View>
    </AuthFrame>
  );
}
