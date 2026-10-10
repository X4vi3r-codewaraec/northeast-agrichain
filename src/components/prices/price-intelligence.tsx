"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import {
  buildPriceProfiles,
  marketCommentary,
  signalMeta,
  type CropPriceProfile,
  type PriceSignal,
} from "@/lib/prices";

function Sparkline({ p }: { p: CropPriceProfile }) {
  const W = 520;
  const H = 140;
  const PAD = 8;
  const pts = p.series;
  const lo = Math.min(...pts.map((x) => x.price));
  const hi = Math.max(...pts.map((x) => x.price));
  const span = hi - lo || 1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (pts.length - 1);
  const y = (v: number) => H - PAD - ((v - lo) / span) * (H - PAD * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${p.cropName} 30 day price trend`}>
      <defs>
        <linearGradient id={`pg-${p.cropId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e6b3e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2e6b3e" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD}
          x2={W - PAD}
          y1={PAD + (H - PAD * 2) * f}
          y2={PAD + (H - PAD * 2) * f}
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeDasharray="2 5"
        />
      ))}
      <path
        d={`M${pts.map((pp, i) => `${x(i)},${y(pp.price)}`).join(" L")} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z`}
        fill={`url(#pg-${p.cropId})`}
      />
      <polyline
        points={pts.map((pp, i) => `${x(i)},${y(pp.price)}`).join(" ")}
        fill="none"
        stroke="#2e6b3e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {pts.map((pp, i) =>
        i % 5 === 0 ? (
          <text key={i} x={x(i)} y={H - 2} textAnchor="middle" fontSize="9" fill="#5b6d63">
            {pp.date.slice(5)}
          </text>
        ) : null,
      )}
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].price)} r="4" fill="#f2c266" stroke="#0a1e12" strokeWidth="1.4" />
    </svg>
  );
}

function ProfileCard({ p, active, onSelect }: { p: CropPriceProfile; active: boolean; onSelect: () => void }) {
  const sig = signalMeta(p.signal);
  const fair = p.fairValueBand;
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
        active ? "border-forest-600/45 bg-forest-50" : "border-forest-950/8 bg-white hover:border-forest-600/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">{p.cropName}</p>
          <p className="text-xs text-ink-500">{p.unit} · fair band ₹{fair[0]}–{fair[1]}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${sig.cls}`}>
          <Icon name={sig.icon} className="h-3.5 w-3.5" />
          {sig.label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-ink-900">₹{p.priceToday}</span>
        <span
          className={`text-sm font-bold ${p.trend7Pct >= 0 ? "text-forest-700" : "text-red-600"}`}
        >
          {p.trend7Pct >= 0 ? "▲" : "▼"} {Math.abs(p.trend7Pct)}% / 7d
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-ink-500">
        <div className="rounded-xl bg-sand-50 px-2 py-1.5">
          <p className="font-bold text-ink-900">{p.avg90}</p>
          <p>90-day avg</p>
        </div>
        <div className="rounded-xl bg-sand-50 px-2 py-1.5">
          <p className="font-bold text-ink-900">{p.high90}</p>
          <p>high</p>
        </div>
        <div className="rounded-xl bg-sand-50 px-2 py-1.5">
          <p className="font-bold text-ink-900">{p.low90}</p>
          <p>low</p>
        </div>
      </div>
    </button>
  );
}

export default function PriceIntelligence() {
  const [profiles, setProfiles] = useState<CropPriceProfile[] | null>(null);
  const [cropId, setCropId] = useState("king-chilli");

  useEffect(() => {
    const t = setTimeout(() => setProfiles(buildPriceProfiles()), 0);
    return () => clearTimeout(t);
  }, []);

  const active = useMemo(
    () => profiles?.find((p) => p.cropId === cropId) ?? null,
    [profiles, cropId],
  );

  const signals = useMemo(() => {
    const counts = { sell: 0, hold: 0, watch: 0 } as Record<PriceSignal, number>;
    (profiles ?? []).forEach((p) => {
      counts[p.signal] += 1;
    });
    return counts;
  }, [profiles]);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
                <Icon name="chart" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                  Price Intelligence
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Mandi + eNAM trends · fair-value signals · sell or hold
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-bold text-forest-800 ring-1 ring-forest-600/10">
                <Icon name="check" className="h-3.5 w-3.5" /> {signals.sell} sell
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-xs font-bold text-gold-900 ring-1 ring-gold-500/20">
                <Icon name="clock" className="h-3.5 w-3.5" /> {signals.hold} hold
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-800 ring-1 ring-orange-500/20">
                <Icon name="sparkles" className="h-3.5 w-3.5" /> {signals.watch} watch
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">
            {profiles === null ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-3xl border border-forest-950/6 bg-white" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {profiles.map((p) => (
                  <ProfileCard key={p.cropId} p={p} active={p.cropId === cropId} onSelect={() => setCropId(p.cropId)} />
                ))}
              </div>
            )}

            {active ? (
              <>
                <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Eyebrow>30-day trend</Eyebrow>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">
                        {active.cropName} · ₹{active.priceToday}/{active.unit.split("/")[1]}
                      </h2>
                    </div>
                    <Pill>
                      7d {active.trend7Pct >= 0 ? "+" : ""}
                      {active.trend7Pct}% · 30d {active.trend30Pct >= 0 ? "+" : ""}
                      {active.trend30Pct}%
                    </Pill>
                  </div>
                  <div className="mt-4">
                    <Sparkline p={active} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-sand-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Mandi reference</p>
                      <p className="mt-1 font-display text-xl font-semibold text-ink-900">₹{active.mandiPrice}/kg</p>
                    </div>
                    <div className="rounded-2xl bg-sand-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-400">eNAM remote quote</p>
                      <p className="mt-1 font-display text-xl font-semibold text-ink-900">₹{active.eNamPrice}/kg</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg sm:p-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">
                    <Icon name="sparkles" className="h-3.5 w-3.5" />
                    Market commentary · gpt-4o mini (rule-based demo)
                  </span>
                  <div className="mt-4 space-y-3">
                    {marketCommentary(active).map((l, i) => (
                      <p key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-forest-50/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                        {l}
                      </p>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-sand-50 ring-1 ring-white/15">
                      Fair-value band ₹{active.fairValueBand[0]}–{active.fairValueBand[1]}/kg
                    </span>
                    <Link
                      href="/marketplace"
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
                    >
                      List in marketplace
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">How the signal works</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-600">
                <li className="flex items-start gap-2.5">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <span><strong className="text-ink-900">Sell now</strong> — price above fair band with weekly momentum up.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <span><strong className="text-ink-900">Hold ~1 week</strong> — inside band; graded lots usually gain on 5–7 day windows.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="sparkles" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <span><strong className="text-ink-900">Watch</strong> — under band; forward contract or cold-chain hold beats distress sale.</span>
                </li>
              </ul>
              <p className="mt-4 rounded-2xl bg-sand-50 p-4 text-xs leading-relaxed text-ink-500">
                All numbers here (band, %, ₹) are computed from the series — the
                model only narrates. Live mandi/eNAM feeds arrive with the
                FastAPI service.
              </p>
            </div>
            <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
              <h2 className="font-display text-lg font-semibold">Price alerts</h2>
              <p className="mt-2 text-sm text-forest-100/80">
                Get a phone call when your crop crosses its fair band. Enables
                the alert board notification bridge.
              </p>
              <Link
                href="/alerts"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                <Icon name="radio" className="h-4 w-4" />
                Manage alerts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}