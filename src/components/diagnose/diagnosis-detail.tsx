"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { useSpeech } from "@/hooks/use-speech";
import {
  diagnosisById,
  severityMeta,
  type DiagnosisResult,
} from "@/lib/diagnose";

const HISTORY_KEY = "nac_diag_history";
const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function loadHistory(): DiagnosisResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as DiagnosisResult[]) : [];
  } catch {
    return [];
  }
}

function partLabel(p: DiagnosisResult["part"]): string {
  switch (p) {
    case "leaf":
      return "Leaf";
    case "fruit":
      return "Fruit";
    case "stem":
      return "Stem";
    case "whole":
      return "Whole plant";
  }
}

export default function DiagnosisDetail({ id }: { id: string }) {
  const mounted = useMounted();
  const { speak, stop, speaking } = useSpeech();

  const stored = useMemo(() => (mounted ? loadHistory() : []), [mounted]);
  const result = useMemo<DiagnosisResult>(() => {
    const found = stored.find((h) => h.id === id);
    return found ?? diagnosisById(id);
  }, [stored, id]);

  const sm = severityMeta(result.severity);
  const confPct = Math.round(result.confidence * 100);
  const similar = stored.filter((h) => h.id !== id).slice(0, 4);

  const narration = `${result.issue} on your ${result.crop}, ${partLabel(result.part)}. Confidence ${confPct} percent. ${result.why.join(
    " ",
  )} Organic option: ${result.organic_remedy} Chemical option: ${result.chemical_remedy}, dosage ${result.dosage}. Re-check in ${result.revisit_days} days.`;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-600"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
            Back to diagnosis
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="scanPlus" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                {result.issue}
              </h1>
              <p className="text-xs font-medium text-ink-400">
                {result.issue_local} · {result.crop} · {partLabel(result.part)} · {result.district}
              </p>
            </div>
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${sm.chip}`}>
              {sm.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Result summary */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Confidence</p>
                <p className="font-display text-3xl font-semibold text-ink-900">{confPct}%</p>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-forest-950/8">
                <div
                  className={`h-full rounded-full ${confPct >= 75 ? "bg-forest-600" : confPct >= 55 ? "bg-gold-500" : "bg-red-600"}`}
                  style={{ width: `${confPct}%` }}
                />
              </div>
              {result.lowConfidence ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 ring-1 ring-red-600/15">
                  Low confidence — retake the photo in daylight with the affected area filling the
                  frame, or consult an extension officer.
                </p>
              ) : null}

              {result.thumbnail ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-forest-950/8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.thumbnail} alt="Diagnosed crop" className="h-40 w-full object-cover" />
                </div>
              ) : (
                <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-forest-900 text-forest-100/60">
                  <span className="text-center text-xs font-semibold">
                    <Icon name="image" className="mx-auto mb-1 h-6 w-6 text-gold-300" />
                    No photo on this device
                  </span>
                </div>
              )}

              <button
                onClick={() => (speaking ? stop() : speak(narration))}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-forest-800 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
              >
                <Icon name="mic" className="h-4 w-4" />
                {speaking ? "Stop" : "Listen in your language"}
              </button>
              <p className="mt-2 text-center text-[10px] text-ink-400">
                Confirmed {formatDate(result.createdAt)} · {result.district}
              </p>
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-semibold text-ink-900">Timing</h2>
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-sand-50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-ink-600">
                    <Icon name="clock" className="h-4 w-4 text-forest-600" /> Re-check crop
                  </span>
                  <span className="font-bold text-ink-900">in {result.revisit_days} days</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-sand-50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-ink-600">
                    <Icon name="shield" className="h-4 w-4 text-forest-600" /> Harvest safe after
                  </span>
                  <span className="font-bold text-ink-900">{result.waiting_days} days</span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-ink-400">
                Waiting periods are pre-harvest-interval rules from the catalog, not model guesses.
              </p>
            </div>
          </aside>

          {/* Detail */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Why the model picked this
              </h2>
              <ul className="mt-4 space-y-3">
                {result.why.map((w) => (
                  <li key={w} className="flex items-start gap-3 text-sm text-ink-700">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-forest-600/20 bg-forest-50 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white">
                    <Icon name="leaf" className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-base font-semibold text-forest-900">
                    Organic remedy
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-forest-900/85">{result.organic_remedy}</p>
              </div>
              <div className="rounded-3xl border border-gold-600/20 bg-gold-50 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-600 text-white">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-base font-semibold text-gold-900">
                    Chemical remedy
                  </h2>
                </div>
                <p className="mt-3 text-sm font-semibold text-gold-900">{result.chemical_remedy}</p>
                <p className="mt-1 text-sm text-gold-900/80">Dosage: {result.dosage}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Notes for your field</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{result.notes}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/diagnose"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
                >
                  <Icon name="scanPlus" className="h-4 w-4" />
                  Diagnose another
                </Link>
                <button className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 px-4 text-sm font-bold text-forest-800 transition hover:bg-forest-50">
                  <Icon name="clock" className="h-4 w-4" />
                  Add re-check reminder
                </button>
                <Link
                  href="/assistant"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 px-4 text-sm font-bold text-forest-800 transition hover:bg-forest-50"
                >
                  <Icon name="sparkles" className="h-4 w-4" />
                  Ask a follow-up
                </Link>
              </div>
            </div>

            {similar.length > 0 ? (
              <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  Earlier on this phone
                </h2>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {similar.map((h) => (
                    <Link
                      key={h.id}
                      href={`/diagnose/${h.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6 transition hover:ring-forest-600/25"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                        <Icon name="scanPlus" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-900">{h.issue}</p>
                        <p className="truncate text-xs text-ink-500">
                          {h.crop} · {Math.round(h.confidence * 100)}%
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}
