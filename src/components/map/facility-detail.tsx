"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { CROPS } from "@/lib/data";
import { FACILITY_TYPE_LABEL, facilityById } from "@/lib/facilities";

export default function FacilityDetail({ id }: { id: string }) {
  const facility = useMemo(() => facilityById(id), [id]);
  const [qtyT, setQtyT] = useState(20);
  const [days, setDays] = useState(14);
  const [booked, setBooked] = useState(false);

  if (!facility) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
          <Icon name="building" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">Facility not found</h1>
        <p className="mt-2 text-sm text-ink-500">This storage node is not in the directory.</p>
        <Link
          href="/map"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50"
        >
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
          Back to map
        </Link>
      </div>
    );
  }

  const usedPct = Math.round(((facility.capacityT - facility.availableT) / facility.capacityT) * 100);
  const validQty = Math.min(facility.availableT, Math.max(1, qtyT));
  const cost = validQty * facility.rate * days;
  const crops = facility.crops
    .map((cid) => CROPS.find((c) => c.id === cid)?.name ?? cid)
    .join(", ");

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-600"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
            Back to storage map
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
                    <Icon name="building" className="h-6 w-6" />
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-semibold text-ink-900">{facility.name}</h1>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {facility.address} · {facility.district}, {facility.state}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-bold text-forest-800">
                  {FACILITY_TYPE_LABEL[facility.type]}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill>★ {facility.rating.toFixed(1)}</Pill>
                <Pill>{facility.tempC}</Pill>
                <Pill>₹{facility.rate}/t/day</Pill>
                {facility.solarBackup ? <Pill>Solar backup</Pill> : null}
                <Pill>{facility.hours}</Pill>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  <span>Capacity utilisation</span>
                  <span>
                    {facility.capacityT - facility.availableT}/{facility.capacityT} t used ({usedPct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-forest-950/8">
                  <div
                    className={`h-full rounded-full ${usedPct > 85 ? "bg-red-500" : usedPct > 60 ? "bg-gold-500" : "bg-forest-600"}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-forest-800">
                  {facility.availableT} t currently available to book
                </p>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Operator</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink-900">{facility.owner}</dd>
                </div>
                <div className="rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Crops served</dt>
                  <dd className="mt-1 text-sm font-semibold text-ink-900">{crops}</dd>
                </div>
              </dl>

              <p className="mt-4 text-[11px] text-ink-400">
                Live occupancy, temperature telemetry and PostGIS routing sync with the FastAPI
                facility service once deployed.
              </p>
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Getting there</h2>
              <div className="mt-3 flex h-40 items-center justify-center rounded-2xl bg-forest-900 text-forest-100/70">
                <div className="text-center">
                  <Icon name="mapPin" className="mx-auto h-7 w-7 text-gold-300" />
                  <p className="mt-2 text-xs font-semibold">
                    {facility.lat.toFixed(3)}°N, {facility.lon.toFixed(3)}°E
                  </p>
                  <p className="text-[11px]">Terrain-aware route drawn by the logistics engine</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking rail */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">Request storage</h2>
              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Quantity
                  <span className="font-display text-sm text-ink-900">{validQty} t</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, facility.availableT)}
                  step={1}
                  value={validQty}
                  onChange={(e) => setQtyT(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>
              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Duration
                  <span className="font-display text-sm text-ink-900">{days} days</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={90}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <dl className="mt-4 space-y-1.5 rounded-2xl bg-sand-50 p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">
                    {validQty} t × {days} d
                  </dt>
                  <dd className="font-semibold text-ink-900">₹{(validQty * days).toLocaleString("en-IN")} t-d</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Rate</dt>
                  <dd className="font-semibold text-ink-900">₹{facility.rate}/t/day</dd>
                </div>
                <div className="flex justify-between border-t border-forest-950/8 pt-1.5">
                  <dt className="font-bold text-ink-900">Estimated cost</dt>
                  <dd className="font-display text-lg font-semibold text-ink-900">
                    ₹{cost.toLocaleString("en-IN")}
                  </dd>
                </div>
              </dl>

              <button
                onClick={() => setBooked(true)}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest-800 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
              >
                <Icon name={booked ? "check" : "building"} className="h-4 w-4" />
                {booked ? "Booking requested ✓" : "Request booking"}
              </button>
              {booked ? (
                <p className="mt-3 rounded-xl bg-forest-50 px-3 py-2 text-[11px] font-semibold text-forest-800 ring-1 ring-forest-600/15">
                  The operator confirms within 24 h. Cold-chain setpoint and slot are locked once
                  accepted.
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-base font-semibold text-ink-900">Nearby alternatives</h2>
              <p className="mt-2 text-xs text-ink-500">
                If this node is full, the planner suggests the next best cold or dry store on your
                corridor with freight to match.
              </p>
              <Link
                href="/map"
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 px-4 text-sm font-bold text-forest-800 transition hover:bg-forest-50"
              >
                <Icon name="route" className="h-4 w-4" />
                Compare on the map
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
