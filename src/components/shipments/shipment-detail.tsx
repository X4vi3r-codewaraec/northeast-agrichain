"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CROP_PERISHABILITY, shelfLifeIndex, shelfLifeMeta } from "@/lib/logistics";
import { ROUTE_HEALTH_META, shipmentTrack, trackPolylinePoints } from "@/lib/shipments";

export default function ShipmentDetail({ id }: { id: string }) {
  const track = useMemo(() => shipmentTrack(id), [id]);
  const [spoilage, setSpoilage] = useState(false);

  if (!track) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
          <Icon name="truck" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">Shipment not found</h1>
        <p className="mt-2 text-sm text-ink-500">This consignment is not in your tracker.</p>
        <Link
          href="/shipments"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50"
        >
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
          Back to shipments
        </Link>
      </div>
    );
  }

  const { shipment } = track;
  const index = shelfLifeIndex({
    perishability: CROP_PERISHABILITY[shipment.cropId] ?? 0.55,
    transitHours: shipment.etaMin / 60,
    ambientC: shipment.ambientC,
    coldChain: shipment.coldChain,
  });
  const sm = shelfLifeMeta(index);
  const rh = ROUTE_HEALTH_META[shipment.routeHealth];
  const tempSeries = track.ambientLog.map((a) => a.tempC);
  const tMin = Math.min(...tempSeries);
  const tMax = Math.max(...tempSeries);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/shipments"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-600"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
            Back to shipments
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="truck" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                {shipment.cropName} · {shipment.qtyT} t
              </h1>
              <p className="flex items-center gap-2 text-xs font-medium text-ink-400">
                <span className="font-mono">{shipment.id}</span>
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${rh.cls}`} />
                  {rh.label}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* Live map */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-900">Route &amp; live position</h2>
                <span className="text-xs font-semibold text-ink-500">
                  {shipment.origin} → {shipment.dest}
                </span>
              </div>
              <div className="mt-4">
                <svg viewBox="0 0 100 90" className="h-52 w-full rounded-2xl bg-forest-900">
                  <defs>
                    <pattern id="shipgrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M10 0H0V10" fill="none" stroke="#ffffff15" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100" height="90" fill="url(#shipgrid)" />
                  <polyline
                    points={trackPolylinePoints(track.polyline)}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="1.6"
                    strokeDasharray="4 2"
                  />
                  {track.polyline.map(([x, y], i) => (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={i === 0 || i === track.polyline.length - 1 ? 2.4 : 1.3}
                      fill={i === 0 ? "#4ade80" : i === track.polyline.length - 1 ? "#f87171" : "#facc15"}
                    />
                  ))}
                </svg>
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" /> {shipment.origin}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {shipment.dest} <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {track.narration.map((n, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-sand-50 p-3.5 text-sm text-ink-700 ring-1 ring-forest-950/6">
                    <Icon name="route" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ambient log */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Ambient &amp; cold-chain log
              </h2>
              <div className="mt-4 flex h-24 items-end gap-2">
                {track.ambientLog.map((a) => {
                  const h = ((a.tempC - tMin) / (tMax - tMin || 1)) * 80 + 12;
                  const hot = !shipment.coldChain && a.tempC > 27;
                  return (
                    <div key={a.t} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-ink-500">{a.tempC}°</span>
                      <div
                        className={`w-full rounded-t ${hot ? "bg-red-500/80" : shipment.coldChain ? "bg-sky-500/80" : "bg-gold-500/80"}`}
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[9px] text-ink-400">{a.t}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl bg-sand-50 p-3 text-center ring-1 ring-forest-950/6">
                  <p className="text-[10px] font-semibold text-ink-400">Min</p>
                  <p className="font-display text-base font-semibold text-ink-900">{tMin}°C</p>
                </div>
                <div className="rounded-2xl bg-sand-50 p-3 text-center ring-1 ring-forest-950/6">
                  <p className="text-[10px] font-semibold text-ink-400">Max</p>
                  <p className="font-display text-base font-semibold text-ink-900">{tMax}°C</p>
                </div>
                <div className="rounded-2xl bg-sand-50 p-3 text-center ring-1 ring-forest-950/6">
                  <p className="text-[10px] font-semibold text-ink-400">Humidity</p>
                  <p className="font-display text-base font-semibold text-ink-900">
                    {Math.round(track.ambientLog.reduce((s, a) => s + a.humidity, 0) / track.ambientLog.length)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            {/* Key metrics */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6">
                  <p className="text-[10px] font-semibold text-ink-400">ETA</p>
                  <p className="font-display text-lg font-semibold text-ink-900">
                    {shipment.etaMin === 0 ? "Arrived" : `${Math.floor(shipment.etaMin / 60)}h ${shipment.etaMin % 60}m`}
                  </p>
                </div>
                <div className="rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6">
                  <p className="text-[10px] font-semibold text-ink-400">Pooled</p>
                  <p className="font-display text-lg font-semibold text-ink-900">×{shipment.pooled}</p>
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-ink-400">Shelf-life on arrival (0–100)</p>
                  <p className="font-display text-lg font-semibold text-ink-900">{index}</p>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-forest-950/10">
                  <div className={`h-full rounded-full ${sm.cls}`} style={{ width: `${index}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-ink-500">{sm.label}</p>
              </div>
            </div>

            {/* Stops */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-semibold text-ink-900">Milestones</h2>
              <ol className="mt-3 space-y-3">
                {track.stops.map((s) => (
                  <li key={s.label} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        s.done
                          ? "bg-forest-600 text-white"
                          : s.current
                            ? "bg-gold-500 text-ink-900 ring-4 ring-gold-500/20"
                            : "bg-forest-950/8 text-ink-400"
                      }`}
                    >
                      {s.done ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : "•"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{s.label}</p>
                      <p className="text-xs text-ink-500">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Driver */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-semibold text-ink-900">Driver</h2>
              <p className="mt-2 text-sm font-bold text-ink-900">{shipment.driverName}</p>
              <p className="text-xs text-ink-500">{shipment.phone}</p>
              <p className="mt-1 text-xs text-ink-500">
                {shipment.transporter} · {shipment.vehicle}
              </p>
              <a
                href={`tel:${shipment.phone.replace(/\s/g, "")}`}
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50"
              >
                <Icon name="phone" className="h-4 w-4" />
                Call driver
              </a>
            </div>

            {/* PoD / spoilage */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-semibold text-ink-900">Delivery proof</h2>
              {track.pod ? (
                <p className="mt-2 rounded-xl bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800 ring-1 ring-forest-600/15">
                  Proof-of-delivery recorded. Escrow released to the seller.
                </p>
              ) : (
                <p className="mt-2 rounded-xl bg-sand-100 px-3 py-2 text-xs font-semibold text-ink-600">
                  Proof-of-delivery pending. Uploading a signed slip at the destination releases
                  escrow automatically.
                </p>
              )}
              <button
                onClick={() => setSpoilage((v) => !v)}
                className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition ${
                  spoilage
                    ? "bg-red-600 text-white"
                    : "border border-forest-950/15 text-forest-800 hover:bg-forest-50"
                }`}
              >
                <Icon name={spoilage ? "check" : "x"} className="h-4 w-4" />
                {spoilage ? "Spoilage reported ✓" : "Report spoilage"}
              </button>
              {spoilage ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 ring-1 ring-red-600/15">
                  A spoilage claim is opened against the cold-chain log. The insurer uses the sensor
                  series above — not a manual estimate.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
