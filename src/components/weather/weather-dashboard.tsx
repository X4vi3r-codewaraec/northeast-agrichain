"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import { NER_STATES } from "@/lib/data";
import { districtGeo } from "@/lib/geo";
import {
  buildAdvisory,
  fetchWeather,
  rainWindow,
  soilMoistureLevel,
  type WeatherReport,
} from "@/lib/weather";
import {
  ACTIVITY_META_BY_ID,
  CROP_TIMELINES,
  MONTHS,
  activityMeta,
} from "@/lib/crop-calendar";
import { ITK_NOTES } from "@/lib/itk";
import { useSpeech } from "@/hooks/use-speech";

const DEFAULT_DISTRICT = "Kamrup Metro";
const CROP_IDS = ["joha-rice", "king-chilli", "lakadong-turmeric", "large-cardamom", "queen-pineapple", "mizo-ginger"];

function SoilGauge({ level }: { level: "low" | "ok" | "wet" | "saturated" }) {
  const map = {
    low: { pct: 25, cls: "bg-clay-400", label: "Low" },
    ok: { pct: 55, cls: "bg-forest-500", label: "Adequate" },
    wet: { pct: 80, cls: "bg-gold-500", label: "Moist" },
    saturated: { pct: 100, cls: "bg-sky-600", label: "Saturated" },
  } as const;
  const m = map[level];
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
        <span>Soil moisture (3-day rain)</span>
        <span className="text-ink-900">{m.label}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-forest-950/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${m.cls}`}
          style={{ width: `${m.pct}%` }}
        />
      </div>
    </div>
  );
}

function TempChart({ report }: { report: WeatherReport }) {
  const W = 640;
  const H = 190;
  const PAD = 26;
  const days = report.days;
  const lo = Math.min(...days.map((d) => d.tempMin)) - 3;
  const hi = Math.max(...days.map((d) => d.tempMax)) + 3;
  const span = hi - lo || 1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (days.length - 1);
  const y = (v: number) => H - PAD - ((v - lo) / span) * (H - PAD * 2 - 24);
  const maxPts = days.map((d, i) => `${x(i)},${y(d.tempMax)}`).join(" ");
  const minPts = days.map((d, i) => `${x(i)},${y(d.tempMin)}`).join(" ");
  const area =
    `${PAD},${H - PAD} ` +
    minPts
      .split(" ")
      .reverse()
      .join(" ") +
    ` ${W - PAD},${H - PAD}`;

  const maxBar = Math.max(...days.map((d) => d.precipProb), 1);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Temperature and rain outlook">
        <defs>
          <linearGradient id="we-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e6b3e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2e6b3e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {days.map((d, i) => (
          <g key={d.date}>
            <line
              x1={x(i)}
              y1={PAD - 6}
              x2={x(i)}
              y2={H - PAD}
              stroke="currentColor"
              strokeOpacity="0.06"
              strokeDasharray="2 4"
            />
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#5b6d63">
              {d.monthLabel}
            </text>
          </g>
        ))}
        <polygon points={area} fill="url(#we-grad)" />
        <polyline points={maxPts} fill="none" stroke="#0a1e12" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={minPts} fill="none" stroke="#f2c266" strokeWidth="2" strokeLinejoin="round" />
        {days.map((d, i) => (
          <g key={`dot-${d.date}`}>
            <circle cx={x(i)} cy={y(d.tempMax)} r="4" fill="#0a1e12" />
            <circle cx={x(i)} cy={y(d.tempMin)} r="4" fill="#f2c266" />
          </g>
        ))}
        <text x={PAD} y={PAD - 10} fontSize="11" fill="#0a1e12" fontWeight="700">
          {hi}° max
        </text>
        <text x={PAD} y={H - PAD + 12} fontSize="11" fill="#0a1e12">
          {lo}° min
        </text>
      </svg>
      <div className="mt-4 flex items-end gap-3">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[11px] font-bold text-ink-700">{d.precipProb}%</span>
            <div className="flex h-16 w-full items-end">
              <div
                className={`w-full rounded-t-full transition-all duration-500 ${
                  d.precipProb >= 70 ? "bg-forest-700" : d.precipProb >= 35 ? "bg-forest-400" : "bg-gold-300"
                }`}
                style={{ height: `${(d.precipProb / maxBar) * 100}%` }}
                title={`${d.weatherLabel}, ${d.precipMm} mm`}
              />
            </div>
            <span className="text-[10px] text-ink-400">rain</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CropCalendar() {
  const [cropId, setCropId] = useState("joha-rice");
  const [nowMonth, setNowMonth] = useState<number | null>(null);
  const crop = CROP_TIMELINES.find((c) => c.id === cropId) ?? CROP_TIMELINES[0];

  useEffect(() => {
    const t = setTimeout(() => setNowMonth(new Date().getMonth()), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Sowing calendar</Eyebrow>
          <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">
            What to plant, when
          </h3>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-500">
            Windows tuned for {crop.name} ({crop.local}) in {crop.region}. The
            gold marker shows today — plan the next job by it.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          Crop
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            className="rounded-full border border-forest-950/15 bg-sand-50 px-4 py-2 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50 focus:ring-2 focus:ring-forest-600/20"
          >
            {CROP_TIMELINES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-px text-center">
        {MONTHS.map((m, i) => (
          <div
            key={m}
            className={`text-[10px] font-bold sm:text-[11px] ${
              nowMonth !== null && i === nowMonth
                ? "rounded-full bg-gold-400/25 py-0.5 text-gold-900"
                : "text-ink-400"
            }`}
          >
            {m}
          </div>
        ))}
      </div>

      <div className="relative">
        {nowMonth !== null ? (
          <div
            className="absolute bottom-0 top-0 w-px bg-gold-500"
            style={{ left: `${(nowMonth / 12) * 100}%` }}
            title="Now"
          />
        ) : null}
        <div className="mt-2 space-y-2.5">
          {crop.windows.map((w, wi) => {
            const meta = activityMeta(w.activity);
            const span = w.start <= w.end ? w.end - w.start + 1 : 12 - w.start + w.end + 1;
            return (
              <div key={wi} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-3 text-xs font-semibold text-ink-700 sm:col-span-2">
                  {meta.label}
                </span>
                <div className="relative col-span-9 h-7 sm:col-span-10">
                  <div className="absolute inset-x-0 inset-y-0 rounded-lg bg-forest-950/4" />
                  <div
                    className={`absolute inset-y-0 flex items-center overflow-hidden rounded-lg px-2 ${meta.classes}`}
                    style={{
                      left: `${(w.start / 12) * 100}%`,
                      width: `${(span / 12) * 100}%`,
                    }}
                    title={w.note}
                  >
                    <span className="truncate text-[10px] font-bold sm:text-[11px]">
                      {span >= 3 ? w.note : meta.short}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {Object.entries(ACTIVITY_META_BY_ID).map(([k, m]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span className={`h-2.5 w-2.5 rounded-full ${m.classes.replace("text-", "").split(" ")[0]}`} />
            {m.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
          <span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> Today
        </span>
      </div>
    </div>
  );
}

function AdvisoryCard({ report }: { report: WeatherReport }) {
  const [cropId, setCropId] = useState("joha-rice");
  const [lang, setLang] = useState("en-IN");
  const crop = CROP_TIMELINES.find((c) => c.id === cropId);
  const cropName = crop?.name ?? "Joha Rice";
  const points = useMemo(() => buildAdvisory(report.days, cropName), [report, cropName]);
  const { speak, stop, speaking, supported } = useSpeech(lang);
  const spokenRef = useRef(points.join(". "));

  useEffect(() => {
    spokenRef.current = points.join(". ");
  }, [points]);

  return (
    <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Field advisory
          </span>
          <h3 className="mt-3 font-display text-2xl font-semibold">
            Today’s 7-day action plan
          </h3>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-forest-100/80">
            Generated by <strong>GPT-4o mini</strong> from local forecast + crop
            stage (demo: rule-based pipeline until the FastAPI service ships —
            always deterministic, never the LLM deciding numbers).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value)}
            className="rounded-full border border-white/20 bg-forest-800 px-3.5 py-2 text-sm font-semibold text-sand-50 outline-none transition focus:border-gold-400/50"
          >
            {CROP_IDS.map((id) => {
              const c = CROP_TIMELINES.find((x) => x.id === id);
              return c ? (
                <option key={id} value={id}>
                  {c.name}
                </option>
              ) : null;
            })}
          </select>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="rounded-full border border-white/20 bg-forest-800 px-3.5 py-2 text-sm font-semibold text-sand-50 outline-none transition focus:border-gold-400/50"
          >
            <option value="en-IN">English (IN)</option>
            <option value="as-IN">অসমীয়া</option>
            <option value="hi-IN">हिन्दी</option>
          </select>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {points.map((p, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-bold text-gold-300">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-forest-50/90">{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            speaking ? stop() : speak(spokenRef.current)
          }
          disabled={supported === false}
          className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
            speaking
              ? "bg-gold-400 text-ink-900"
              : "bg-gold-500 text-ink-900 hover:bg-gold-400"
          } ${supported === false ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Icon name={speaking ? "radio" : "mic"} className="h-4 w-4" />
          {speaking ? "Stop reading" : "Listen to the advisory"}
        </button>
        {supported === false ? (
          <span className="text-xs text-forest-100/60">
            Voice not available in this browser — try Chrome/Edge or a phone.
          </span>
        ) : null}
        <span className="text-xs text-forest-100/60">
          Spoken in {lang} · works offline on saved sessions
        </span>
      </div>
    </div>
  );
}

function ItkPanel() {
  return (
    <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm sm:p-8">
      <Eyebrow>Indigenous knowledge</Eyebrow>
      <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">
        Signs the elders watch
      </h3>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-500">
        Community ITK paired with each forecast — so warnings feel local and
        trusted, not a dashboard from far away.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {ITK_NOTES.map((n, i) => (
          <div
            key={i}
            className="rounded-2xl border border-forest-950/6 bg-sand-50/60 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-forest-700">
                {n.region}
              </span>
              <Pill>{n.season}</Pill>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink-800">“{n.pattern}”</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{n.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeatherDashboard() {
  const [district, setDistrict] = useState(DEFAULT_DISTRICT);
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined") return;
    fetchWeather(district).then((rep) => {
      if (cancelled) return;
      setReport(rep);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [district]);

  const refresh = () => {
    setLoading(true);
    fetchWeather(district).then((rep) => {
      setReport(rep);
      setLoading(false);
    });
  };

  const selected = districtGeo(district);
  const soil = report ? soilMoistureLevel(rainWindow(report.days)) : null;
  const today = report?.days[0];

  return (
    <div className="bg-sand-50">
      {/* Toolbar */}
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
                <Icon name="cloudRain" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                  Climate Outlook
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  7-day microclimate · NER districts
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Pill>
                {report?.source === "open-meteo" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-forest-500" />
                    Live · Open-Meteo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gold-500" />
                    Offline demo data
                  </span>
                )}
              </Pill>
              <button
                onClick={refresh}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 bg-white px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
              >
                <Icon name="drop" className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* District picker */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wide text-ink-400">
                Choose your district
              </label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <select
                  value={district}
                  onChange={(e) => {
                    setLoading(true);
                    setDistrict(e.target.value);
                  }}
                  className="h-12 rounded-2xl border border-forest-950/15 bg-sand-50 px-4 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50 focus:ring-2 focus:ring-forest-600/20"
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
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="mapPin" className="h-3.5 w-3.5 text-forest-600" />
                    {selected?.label ?? district}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="thermometer" className="h-3.5 w-3.5 text-forest-600" />
                    {selected?.elevation ?? 120} m elevation
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="h-3.5 w-3.5 text-forest-600" />
                    Updated {report ? new Date(report.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "…"}
                  </span>
                </div>
              </div>
            </div>

            {/* Today summary */}
            {loading || !report || !today ? (
              <div className="flex h-56 animate-pulse flex-col justify-center rounded-3xl border border-forest-950/8 bg-white p-8 text-center shadow-sm">
                <Icon name="cloud" className="mx-auto h-8 w-8 animate-bounce text-forest-600/50" />
                <p className="mt-3 text-sm font-semibold text-ink-500">
                  Fetching forecast for {district}…
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100/70 text-forest-700">
                        <Icon name={today.icon as IconName} className="h-9 w-9" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                          Today · {today.dayLabel}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-5xl font-semibold text-ink-900">
                            {today.tempMax}°
                          </span>
                          <span className="text-lg text-ink-400">
                            / {today.tempMin}°
                          </span>
                        </div>
                        <p className="text-sm font-medium text-ink-600">
                          {today.weatherLabel}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center sm:gap-5">
                      <div>
                        <Icon name="droplet" className="mx-auto h-5 w-5 text-sky-600" />
                        <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                          {today.precipProb}%
                        </p>
                        <p className="text-[11px] font-medium text-ink-400">rain chance</p>
                      </div>
                      <div>
                        <Icon name="drop" className="mx-auto h-5 w-5 text-forest-600" />
                        <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                          {today.precipMm} mm
                        </p>
                        <p className="text-[11px] font-medium text-ink-400">expected</p>
                      </div>
                      <div>
                        <Icon name="wind" className="mx-auto h-5 w-5 text-forest-600" />
                        <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                          {today.windKmh}
                        </p>
                        <p className="text-[11px] font-medium text-ink-400">km/h gusts</p>
                      </div>
                    </div>
                  </div>
                  {soil ? (
                    <div className="mt-6">
                      <SoilGauge level={soil.level} />
                      <p className="mt-2 text-xs text-ink-500">{soil.label} — derived from the 72-hour rain window.</p>
                    </div>
                  ) : null}
                </div>
                {/* 7-day strip */}
                <div className="border-t border-forest-950/6 bg-sand-50/50 px-4 py-4 sm:px-6">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {report.days.map((d, i) => (
                      <div
                        key={d.date}
                        className={`min-w-[96px] flex-1 rounded-2xl border px-3 py-3 text-center ${
                          i === 0
                            ? "border-gold-400/60 bg-gold-100/50"
                            : "border-forest-950/6 bg-white"
                        }`}
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">
                          {d.dayLabel}
                        </p>
                        <span className="mt-2 block text-forest-700">
                          <Icon name={d.icon as IconName} className="mx-auto h-6 w-6" />
                        </span>
                        <p className="mt-1.5 text-sm font-bold text-ink-900">
                          {d.tempMax}°{" "}
                          <span className="font-medium text-ink-400">/ {d.tempMin}°</span>
                        </p>
                        <p className="text-[11px] font-semibold text-sky-700">
                          {d.precipProb}% rain
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advisory */}
            {report ? (
              <AdvisoryCard report={report} />
            ) : (
              <div className="h-48 animate-pulse rounded-3xl bg-forest-100/60" />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <Eyebrow>7-day trend</Eyebrow>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink-900">
                Temperature & rain
              </h3>
              {report ? <TempChart report={report} /> : <div className="h-64 animate-pulse rounded-2xl bg-forest-100/60" />}
            </div>
            <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                  <Icon name="radio" className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-semibold">Alerts for {district}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-forest-100/80">
                Flash-flood, landslide and frost warnings for your block land on
                the alert board — enabled by default.
              </p>
              <Link
                href="/alerts"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                Open alert board
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Crop calendar */}
        <div className="mt-6">
          <CropCalendar />
        </div>

        {/* ITK */}
        <div className="mt-6">
          <ItkPanel />
        </div>
      </div>
    </div>
  );
}