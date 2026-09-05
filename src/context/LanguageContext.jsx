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

  // Keep locale branching explicit and stable for every consumer. Several
  // storefront surfaces need the same direction flag for names, arrows and
  // logical layout decisions; exposing it here prevents silent undefined
  // branches when a component is rendered before the document effect runs.
  const isRtl = dir === "rtl";
  const value = useMemo(
    () => ({ lang, setLang, toggleLang, dir, isRtl, isAr: isRtl, t }),
    [lang, toggleLang, dir, isRtl, t]
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
