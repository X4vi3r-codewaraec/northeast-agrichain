"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { clearSession, getSession, type Session } from "@/lib/auth-client";
import { ROLES } from "@/lib/data";
import { LANGUAGES } from "@/lib/data";
import { languageName, setLanguage, t, useLanguage } from "@/lib/i18n";
import {
  DEFAULT_VOICE_RATE,
  getDataSaver,
  getVoiceRate,
  setDataSaver,
  setVoiceRate,
} from "@/lib/settings";

const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function subscribePrefs(cb: () => void) {
  window.addEventListener("nac-prefs", cb);
  return () => window.removeEventListener("nac-prefs", cb);
}

export default function SettingsPanel() {
  const router = useRouter();
  const mounted = useMounted();
  const lang = useLanguage();
  const rate = useSyncExternalStore(subscribePrefs, getVoiceRate, () => DEFAULT_VOICE_RATE);
  const saver = useSyncExternalStore(subscribePrefs, getDataSaver, () => false);

  const session: Session | null = mounted ? getSession() : null;
  const roleLabel = session ? ROLES.find((r) => r.id === session.role)?.label ?? session.role : "";

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="globe" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Settings
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Language, voice and low-bandwidth controls
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        {/* Account */}
        <section className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Account</h2>
          {session ? (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-800 font-display text-xl font-semibold text-gold-300">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink-900">{session.name}</p>
                <p className="text-xs text-ink-500">
                  {roleLabel} · {session.district}, {session.state}
                </p>
                <p className="text-xs text-ink-400">Preferred language: {languageName(session.lang)}</p>
              </div>
              <button
                onClick={() => {
                  clearSession();
                  router.push("/login");
                }}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
              >
                <Icon name="x" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-500">
                You are browsing signed out. Log in to sync your farm profile.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
              >
                Log in
              </button>
            </div>
          )}
        </section>

        {/* Language */}
        <section className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {t("common.language", lang)}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            The interface and voice prompts follow this choice. Full translation tables ship with the
            FastAPI i18n bundle; the seam is already wired.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`inline-flex h-11 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${
                  lang === l.code
                    ? "bg-forest-800 text-sand-50"
                    : "border border-forest-950/12 bg-sand-50 text-ink-700 hover:border-forest-600/30"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </section>

        {/* Voice */}
        <section className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-900">Voice &amp; audio</h2>
            <span className="font-display text-sm font-semibold text-ink-900">
              {rate.toFixed(2)}×
            </span>
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-semibold text-ink-500">Speech speed</span>
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.05}
              value={rate}
              onChange={(e) => setVoiceRate(Number(e.target.value))}
              className="mt-1.5 w-full accent-forest-700"
            />
          </label>
          <p className="mt-2 text-xs text-ink-400">
            Applies to every &ldquo;Listen&rdquo; button across weather, diagnosis and advisories.
          </p>
        </section>

        {/* Data saver */}
        <section className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Low-bandwidth mode</h2>
              <p className="mt-1 text-sm text-ink-500">
                Compress photos harder, prefer text over imagery and cache advisories for offline
                viewing on hill connectivity.
              </p>
            </div>
            <button
              onClick={() => setDataSaver(!saver)}
              aria-pressed={saver}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                saver ? "bg-forest-700" : "bg-forest-950/15"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  saver ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
