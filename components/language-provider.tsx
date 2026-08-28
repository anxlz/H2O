"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, translate, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "h2o-gym-locale";

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyToDocument(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Starts at the same default on server and first client render — the
  // inline bootstrap script in <head> (see app/layout.tsx) already set the
  // correct `lang`/`dir` on <html> before paint, and `suppressHydrationWarning`
  // on <html>/<body> covers that attribute diff. We only sync state (and the
  // translated text nodes that depend on it) after mount, which is a normal
  // post-hydration update, not a mismatch.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage can throw in private-browsing/blocked-storage contexts
    }
    const initial: Locale = stored === "ar" || stored === "en" ? stored : DEFAULT_LOCALE;
    setLocaleState(initial);
    applyToDocument(initial);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyToDocument(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ar" : "en");
  }, [locale, setLocale]);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, dir: locale === "ar" ? "rtl" : "ltr", setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
