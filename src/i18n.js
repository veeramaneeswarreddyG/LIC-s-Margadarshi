import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // Loads translations from /public/locales
  .use(LanguageDetector) // Detects user browser language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // Not needed for react as it escapes by default
    },
    supportedLngs: ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml'],
  });

export default i18n;