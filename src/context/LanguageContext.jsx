import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

const LANG_STORAGE_KEY = "nova_lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "ar" || saved === "en") return saved;
    } catch {
      /* ignore */
    }
    return "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  /* Sync <html> dir/lang so RTL layout & fonts apply globally */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang, dir]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  /* Look up a dot-nested translation key with {var} interpolation */
  const t = useCallback(
    (key, vars = {}) => {
      const table = translations[lang] || translations.en;
      let value = table[key] ?? translations.en[key] ?? key;
      if (typeof value === "function") {
        value = value(lang);
      }
      if (typeof value === "string") {
        return value.replace(/\{(\w+)\}/g, (_, k) =>
          vars[k] !== undefined ? String(vars[k]) : `{${k}}`
        );
      }
      return value;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, dir, t }),
    [lang, toggleLang, dir, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
