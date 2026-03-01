// context/LanguageContext.js
import React, { createContext, useContext, useState } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ta', label: 'தமிழ்',    flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी',    flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు',   flag: '🇮🇳' },
];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('agri_lang') || 'en');

  const switchLang = (code) => {
    setLang(code);
    localStorage.setItem('agri_lang', code);
  };

  // t('key') → translated string; falls back to English if missing
  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      if (!val) break;
      val = val[k];
    }
    if (val) return val;
    // fallback to English
    let fb = translations['en'];
    for (const k of keys) {
      if (!fb) break;
      fb = fb[k];
    }
    return fb || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
