"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { districtGeo } from "@/lib/geo";
import { haversineKm } from "@/lib/logistics";
import {
  GRADE_LABEL,
  LISTINGS,
  type Listing,
  type ListingGrade,
} from "@/lib/market";

type BuyState = "idle" | "escrow" | "offer";

function ListingCard({
  l,
  km,
  buyState,
  onBuy,
}: {
  l: Listing;
  km: number;
  buyState: BuyState;
  onBuy: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm transition hover:shadow-md">
      <div className={`relative h-36 bg-gradient-to-br ${l.grad}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-forest-800 shadow">
            <Icon name="leaf" className="h-7 w-7" />
          </span>
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink-900">
            {GRADE_LABEL[l.grade]}
          </span>
          {l.organic ? (
            <span className="rounded-full bg-forest-700/90 px-2.5 py-1 text-[11px] font-bold text-white">
              Organic
            </span>
          ) : null}
        </div>
        {l.giCert ? (
          <span className="absolute top-3 right-3 rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-bold text-ink-900">
            GI
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">
              {l.cropName} <span className="text-sm font-medium text-ink-400">· {l.local}</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {l.district}, {l.state} · {km === 0 ? "your district" : `~${km} km`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-semibold text-ink-900">₹{l.pricePerKg}</p>
            <p className="text-[11px] text-ink-400">per kg</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Pill>{l.qtyT} t</Pill>
          <Pill>{l.deliveryWindow}</Pill>
          {l.traceToFarm ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-bold text-forest-700 ring-1 ring-forest-600/15">
              <Icon name="mapPin" className="h-3 w-3" />
              Trace to farm
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-forest-950/6 pt-3">
          <div className="text-xs">
            <p className="font-bold text-ink-800">{l.seller}</p>
            <p className="text-ink-500">
              {l.sellerRole} · ★ {l.rating.toFixed(1)} · harvested {l.harvestDaysAgo}d ago
            </p>
          </div>
          <Link
            href={`/marketplace/${l.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition hover:text-forest-600"
          >
            View lot &amp; trace
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onBuy}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
          >
            <Icon name="shield" className="h-4 w-4" />
            {buyState === "escrow" ? "Escrow hold placed" : "Buy with escrow"}
          </button>
          <button
            onClick={onBuy}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-forest-950/15 px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
          >
            Make offer
          </button>
        </div>
        {buyState === "escrow" ? (
          <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-600/15">
            Payment held until delivery proof. Trace-to-farm and lab grade verified by the pool.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function Marketplace() {
  const [cropFilter, setCropFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState<"all" | ListingGrade>("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [escrowed, setEscrowed] = useState<string | null>(null);

  const crops = useMemo(() => {
    const set = new Set(LISTINGS.map((l) => l.cropName));
    return [...set];
  }, []);

  const states = useMemo(() => {
    const set = new Set(LISTINGS.map((l) => l.state));
    return [...set];
  }, []);

  const filtered = useMemo(() => {
    return LISTINGS.filter((l) => (cropFilter === "all" ? true : l.cropName === cropFilter))
      .filter((l) => (stateFilter === "all" ? true : l.state === stateFilter))
      .filter((l) => (gradeFilter === "all" ? true : l.grade === gradeFilter))
      .filter((l) => (organicOnly ? l.organic : true));
  }, [cropFilter, stateFilter, gradeFilter, organicOnly]);

  const distance = (l: Listing) => {
    const a = districtGeo("Kamrup Metro");
    const b = districtGeo(l.district);
    if (!a || !b) return 0;
    return Math.round(haversineKm(a, b));
  };

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="store" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                B2B Marketplace
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Verified NER produce · trace to farm · escrow-secured
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter rail */}
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-forest-950/8 bg-white p-4 shadow-sm">
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="h-10 rounded-full border border-forest-950/12 bg-sand-50 px-3.5 text-sm font-semibold text-ink-700 outline-none transition focus:border-forest-600/50"
          >
            <option value="all">All crops</option>
            {crops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-10 rounded-full border border-forest-950/12 bg-sand-50 px-3.5 text-sm font-semibold text-ink-700 outline-none transition focus:border-forest-600/50"
          >
            <option value="all">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            {(["all", "A", "B", "C"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`inline-flex h-9 items-center rounded-full px-3.5 text-xs font-bold transition ${
                  gradeFilter === g
                    ? "bg-forest-800 text-sand-50"
                    : "border border-forest-950/12 bg-sand-50 text-ink-600 hover:border-forest-600/30"
                }`}
              >
                {g === "all" ? "Any grade" : GRADE_LABEL[g]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOrganicOnly((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
              organicOnly
                ? "bg-forest-800 text-sand-50"
                : "border border-forest-950/12 bg-sand-50 text-ink-600"
            }`}
          >
            <Icon name="leaf" className="h-3.5 w-3.5" />
            Organic only
          </button>
          <span className="ml-auto text-xs font-semibold text-ink-500">
            {filtered.length} lots · sorted by freshness
          </span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              l={l}
              km={distance(l)}
              buyState={escrowed === l.id ? "escrow" : "idle"}
              onBuy={() => setEscrowed(escrowed === l.id ? null : l.id)}
            />
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Have a lot to sell?</h2>
              <p className="mt-1.5 max-w-lg text-sm text-forest-100/80">
                List your harvest with photos, grade and certification — the
                escrow and pooling rails auto-fill from your farm profile.
              </p>
            </div>
            <Link
              href="/marketplace/new"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gold-500 px-6 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
            >
              <Icon name="coin" className="h-4 w-4" />
              Create a listing
            </Link>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-forest-100/60">
            <Icon name="shield" className="h-4 w-4 text-gold-300" />
            Every listing carries trace-to-farm proof, quality grade and an escrow hold on payment — no middlemen, no defaults.
          </p>
        </div>
      </div>
    </div>
  );
}