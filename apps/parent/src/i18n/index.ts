import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../utils/storage';
import en from './en.json';
import ha from './ha.json';
import yo from './yo.json';
import ig from './ig.json';
import pc from './pc.json';

// English is the fallback for any string a language file does not have yet.
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ha: { translation: ha }, yo: { translation: yo }, ig: { translation: ig }, pc: { translation: pc } },
  lng: 'en', fallbackLng: 'en', interpolation: { escapeValue: false }, returnNull: false,
});
storage.get('language').then((lang) => { if (lang && i18n.hasResourceBundle(lang, 'translation')) i18n.changeLanguage(lang); });
export default i18n;
