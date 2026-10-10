/** Local user preferences (voice speed, language, data-saver) persisted to
 *  localStorage. Kept framework-free so hooks and components can both read it. */

const VOICE_RATE_KEY = "nac_voice_rate";
const DATA_SAVER_KEY = "nac_data_saver";
const LANG_KEY = "nac_lang";

export const DEFAULT_VOICE_RATE = 0.95;
export const MIN_VOICE_RATE = 0.6;
export const MAX_VOICE_RATE = 1.4;

function clampRate(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_VOICE_RATE;
  return Math.min(MAX_VOICE_RATE, Math.max(MIN_VOICE_RATE, n));
}

export function getVoiceRate(): number {
  if (typeof window === "undefined") return DEFAULT_VOICE_RATE;
  try {
    const raw = window.localStorage.getItem(VOICE_RATE_KEY);
    return raw ? clampRate(Number(raw)) : DEFAULT_VOICE_RATE;
  } catch {
    return DEFAULT_VOICE_RATE;
  }
}

export function setVoiceRate(rate: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOICE_RATE_KEY, String(clampRate(rate)));
    window.dispatchEvent(new Event("nac-prefs"));
  } catch {
    /* storage unavailable */
  }
}

export function getDataSaver(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DATA_SAVER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDataSaver(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DATA_SAVER_KEY, on ? "1" : "0");
    window.dispatchEvent(new Event("nac-prefs"));
  } catch {
    /* storage unavailable */
  }
}

export const LANG_STORAGE_KEY = LANG_KEY;
