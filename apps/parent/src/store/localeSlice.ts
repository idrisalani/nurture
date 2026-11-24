import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import i18n from '../i18n';
import { storage } from '../utils/storage';

export const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'ha', label: 'Hausa' }, { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' }, { code: 'pc', label: 'Pidgin' },
];
const localeSlice = createSlice({
  name: 'locale',
  initialState: { language: 'en' },
  reducers: {
    setLanguage: (state, a: PayloadAction<string>) => {
      state.language = a.payload; i18n.changeLanguage(a.payload); storage.set('language', a.payload);
    },
  },
});
export const { setLanguage } = localeSlice.actions;
export default localeSlice.reducer;
