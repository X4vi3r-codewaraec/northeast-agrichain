"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { useSpeech } from "@/hooks/use-speech";
import { DISTRICT_COORDS } from "@/lib/geo";
import {
  SOIL_DEFAULTS,
  centerFor,
  nutrientStatusMeta,
  soilAdvisory,
  type SoilInput,
} from "@/lib/soil";

const DISPLAY_RANGE: Record<keyof SoilInput, [number, number]> = {
  ph: [4, 8],
  n: [0, 600],
  p: [0, 80],
  k: [0, 400],
  oc: [0, 3.5],
};

const FIELD_META: { key: keyof SoilInput; label: string; unit: string; step: number }[] = [
  { key: "ph", label: "Soil pH", unit: "", step: 0.1 },
  { key: "n", label: "Available nitrogen", unit: "kg/ha", step: 10 },
  { key: "p", label: "Available phosphorus", unit: "kg/ha", step: 1 },
  { key: "k", label: "Available potassium", unit: "kg/ha", step: 5 },
  { key: "oc", label: "Organic carbon", unit: "%", step: 0.05 },
];

const DISTRICTS = Object.keys(DISTRICT_COORDS).sort();

function Gauge({ k, value }: { k: keyof SoilInput; value: number }) {
  const [min, max] = DISPLAY_RANGE[k];
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  // optimal band position
  const [lo, hi] = { ph: [5.5, 6.5], n: [280, 560], p: [22, 50], k: [130, 280], oc: [0.75, 2.5] }[k];
  const bandLeft = ((lo - min) / (max - min)) * 100;
  const bandWidth = ((hi - lo) / (max - min)) * 100;
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-forest-950/8">
      <div
        className="absolute inset-y-0 bg-forest-500/20"
        style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
      />
      <div
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-forest-800 shadow"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

export default function SoilAdvisory() {
  const [input, setInput] = useState<SoilInput>(SOIL_DEFAULTS);
  const [district, setDistrict] = useState("East Khasi Hills");
  const [cardScanned, setCardScanned] = useState(false);
  const { speak, stop, speaking } = useSpeech();

  const advisory = useMemo(() => soilAdvisory(input, district), [input, district]);

  const set = (key: keyof SoilInput, value: number) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const scanCard = () => {
    // Demo OCR fill — the FastAPI `/soil/card/ocr` endpoint does this for real.
    setInput({ ph: 5.6, n: 300, p: 24, k: 150, oc: 0.82 });
    setCardScanned(true);
  };

  const narration = `${advisory.summary} Recommended actions: ${advisory.practices
    .map((p) => `${p.title}. ${p.dosage}`)
    .join(". ")}. Estimated input cost ₹${advisory.costTotal} per hectare.`;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="seedling" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Soil &amp; Nutrient Advisory
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Soil health card → regenerative actions for acidic hill soils
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Input panel */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-900">Your soil test</h2>
                <button
                  onClick={scanCard}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest-800 px-3.5 text-xs font-bold text-sand-50 transition hover:bg-forest-700"
                >
                  <Icon name="image" className="h-3.5 w-3.5" />
                  Scan card
                </button>
              </div>
              {cardScanned ? (
                <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-600/15">
                  Soil card read (demo OCR). Review the values below before saving.
                </p>
              ) : null}

              <label className="mt-4 block text-xs font-semibold text-ink-500">
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

              <div className="mt-4 space-y-4">
                {FIELD_META.map((f) => (
                  <label key={f.key} className="block">
                    <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                      {f.label}
                      <span className="font-display text-sm text-ink-900">
                        {input[f.key]}
                        {f.unit ? ` ${f.unit}` : ""}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={DISPLAY_RANGE[f.key][0]}
                      max={DISPLAY_RANGE[f.key][1]}
                      step={f.step}
                      value={input[f.key]}
                      onChange={(e) => set(f.key, Number(e.target.value))}
                      className="mt-1.5 w-full accent-forest-700"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-forest-900 p-5 text-sand-50 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-forest-100/70">
                  Soil health score
                </span>
                <span className="font-display text-3xl font-semibold text-gold-300">
                  {advisory.score}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-forest-100/85">{advisory.summary}</p>
              <button
                onClick={() => (speaking ? stop() : speak(narration))}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-gold-500 px-4 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                <Icon name="mic" className="h-4 w-4" />
                {speaking ? "Stop" : "Listen to advisory"}
              </button>
            </div>
          </aside>

          {/* Results */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Nutrient balance · {district}
              </h2>
              <div className="mt-4 space-y-4">
                {advisory.gauges.map((g) => {
                  const meta = nutrientStatusMeta(g.status);
                  return (
                    <div key={g.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink-700">{g.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-display font-semibold text-ink-900">
                            {g.value}
                            {g.unit ? ` ${g.unit}` : ""}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2">
                        <Gauge k={g.key} value={g.value} />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-400">
                        Healthy band {g.optimal[0]}–{g.optimal[1]}
                        {g.unit ? ` ${g.unit}` : ""} · {g.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  Recommended practices
                </h2>
                <Pill>≈ ₹{advisory.costTotal.toLocaleString("en-IN")}/ha</Pill>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {advisory.practices.map((p) => (
                  <div key={p.title} className="rounded-2xl bg-sand-50 p-4 ring-1 ring-forest-950/6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          p.kind === "organic"
                            ? "bg-forest-100 text-forest-800"
                            : "bg-gold-100 text-gold-800"
                        }`}
                      >
                        <Icon name="leaf" className="h-3 w-3" />
                        {p.kind === "organic" ? "Organic" : "Mineral"}
                      </span>
                      <span className="ml-auto text-xs font-bold text-ink-700">
                        ₹{p.costPerHa.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-ink-900">{p.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{p.detail}</p>
                    <p className="mt-2 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-600/10">
                      Dosage: {p.dosage}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-900">Season task list</h2>
                <ul className="mt-3 space-y-2.5">
                  {advisory.tasks.map((task) => (
                    <li key={task} className="flex items-start gap-2.5 text-sm text-ink-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                        <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
                      </span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-ink-900">Nearest input support</h2>
                <p className="mt-3 flex items-start gap-2.5 text-sm text-ink-700">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                    <Icon name="mapPin" className="h-4 w-4" />
                  </span>
                  {centerFor(district)}
                </p>
                <p className="mt-3 text-[11px] text-ink-400">
                  Recommendations come from the deterministic pH/NPK rules table — the model only
                  phrases the advisory text. Re-test every two seasons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
