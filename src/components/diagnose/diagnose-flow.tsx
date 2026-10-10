"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { CROPS, NER_STATES } from "@/lib/data";
import { useSpeech } from "@/hooks/use-speech";
import {
  prepareImage,
  runMockDiagnosis,
  severityMeta,
  STAGE_LABELS,
  type DiagnosisResult,
  type DiagnosisStage,
  type PlantPart,
} from "@/lib/diagnose";

const HISTORY_KEY = "nac_diag_history";
const QUEUE_KEY = "nac_diag_queue";
const MAX_HISTORY = 8;

const PARTS: { id: PlantPart; label: string; icon: IconName }[] = [
  { id: "leaf", label: "Leaf", icon: "leaf" },
  { id: "fruit", label: "Fruit", icon: "drop" },
  { id: "stem", label: "Stem", icon: "seedling" },
  { id: "whole", label: "Whole plant", icon: "sparkles" },
];

function loadJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / unavailable */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type QueuedJob = {
  dataUrl: string;
  thumb: string;
  cropId: string;
  cropName: string;
  part: PlantPart;
  district: string;
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
          Model confidence
        </span>
        <span className="font-display text-2xl font-semibold text-ink-900">
          {pct}%
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-forest-950/10">
        <div
          className={`h-full rounded-full ${
            value >= 0.75 ? "bg-forest-600" : value >= 0.55 ? "bg-gold-500" : "bg-red-500"
          }`}
          style={{ width: `${Math.max(6, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function ResultCard({ result, onReset }: { result: DiagnosisResult; onReset: () => void }) {
  const [tab, setTab] = useState<"organic" | "chemical">("organic");
  const meta = severityMeta(result.severity);
  const { speak, stop, speaking, supported } = useSpeech("en-IN");

  const speakResult = () => {
    const text = `${result.issue}, ${result.issue_local}. ${result.organic_remedy}. `;
    if (speaking) stop();
    else speak(text);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
      <div className="bg-forest-900 p-6 text-sand-50 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${meta.chip}`}>
            {meta.label}
          </span>
          <Pill dark>
            {result.crop} · {result.part === "whole" ? "whole plant" : result.part}
          </Pill>
          <Pill dark>{result.district}</Pill>
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
          {result.issue}
        </h3>
        <p className="mt-1 text-base font-medium text-gold-300">{result.issue_local}</p>

        <div className="mt-5 max-w-md">
          <ConfidenceBar value={result.confidence} />
        </div>

        {result.lowConfidence ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-500/15 p-4 ring-1 ring-red-400/30">
            <Icon name="image" className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <p className="text-sm text-red-50">
              <strong>Confidence is low.</strong> Retake the photo in daylight —
              flat leaf, one affected patch filling the frame. Or show it to
              your extension officer.
            </p>
          </div>
        ) : null}
      </div>

      <div className="p-6 sm:p-7">
        <h4 className="text-xs font-bold uppercase tracking-wide text-ink-400">
          Why the model thinks this
        </h4>
        <ul className="mt-3 space-y-2.5">
          {result.why.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ink-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" />
              {w}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-2">
          {(["organic", "chemical"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                tab === t
                  ? "bg-forest-800 text-sand-50"
                  : "border border-forest-950/15 text-ink-600 hover:border-forest-600/30"
              }`}
            >
              <Icon name={t === "organic" ? "seedling" : "droplet"} className="h-4 w-4" />
              {t === "organic" ? "Organic remedy" : "Chemical treatment"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-forest-950/8 bg-sand-50/70 p-6">
          {tab === "organic" ? (
            <>
              <p className="text-base font-medium text-ink-900">{result.organic_remedy}</p>
              <p className="mt-2 text-sm text-ink-600">{result.notes}</p>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Product</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink-900">
                  {result.chemical_remedy}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Dosage & schedule</p>
                <p className="mt-1 text-sm text-ink-700">{result.dosage}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  Safety interval before harvest
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-ink-900">
                  {result.waiting_days} days
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Re-check after</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink-900">
                  {result.revisit_days} days
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={speakResult}
            disabled={supported === false}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
              speaking
                ? "bg-forest-800 text-gold-300"
                : "bg-forest-800 text-sand-50 hover:bg-forest-700"
            } ${supported === false ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Icon name={speaking ? "radio" : "mic"} className="h-4 w-4" />
            {speaking ? "Stop reading" : "Hear the remedy"}
          </button>
          <button
            onClick={onReset}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-950/15 px-5 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
          >
            <Icon name="image" className="h-4 w-4" />
            Analyse another photo
          </button>
          <Link
            href={`/diagnose/${result.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-950/15 px-5 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
          >
            <Icon name="book" className="h-4 w-4" />
            Full result page
          </Link>
          <span className="ml-auto text-[11px] font-medium text-ink-400">
            Diagnosis {result.id}
          </span>
        </div>
      </div>
    </div>
  );
}

function HistoryList({ history, onOpen }: { history: DiagnosisResult[]; onOpen: (h: DiagnosisResult) => void }) {
  if (history.length === 0) return null;
  return (
    <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink-900">Your diagnosis history</h2>
        <Pill>{history.length} on this phone</Pill>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {history.map((h) => (
          <button
            key={h.id}
            onClick={() => onOpen(h)}
            className="group overflow-hidden rounded-2xl border border-forest-950/6 bg-sand-50/60 text-left transition hover:border-forest-600/30 hover:shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={h.thumbnail} alt="" className="h-24 w-full object-cover" />
            <div className="p-3">
              <p className="truncate text-sm font-bold text-ink-900">{h.issue}</p>
              <p className="mt-0.5 text-[11px] text-ink-500">
                {Math.round(h.confidence * 100)}% · {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DiagnoseFlow() {
  const [cropId, setCropId] = useState("king-chilli");
  const [part, setPart] = useState<PlantPart>("leaf");
  const [district, setDistrict] = useState("Kamrup Metro");
  const [preview, setPreview] = useState<string | null>(null);
  const [thumb, setThumb] = useState("");
  const [stage, setStage] = useState<DiagnosisStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<DiagnosisResult[]>(() => loadJson<DiagnosisResult>(HISTORY_KEY));
  const [queued, setQueued] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const crop = useMemo(() => CROPS.find((c) => c.id === cropId) ?? CROPS[0], [cropId]);

  const runFull = useCallback(
    async (job: { dataUrl: string; thumb: string; cropId: string; cropName: string; part: PlantPart; district: string }) => {
      setStage("preparing");
      await sleep(650);
      setStage("context");
      await sleep(600);
      setStage("vision");
      await sleep(1100);
      setStage("remedy");
      await sleep(450);
      try {
        const res = await runMockDiagnosis({
          imageDataUrl: job.dataUrl,
          thumb: job.thumb,
          cropId: job.cropId,
          cropName: job.cropName,
          part: job.part,
          district: job.district,
        });
        setResult(res);
        setHistory((prev) => {
          const next = [res, ...prev].slice(0, MAX_HISTORY);
          saveJson(HISTORY_KEY, next);
          return next;
        });
        setStage("done");
      } catch {
        setStage("failed");
        setError("Analysis hit a snag — please retry, or talk to your extension officer.");
      }
    },
    [],
  );

  const flushQueue = useCallback(async () => {
    let q = loadJson<QueuedJob>(QUEUE_KEY);
    let ranAny = false;
    while (q.length > 0) {
      ranAny = true;
      const job = q[0];
      await runFull(job);
      q = q.slice(1);
      saveJson(QUEUE_KEY, q);
    }
    if (ranAny) setQueued(false);
  }, [runFull]);

  useEffect(() => {
    const goOnline = () => {
      setOffline(false);
      void flushQueue();
    };
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [flushQueue]);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const prepared = await prepareImage(file);
      setPreview(prepared.dataUrl);
      setThumb(prepared.thumb);
      setStage("idle");
    } catch (e) {
      setError(
        e instanceof Error && e.message === "unsupported-format"
          ? "That file type isn’t supported — please use a JPG, PNG or WebP photo."
          : "We couldn’t read that image. Try a different photo.",
      );
    }
  };

  const analyse = () => {
    if (!preview) return;
    setError(null);
    if (offline) {
      const job: QueuedJob = { dataUrl: preview, thumb, cropId, cropName: crop.name, part, district };
      const q = loadJson<QueuedJob>(QUEUE_KEY);
      saveJson(QUEUE_KEY, [...q, job]);
      setQueued(true);
      return;
    }
    void runFull({ dataUrl: preview, thumb, cropId, cropName: crop.name, part, district });
  };

  const openHistory = (h: DiagnosisResult) => {
    setResult(h);
    setPreview(h.thumbnail);
    setStage("done");
  };

  const progress = useMemo(() => {
    switch (stage) {
      case "preparing":
        return 18;
      case "context":
        return 42;
      case "vision":
        return 68;
      case "remedy":
        return 88;
      case "done":
        return 100;
      default:
        return 0;
    }
  }, [stage]);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="scanPlus" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                AI Crop Diagnosis
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                GPT-4o mini vision · snap, diagnose, treat
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Input column */}
          <div className="space-y-5">
            {/* Dropzone */}
            <div
              className="relative rounded-3xl border-2 border-dashed border-forest-600/25 bg-white p-6 shadow-sm transition sm:p-8"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              {preview ? (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Plant sample to diagnose" className="max-h-80 w-full object-contain" />
                  <button
                    onClick={() => setPreview(null)}
                    className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/70 text-sand-50 backdrop-blur transition hover:bg-ink-900"
                    aria-label="Remove photo"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
                    <Icon name="image" className="h-8 w-8" />
                  </span>
                  <p className="mt-4 font-display text-lg font-semibold text-ink-900">
                    Drop a leaf photo here
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-ink-500">
                    A clear close-up of the affected part in daylight gives the
                    best diagnosis. Max 1024px, compressed on your phone first.
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-5 text-sm font-bold text-sand-50 shadow-sm transition hover:bg-forest-700"
                >
                  <Icon name="image" className="h-4 w-4" />
                  {preview ? "Change photo" : "Choose from gallery"}
                </button>
                <button
                  onClick={() => cameraInput.current?.click()}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-950/15 px-5 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
                >
                  <Icon name="mic" className="h-4 w-4" />
                  Use camera
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{error}</p>
                  <Link href="/alerts" className="mt-1 inline-block font-bold underline">
                    Find your extension officer via the alert board →
                  </Link>
                </div>
              </div>
            ) : null}

            {queued ? (
              <div className="flex items-center gap-3 rounded-2xl border border-gold-300 bg-gold-50 p-4 text-sm text-ink-800">
                <Icon name="clock" className="h-5 w-5 shrink-0 text-gold-700" />
                <p>
                  <strong>No connection — diagnosis queued.</strong> It will run
                  automatically the moment you’re back online.
                </p>
              </div>
            ) : null}

            {/* Crop, part, district */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wide text-ink-400">
                What are we looking at?
              </label>
              <select
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-forest-950/15 bg-sand-50 px-4 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50 focus:ring-2 focus:ring-forest-600/20"
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.local}
                  </option>
                ))}
              </select>

              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-400">
                Affected part
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PARTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPart(p.id)}
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
                      part === p.id
                        ? "bg-forest-800 text-sand-50"
                        : "border border-forest-950/15 bg-sand-50 text-ink-600 hover:border-forest-600/30"
                    }`}
                  >
                    <Icon name={p.icon} className="h-4 w-4" />
                    {p.label}
                  </button>
                ))}
              </div>

              <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-ink-400">
                Your district (microclimate context)
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-forest-950/15 bg-sand-50 px-4 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50 focus:ring-2 focus:ring-forest-600/20"
              >
                {NER_STATES.map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    {s.districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <button
              onClick={analyse}
              disabled={!preview || stage === "preparing" || stage === "context" || stage === "vision" || stage === "remedy"}
              className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold transition ${
                preview
                  ? "bg-forest-800 text-sand-50 shadow-md hover:bg-forest-700"
                  : "cursor-not-allowed bg-forest-950/10 text-ink-400"
              }`}
            >
              <Icon name="scanPlus" className="h-5 w-5" />
              Analyse with GPT-4o mini
            </button>

            {/* Staged progress */}
            {preview && stage !== "idle" && stage !== "done" && stage !== "failed" ? (
              <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-700">
                    {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]}
                  </span>
                  <span className="font-bold text-forest-700">{progress}%</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-forest-950/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forest-500 to-gold-500 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Result column */}
          <div className="space-y-5">
            {result ? (
              <ResultCard result={result} onReset={() => { setResult(null); setPreview(null); setStage("idle"); }} />
            ) : (
              <div className="rounded-3xl border border-dashed border-forest-950/15 bg-white/60 p-8 text-center">
                <Icon name="leaf" className="mx-auto h-9 w-9 text-forest-600/50" />
                <p className="mt-4 font-display text-lg font-semibold text-ink-700">
                  Your diagnosis appears here
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">
                  Upload a photo, pick the crop and part, then hit Analyse. Demo
                  runs on-device with the same schema the FastAPI service will
                  use with <strong>gpt-4o-mini</strong>.
                </p>
                {offline ? (
                  <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3.5 py-1.5 text-xs font-bold text-yellow-900">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    Offline mode — uploads queue and auto-run on reconnect
                  </p>
                ) : null}
              </div>
            )}
            <HistoryList history={history} onOpen={openHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}