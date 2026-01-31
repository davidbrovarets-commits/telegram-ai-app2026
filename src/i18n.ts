
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files (we will load them dynamically or bundle them)
// For a small app, bundling is fine.
import en from './locales/en/translation.json';
import de from './locales/de/translation.json';
import uk from './locales/uk/translation.json';
import ru from './locales/ru/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            de: { translation: de },
            uk: { translation: uk },
            ru: { translation: ru } // Added Russian as likely requested/useful for target demographic
        },
        fallbackLng: 'en',
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;
