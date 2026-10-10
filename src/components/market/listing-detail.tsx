"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { GRADE_LABEL, listingTrace, polygonsToSvgPoints } from "@/lib/market";

function Sparkline({ series, stroke = "#166534" }: { series: number[]; stroke?: string }) {
  const { points, min, max } = useMemo(() => {
    const lo = Math.min(...series);
    const hi = Math.max(...series);
    const span = hi - lo || 1;
    const pts = series
      .map((v, i) => `${(i / (series.length - 1)) * 100},${100 - ((v - lo) / span) * 100}`)
      .join(" ");
    return { points: pts, min: lo, max: hi };
  }, [series]);
  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-20 w-full">
        <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] font-semibold text-ink-400">
        <span>₹{min}</span>
        <span>last 30 days</span>
        <span>₹{max}</span>
      </div>
    </div>
  );
}

export default function ListingDetail({ id }: { id: string }) {
  const trace = useMemo(() => listingTrace(id), [id]);
  const [qty, setQty] = useState(1);
  const [stage, setStage] = useState<"idle" | "escrow" | "offer" | "sample">("idle");
  const [offer, setOffer] = useState("");

  if (!trace) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
          <Icon name="store" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">Listing not found</h1>
        <p className="mt-2 text-sm text-ink-500">
          This lot may have sold out or been withdrawn. Browse the marketplace for similar produce.
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50"
        >
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
          Back to marketplace
        </Link>
      </div>
    );
  }

  const { listing } = trace;
  const kg = Math.round(qty * 1000);
  const gross = kg * listing.pricePerKg;
  const escrowFee = Math.round(gross * 0.02);
  const total = gross + escrowFee;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-600"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
            Back to marketplace
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {/* Banner */}
            <div className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
              <div className={`relative h-48 bg-gradient-to-br ${listing.grad} sm:h-60`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/85 text-forest-800 shadow">
                    <Icon name="leaf" className="h-10 w-10" />
                  </span>
                </div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink-900">
                    {GRADE_LABEL[listing.grade]}
                  </span>
                  {listing.organic ? (
                    <span className="rounded-full bg-forest-700/90 px-3 py-1 text-xs font-bold text-white">
                      Organic
                    </span>
                  ) : null}
                  {listing.giCert ? (
                    <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-ink-900">
                      GI tagged
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl font-semibold text-ink-900">
                      {listing.cropName} <span className="text-base font-medium text-ink-400">· {listing.local}</span>
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                      {listing.district}, {listing.state} · harvested {listing.harvestDaysAgo}d ago · {listing.deliveryWindow}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-semibold text-ink-900">₹{listing.pricePerKg}</p>
                    <p className="text-xs text-ink-400">per kg · {listing.qtyT} t available</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill>{listing.seller} · {listing.sellerRole}</Pill>
                  <Pill>★ {listing.rating.toFixed(1)} seller rating</Pill>
                  {listing.traceToFarm ? <Pill>Trace-to-farm verified</Pill> : null}
                </div>
              </div>
            </div>

            {/* Trace to farm */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Icon name="mapPin" className="h-5 w-5 text-forest-700" />
                <h2 className="font-display text-lg font-semibold text-ink-900">Trace to farm</h2>
              </div>
              <div className="mt-4 grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-2xl bg-forest-900 p-4">
                  <svg viewBox="0 0 100 100" className="h-44 w-full">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M10 0H0V10" fill="none" stroke="#ffffff18" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                    <polygon
                      points={polygonsToSvgPoints(trace.polygon)}
                      fill="#facc1533"
                      stroke="#facc15"
                      strokeWidth="1.5"
                    />
                    <circle cx="50" cy="50" r="2" fill="#facc15" />
                  </svg>
                  <p className="mt-2 text-center text-[11px] font-semibold text-forest-100/70">
                    Farm polygon · {listing.district}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Certifications</p>
                    <ul className="mt-2 space-y-1.5">
                      {trace.certifications.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-sm text-ink-700">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                            <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Soil history</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {trace.soilHistory.map((s) => (
                        <div key={s.season} className="rounded-xl bg-sand-50 p-2.5 text-center ring-1 ring-forest-950/6">
                          <p className="text-[10px] font-semibold text-ink-400">{s.season}</p>
                          <p className="font-display text-sm font-semibold text-ink-900">pH {s.ph}</p>
                          <p className="text-[10px] text-ink-500">OC {s.organicCarbon}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Recent diagnosis log</p>
                    <ul className="mt-2 space-y-1.5">
                      {trace.diagnosisLog.map((d) => (
                        <li key={d.when} className="flex items-center gap-2 text-sm text-ink-600">
                          <Icon name="scanPlus" className="h-4 w-4 text-forest-600" />
                          <span className="font-semibold text-ink-800">{d.issue}</span>
                          <span className="text-xs text-ink-400">
                            {d.when} · {Math.round(d.confidence * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Price + rainfall */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  This crop · price trend
                </p>
                <div className="mt-2">
                  <Sparkline series={trace.priceSeries} />
                </div>
              </div>
              <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  Farm district · monthly rainfall
                </p>
                <div className="mt-3 flex h-20 items-end gap-1.5">
                  {trace.rainfallMm.map((mm, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-sky-500/70"
                      style={{ height: `${Math.max(6, (mm / 320) * 100)}%` }}
                      title={`${mm} mm`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] font-semibold text-ink-400">Jan → Dec (mm)</p>
              </div>
            </div>
          </div>

          {/* Order rail */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">Place an order</h2>
              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Quantity
                  <span className="font-display text-sm text-ink-900">
                    {qty} t <span className="font-normal text-ink-400">({kg} kg)</span>
                  </span>
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={listing.qtyT}
                  step={0.1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <dl className="mt-4 space-y-1.5 rounded-2xl bg-sand-50 p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Produce value</dt>
                  <dd className="font-semibold text-ink-900">₹{gross.toLocaleString("en-IN")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Escrow &amp; handling (2%)</dt>
                  <dd className="font-semibold text-ink-900">₹{escrowFee.toLocaleString("en-IN")}</dd>
                </div>
                <div className="flex justify-between border-t border-forest-950/8 pt-1.5">
                  <dt className="font-bold text-ink-900">Escrow hold total</dt>
                  <dd className="font-display text-lg font-semibold text-ink-900">
                    ₹{total.toLocaleString("en-IN")}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={() => setStage("escrow")}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest-800 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
                >
                  <Icon name="shield" className="h-4 w-4" />
                  {stage === "escrow" ? "Escrow hold placed" : "Buy with escrow"}
                </button>
                <button
                  onClick={() => setStage("offer")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-forest-950/15 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
                >
                  <Icon name="coin" className="h-4 w-4" />
                  Make an offer
                </button>
                <button
                  onClick={() => setStage("sample")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-forest-950/15 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
                >
                  <Icon name="leaf" className="h-4 w-4" />
                  {stage === "sample" ? "Sample requested" : "Request a sample"}
                </button>
              </div>

              {stage === "offer" ? (
                <div className="mt-4 rounded-2xl border border-forest-950/8 bg-sand-50 p-4">
                  <label className="text-xs font-semibold text-ink-500" htmlFor="offer">
                    Your price per kg
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="offer"
                      inputMode="numeric"
                      placeholder={String(listing.pricePerKg)}
                      value={offer}
                      onChange={(e) => setOffer(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="h-10 flex-1 rounded-xl border border-forest-950/12 bg-white px-3 text-sm font-semibold text-ink-900 outline-none focus:border-forest-500"
                    />
                    <button
                      onClick={() => setStage("idle")}
                      className="inline-flex h-10 items-center rounded-full bg-forest-800 px-4 text-xs font-bold text-sand-50"
                    >
                      Send
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-400">
                    Offers below {Math.round(listing.pricePerKg * 0.9)} may be auto-declined by the seller.
                  </p>
                </div>
              ) : null}

              {stage !== "idle" ? (
                <p className="mt-3 rounded-xl bg-forest-50 px-3 py-2 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-600/15">
                  {stage === "escrow"
                    ? "Payment sits in escrow. The seller is notified and money releases only on proof-of-delivery."
                    : stage === "sample"
                      ? "The seller will courier a graded sample; freight is credited against your first order."
                      : "Escrow-secured orders include quality verification and a dispute window before release."}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-semibold text-ink-900">Chat with the seller</h2>
              <div className="mt-3 space-y-2.5">
                <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-sand-100 px-3.5 py-2 text-sm text-ink-700">
                  Do you have Grade A lots ready for pickup this week?
                </p>
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-forest-800 px-3.5 py-2 text-sm text-sand-50">
                  Yes — {listing.qtyT} t graded and cold-stored. Pooled pickup in {listing.deliveryWindow}.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  placeholder="Type a message…"
                  className="h-10 flex-1 rounded-full border border-forest-950/12 bg-sand-50 px-4 text-sm text-ink-900 outline-none focus:border-forest-500"
                />
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-sand-50">
                  <Icon name="arrowRight" className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-ink-400">
                In-app translation keeps both sides in their own language.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
