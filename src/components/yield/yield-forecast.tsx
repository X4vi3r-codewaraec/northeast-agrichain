"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { useSpeech } from "@/hooks/use-speech";
import { CROPS, type Crop } from "@/lib/data";
import { DISTRICT_COORDS } from "@/lib/geo";
import { factorBarWidth, yieldForecast } from "@/lib/yield";

const DISTRICTS = Object.keys(DISTRICT_COORDS).sort();

function FactorBar({ label, effectPct, note }: { label: string; effectPct: number; note: string }) {
  const positive = effectPct >= 0;
  const width = factorBarWidth(effectPct);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-700">{label}</span>
        <span className={`font-display font-semibold ${positive ? "text-forest-700" : "text-red-600"}`}>
          {positive ? "+" : ""}
          {effectPct}%
        </span>
      </div>
      <div className="mt-1.5 flex h-2.5 items-center overflow-hidden rounded-full bg-forest-950/8">
        <div className="flex w-1/2 justify-end">
          {!positive ? (
            <div className="h-full rounded-full bg-red-500" style={{ width: `${width}%` }} />
          ) : null}
        </div>
        <div className="flex w-1/2">
          {positive ? (
            <div className="h-full rounded-full bg-forest-600" style={{ width: `${width}%` }} />
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-ink-400">{note}</p>
    </div>
  );
}

export default function YieldForecast() {
  const [cropId, setCropId] = useState("joha-rice");
  const [areaHa, setAreaHa] = useState(2);
  const [district, setDistrict] = useState("Jorhat");
  const [rainfallPct, setRainfallPct] = useState(0);
  const [irrigation, setIrrigation] = useState(0.3);
  const [organic, setOrganic] = useState(false);
  const [seasons, setSeasons] = useState(2);
  const { speak, stop, speaking } = useSpeech();

  const crop: Crop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];
  const forecast = useMemo(
    () => yieldForecast({ cropId, areaHa, district, rainfallPct, irrigation, organic, seasonsHistory: seasons }),
    [cropId, areaHa, district, rainfallPct, irrigation, organic, seasons],
  );

  const bandSpan = forecast.high - forecast.low || 1;
  const narrative = `${crop.name} in ${district}: expected yield ${forecast.expected} tonnes for ${areaHa} hectares, with a range of ${forecast.low} to ${forecast.high} tonnes and ${Math.round(
    forecast.confidence * 100,
  )} percent confidence. ${forecast.explanation}`;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="chart" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Yield Forecast
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                District-aware bands · weather + practice + terrain, computed deterministically
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">Your plot</h2>

              <label className="mt-4 block text-xs font-semibold text-ink-500">
                Crop
                <select
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-forest-950/12 bg-sand-50 px-3 text-sm font-semibold text-ink-700 outline-none focus:border-forest-600/50"
                >
                  {CROPS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-xs font-semibold text-ink-500">
                District
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-forest-950/12 bg-sand-50 px-3 text-sm font-semibold text-ink-700 outline-none focus:border-forest-600/50"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Area
                  <span className="font-display text-sm text-ink-900">{areaHa} ha</span>
                </span>
                <input
                  type="range"
                  min={0.25}
                  max={12}
                  step={0.25}
                  value={areaHa}
                  onChange={(e) => setAreaHa(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Rainfall vs normal
                  <span className="font-display text-sm text-ink-900">
                    {rainfallPct > 0 ? "+" : ""}
                    {rainfallPct}%
                  </span>
                </span>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={rainfallPct}
                  onChange={(e) => setRainfallPct(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Irrigation cover
                  <span className="font-display text-sm text-ink-900">
                    {Math.round(irrigation * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={irrigation}
                  onChange={(e) => setIrrigation(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Farm history on platform
                  <span className="font-display text-sm text-ink-900">{seasons} seasons</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={seasons}
                  onChange={(e) => setSeasons(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <button
                onClick={() => setOrganic((v) => !v)}
                className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition ${
                  organic
                    ? "bg-forest-800 text-sand-50"
                    : "border border-forest-950/15 bg-sand-50 text-ink-600"
                }`}
              >
                <Icon name="leaf" className="h-4 w-4" />
                {organic ? "Organic practice" : "Conventional practice"}
              </button>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    Expected harvest · {crop.name}
                  </p>
                  <p className="mt-1 font-display text-4xl font-semibold text-ink-900">
                    {forecast.expected} t
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {forecast.perHaExpected} t/ha · range {forecast.low}–{forecast.high} t
                  </p>
                </div>
                <div className="text-right">
                  <Pill>{usesDistrictAverageLabel(forecast.usesDistrictAverage)}</Pill>
                  <p className="mt-2 text-xs font-semibold text-ink-500">
                    Confidence {Math.round(forecast.confidence * 100)}%
                  </p>
                </div>
              </div>

              {/* Band bar */}
              <div className="mt-5">
                <div className="relative h-8">
                  <div className="absolute inset-x-0 top-3 h-2.5 rounded-full bg-gradient-to-r from-orange-400 via-gold-400 to-forest-500" />
                  <div
                    className="absolute top-0 h-8 w-1 -translate-x-1/2 rounded-full bg-ink-900"
                    style={{ left: `${((forecast.expected - forecast.low) / bandSpan) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] font-semibold text-ink-400">
                  <span>Low {forecast.low} t</span>
                  <span>High {forecast.high} t</span>
                </div>
              </div>

              <p className="mt-4 rounded-2xl bg-sand-50 p-3.5 text-sm leading-relaxed text-ink-600">
                {forecast.explanation}
              </p>

              <button
                onClick={() => (speaking ? stop() : speak(narrative))}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
              >
                <Icon name="mic" className="h-4 w-4" />
                {speaking ? "Stop" : "Listen to forecast"}
              </button>
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                What is moving the number
              </h2>
              <div className="mt-4 space-y-4">
                {forecast.factors.map((f) => (
                  <FactorBar key={f.label} label={f.label} effectPct={f.effectPct} note={f.note} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function usesDistrictAverageLabel(usesDistrictAverage: boolean): string {
  return usesDistrictAverage ? "District average used" : "Your farm history used";
}
