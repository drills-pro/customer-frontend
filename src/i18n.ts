import { createInstance } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

const i18n = createInstance();

/** Native names, never translated. */
export const LANGS = [
  { label: 'English', value: 'en' },
  { label: 'ไทย', value: 'th' },
];

const sync = (lng: string) => {
  document.documentElement.lang = lng;
};

/** Resolves once the detected language is loaded; await it before the first render. English is bundled, others load on demand. */
export const ready = i18n
  .use({
    type: 'backend',
    read: (lng: string, _ns: string, cb: (err: unknown, data?: object) => void) => {
      import(`./locales/${lng}.json`).then((m) => cb(null, m.default), cb);
    },
  })
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    partialBundledLanguages: true,
    supportedLngs: LANGS.map((l) => l.value),
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    load: 'languageOnly',
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'drills-lang', caches: ['localStorage'] },
    interpolation: { escapeValue: false },
  })
  .then(() => {
    sync(i18n.resolvedLanguage ?? 'en');
    i18n.on('languageChanged', () => sync(i18n.resolvedLanguage ?? 'en'));
  });

export default i18n;
