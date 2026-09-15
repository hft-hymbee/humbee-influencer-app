/**
 * i18n — docs/10 §12.3. INTERPOLATE, NEVER CONCATENATE: no string concatenation that assumes
 * English word order.
 *
 * STATUS: the catalogues below are seeded with the shared/system strings only. Screen copy is
 * currently inline in the views because every string in the design spec is APPROVED, FINAL copy
 * and moving it wholesale risks a transcription error — the extraction is a tracked task
 * (docs/05-delivery-plan.md Phase 1, "localisation lands with each screen").
 *
 * Professional, trade-vocabulary-aware Hindi is a blocking input (docs/06-inputs-needed.md #23).
 * The `hi` values here are placeholders and MUST NOT ship.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getStoredLanguage } from '../views/language/LanguageScreen';

const en = {
  common: {
    retry: 'Try again',
    offline: 'You are offline. Showing your last saved data.',
    pendingSync_one: '{{count}} demand waiting to sync.',
    pendingSync_other: '{{count}} demands waiting to sync.',
  },
};

/** PLACEHOLDER — professional translation pending. */
const hi = {
  common: {
    retry: 'फिर कोशिश करें',
    offline: 'आप ऑफ़लाइन हैं। पिछला सहेजा गया डेटा दिख रहा है।',
    pendingSync_one: '{{count}} मांग सिंक होने की प्रतीक्षा में।',
    pendingSync_other: '{{count}} मांगें सिंक होने की प्रतीक्षा में।',
  },
};

i18n.use(initReactI18next).init({
  resources: { en: en, hi: hi },
  lng: (getStoredLanguage() ?? 'en-IN').split('-')[0],
  fallbackLng: ['hi', 'en'], // per-string fallback: chosen → Hindi → English. Never a raw key.
  defaultNS: 'common',
  ns: ['common'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
