import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // Load translations using http (e.g., from public/locales)
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    supportedLngs: ['en', 'zh'], // Supported languages
    fallbackLng: 'en', // Fallback language if a translation is missing
    debug: true, // Enable debug output in console
    ns: ['translation'], // Default namespace
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}.json', // Path to translation files
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
