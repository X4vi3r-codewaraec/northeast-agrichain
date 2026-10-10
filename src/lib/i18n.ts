"use client";

/** Lightweight i18n scaffold. A tiny dictionary keyed by string id, resolved by
 *  the current language. This is the seam the full translation tables (and the
 *  FastAPI `/i18n` bundle) plug into later — the UI already reads through `t()`. */

import { useSyncExternalStore } from "react";
import { LANGUAGES } from "@/lib/data";
import { LANG_STORAGE_KEY } from "@/lib/settings";

export type LangCode = (typeof LANGUAGES)[number]["code"];

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("nac-lang", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("nac-lang", cb);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY) ?? "en";
  } catch {
    return "en";
  }
}

function getServerSnapshot(): string {
  return "en";
}

export function setLanguage(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch {
    /* storage unavailable */
  }
  emit();
  window.dispatchEvent(new Event("nac-lang"));
}

export function useLanguage(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type Dict = Record<string, string>;

const EN: Dict = {
  "nav.home": "Home",
  "nav.features": "Features",
  "nav.crops": "Crops",
  "nav.prices": "Prices",
  "nav.weather": "Weather",
  "nav.market": "Market",
  "nav.diagnose": "Crop diagnosis",
  "nav.alerts": "Alerts",
  "nav.insurance": "Insurance",
  "nav.assistant": "Assistant",
  "nav.more": "More",
  "nav.login": "Log in",
  "cta.getStarted": "Get started",
  "common.language": "Language",
  "common.offline": "Offline ready",
  "common.listen": "Listen",
  "common.save": "Save",
  "settings.title": "Settings",
  "settings.voice": "Voice speed",
  "settings.dataSaver": "Data-saver mode",
};

const AS: Dict = {
  "nav.home": "মূল পৃষ্ঠা",
  "nav.features": "বিশেষত্ব",
  "nav.crops": "শস্য",
  "nav.prices": "দাম",
  "nav.weather": "বতৰ",
  "nav.market": "বজাৰ",
  "nav.diagnose": "শস্য ৰোগ নিৰ্ণয়",
  "nav.alerts": "সতৰ্কবাণী",
  "nav.insurance": "বীমা",
  "nav.assistant": "সহায়ক",
  "nav.more": "অধিক",
  "nav.login": "লগ ইন",
  "cta.getStarted": "আৰম্ভ কৰক",
  "common.language": "ভাষা",
  "common.listen": "শুনক",
  "common.save": "সংৰক্ষণ",
};

const BN: Dict = {
  "nav.home": "হোম",
  "nav.features": "বৈশিষ্ট্য",
  "nav.crops": "ফসল",
  "nav.prices": "দাম",
  "nav.weather": "আবহাওয়া",
  "nav.market": "বাজার",
  "nav.diagnose": "ফসল রোগ নির্ণয়",
  "nav.alerts": "সতর্কতা",
  "nav.insurance": "বীমা",
  "nav.assistant": "সহকারী",
  "nav.more": "আরও",
  "nav.login": "লগ ইন",
  "cta.getStarted": "শুরু করুন",
  "common.language": "ভাষা",
  "common.listen": "শুনুন",
  "common.save": "সংরক্ষণ",
};

const HI: Dict = {
  "nav.home": "होम",
  "nav.features": "विशेषताएँ",
  "nav.crops": "फसलें",
  "nav.prices": "भाव",
  "nav.weather": "मौसम",
  "nav.market": "बाज़ार",
  "nav.diagnose": "फसल रोग निदान",
  "nav.alerts": "अलर्ट",
  "nav.insurance": "बीमा",
  "nav.assistant": "सहायक",
  "nav.more": "और",
  "nav.login": "लॉग इन",
  "cta.getStarted": "शुरू करें",
  "common.language": "भाषा",
  "common.listen": "सुनें",
  "common.save": "सहेजें",
};

const KHA: Dict = {
  "nav.home": "Ïing",
  "nav.crops": "Ki rep",
  "nav.prices": "Ka dor",
  "nav.market": "Khiew",
  "nav.login": "Log in",
  "cta.getStarted": "Ïa sdang",
};

const MZO: Dict = {
  "nav.home": "In",
  "nav.crops": "Thlai",
  "nav.prices": "Man",
  "nav.market": "Bazar",
  "nav.login": "Lût",
  "cta.getStarted": "Tan",
};

const DICTS: Record<string, Dict> = { en: EN, as: AS, bn: BN, hi: HI, kha: KHA, mzo: MZO };

/** Translate a key for a language, falling back to English then the key. */
export function t(key: string, lang: string): string {
  return DICTS[lang]?.[key] ?? EN[key] ?? key;
}

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}
