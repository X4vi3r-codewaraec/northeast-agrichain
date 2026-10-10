"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import { NER_STATES } from "@/lib/data";
import { districtGeo } from "@/lib/geo";
import { routeEstimate } from "@/lib/logistics";
import { FACILITIES, FACILITY_TYPE_LABEL } from "@/lib/facilities";
import { LISTINGS, GRADE_LABEL } from "@/lib/market";
import { suggestPool, type PoolSuggestion } from "@/lib/shipments";

const DEPARTURES = ["Day +1 · morning", "Day +1 · evening", "Day +2 · morning"];

const STEPS = ["Produce", "Route", "Pooling", "Confirm"];

function hashBooking(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `SH-NER-${String(Math.abs(h) % 9000 + 1000)}`;
}

function StepDots({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of 4`}>
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          {i > 0 ? <span className="h-px w-6 bg-forest-950/15 sm:w-10" /> : null}
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              i < step
                ? "bg-forest-100 text-forest-700"
                : i === step
                  ? "bg-forest-800 text-sand-50"
                  : "bg-sand-100 text-ink-400"
            }`}
          >
            <span>{i + 1}</span>
            <span className="hidden sm:inline">{label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function NewShipmentWizard() {
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState(LISTINGS[0].id);
  const [qtyT, setQtyT] = useState(1.0);
  const [origin, setOrigin] = useState("Jorhat");
  const [facilityId, setFacilityId] = useState(FACILITIES[2].id);
  const [departure, setDeparture] = useState(DEPARTURES[0]);
  const [joinPool, setJoinPool] = useState(true);
  const [created, setCreated] = useState<string | null>(null);

  const listing = LISTINGS.find((l) => l.id === listingId) ?? LISTINGS[0];
  const facility = FACILITIES.find((f) => f.id === facilityId) ?? FACILITIES[0];
  const cold = facility.type === "cold";
  const cropServed = facility.crops.includes(listing.cropId);

  const pool = useMemo<PoolSuggestion | null>(() => {
    if (!districtGeo(origin) || !districtGeo(facility.district)) return null;
    return suggestPool({ origin, dest: facility.district, qtyT, cold });
  }, [origin, facility, qtyT, cold]);

  const route = useMemo(() => {
    const a = districtGeo(origin);
    const b = districtGeo(facility.district);
    return a && b ? routeEstimate(a, b) : null;
  }, [origin, facility]);

  const freight = pool
    ? joinPool
      ? pool.pooledFreight
      : pool.soloFreight
    : 0;
  const bookingRef = hashBooking(`${listing.cropId}|${origin}|${facility.district}|${qtyT}`);

  const canNext =
    step === 0 || step === 1 || step === 2 ? true : created !== null ? false : true;
  const canPrev = step > 0 && !created;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
                <Icon name="truck" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                  New shipment
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Book a load · join a pool · escrow hold on payment
                </p>
              </div>
            </div>
            <Link
              href="/shipments"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 bg-white px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
            >
              <Icon name="route" className="h-4 w-4" />
              Back to board
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <StepDots step={step} />

        {created ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
            <div className="bg-forest-900 p-8 text-center text-sand-50 sm:p-10">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                <Icon name="check" className="h-8 w-8" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold">Booking confirmed</h2>
              <p className="mt-2 text-sm text-forest-100/80">
                {bookingRef} · {listing.cropName} {qtyT}t · {origin} → {facility.name}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold ring-1 ring-white/15">
                <Icon name="shield" className="h-3.5 w-3.5 text-gold-300" />
                ₹{freight.toLocaleString("en-IN")} held in escrow until delivery proof
              </p>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-sand-50 p-4 text-sm">
                <p className="font-bold text-ink-900">{joinPool ? "Pooled load" : "Solo load"}</p>
                <p className="mt-1 text-ink-500">
                  {pool?.vehicleHint} — {pool?.matchCount ?? 0} partner lot
                  {(pool?.matchCount ?? 0) === 1 ? "" : "s"} on this corridor
                </p>
              </div>
              <div className="rounded-2xl bg-sand-50 p-4 text-sm">
                <p className="font-bold text-ink-900">Departure</p>
                <p className="mt-1 text-ink-500">{departure} · ETA ~{route?.etaHours ?? "—"} h</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-forest-950/8 p-6">
              <Link
                href="/shipments"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-5 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
              >
                <Icon name="route" className="h-4 w-4" />
                Track on board
              </Link>
              <button
                onClick={() => setCreated(null)}
                className="inline-flex h-11 items-center rounded-full border border-forest-950/15 px-5 text-sm font-bold text-forest-800 transition hover:bg-forest-50"
              >
                New shipment
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
            {/* STEP 1 — produce */}
            {step === 0 ? (
              <div className="p-6 sm:p-8">
                <Eyebrow>Step 1 · Produce</Eyebrow>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
                  What are you shipping?
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {LISTINGS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setListingId(l.id);
                        setQtyT(Math.min(1, l.qtyT));
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        listingId === l.id
                          ? "border-forest-600/40 bg-forest-50"
                          : "border-forest-950/8 bg-sand-50/60 hover:border-forest-600/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink-900">
                          {l.cropName} <span className="font-medium text-ink-400">· {l.local}</span>
                        </p>
                        <Pill>{GRADE_LABEL[l.grade]}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        {l.qtyT} t available · {l.organic ? "organic · " : ""}
                        {l.giCert ? "GI · " : ""}
                        {l.district}, {l.state}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm font-semibold text-ink-700">
                    <span>Quantity</span>
                    <span>
                      {qtyT.toFixed(1)} t{" "}
                      <span className="font-medium text-ink-400">(max {listing.qtyT} t)</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={listing.qtyT}
                    step={0.1}
                    value={qtyT}
                    onChange={(e) => setQtyT(Number(e.target.value))}
                    className="mt-2 w-full accent-forest-700"
                  />
                </div>
              </div>
            ) : null}

            {/* STEP 2 — route */}
            {step === 1 ? (
              <div className="p-6 sm:p-8">
                <Eyebrow>Step 2 · Route</Eyebrow>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
                  Origin, destination, departure
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink-400">
                      Origin district
                    </label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-forest-950/15 bg-sand-50 px-4 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50"
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
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink-400">
                      Destination facility
                    </label>
                    <select
                      value={facilityId}
                      onChange={(e) => setFacilityId(e.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-forest-950/15 bg-sand-50 px-4 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50"
                    >
                      {FACILITIES.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} · {f.district} ({FACILITY_TYPE_LABEL[f.type]})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {!cropServed ? (
                  <p className="mt-3 flex items-center gap-2 rounded-2xl bg-gold-100 px-4 py-2.5 text-xs font-bold text-gold-900">
                    <Icon name="sparkles" className="h-4 w-4" />
                    This facility doesn&apos;t list {listing.cropName} — pick another or continue; the
                    pool may still route through it.
                  </p>
                ) : null}
                {route ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>~{route.km} km road</Pill>
                    <Pill>ETA ~{route.etaHours} h</Pill>
                    <Pill>{route.climbM} m climb</Pill>
                    <Pill>{cold ? "Cold chain" : "Ambient"}</Pill>
                  </div>
                ) : null}
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    Preferred departure
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DEPARTURES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDeparture(d)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                          departure === d
                            ? "bg-forest-800 text-sand-50"
                            : "border border-forest-950/12 bg-sand-50 text-ink-600 hover:border-forest-600/30"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* STEP 3 — pooling */}
            {step === 2 ? (
              <div className="p-6 sm:p-8">
                <Eyebrow>Step 3 · Pooling</Eyebrow>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
                  Share the rig, split the freight
                </h2>
                {pool ? (
                  <>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-sand-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                          Your load
                        </p>
                        <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                          {qtyT.toFixed(1)} t
                        </p>
                      </div>
                      <div className="rounded-2xl bg-sand-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                          Pooled with
                        </p>
                        <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                          {pool.matchCount} farmers · {pool.combinedQtyT} t
                        </p>
                      </div>
                      <div className="rounded-2xl bg-forest-50 p-4 ring-1 ring-forest-600/15">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                          Freight saving
                        </p>
                        <p className="mt-1 font-display text-xl font-semibold text-forest-700">
                          {pool.savingsPct}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-forest-950/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-sand-50 text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">
                            <th className="px-4 py-2.5">Farmer</th>
                            <th className="px-4 py-2.5">District</th>
                            <th className="px-4 py-2.5 text-right">Tonnage</th>
                            <th className="px-4 py-2.5">Pickup</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-forest-950/8 bg-forest-50/60">
                            <td className="px-4 py-2.5 font-bold text-ink-900">You</td>
                            <td className="px-4 py-2.5 text-ink-600">{origin}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-ink-900">
                              {qtyT.toFixed(1)} t
                            </td>
                            <td className="px-4 py-2.5 text-ink-600">day +0</td>
                          </tr>
                          {pool.partners.map((p) => (
                            <tr key={`${p.farmer}-${p.district}`} className="border-t border-forest-950/6">
                              <td className="px-4 py-2.5 font-semibold text-ink-800">{p.farmer}</td>
                              <td className="px-4 py-2.5 text-ink-600">{p.district}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-ink-800">
                                {p.qtyT} t
                              </td>
                              <td className="px-4 py-2.5 text-ink-600">{p.pickup}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                          {pool.vehicleHint}
                          <Pill>{pool.routeKm} km</Pill>
                        </div>
                        <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-500">
                          {pool.terrainNote}
                        </p>
                      </div>
                      <button
                        onClick={() => setJoinPool((v) => !v)}
                        className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                          joinPool
                            ? "bg-forest-800 text-sand-50"
                            : "border border-forest-950/15 bg-white text-ink-700"
                        }`}
                      >
                        <Icon name={joinPool ? "check" : "truck"} className="h-4 w-4" />
                        {joinPool ? "In pool — sharing rig" : "Solo load instead"}
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-sand-50 p-4 text-sm">
                      <span className="font-semibold text-ink-700">
                        Solo: <span className="font-display font-semibold text-ink-900">₹{pool.soloFreight.toLocaleString("en-IN")}</span>
                      </span>
                      <span className="font-semibold text-forest-700">
                        Pooled share:{" "}
                        <span className="font-display font-semibold">₹{pool.pooledFreight.toLocaleString("en-IN")}</span>
                      </span>
                      <span className="text-xs font-bold text-gold-700">
                        save {pool.savingsPct}% · {pool.matchCount} neighbour
                        {pool.matchCount === 1 ? "" : "s"} online this week
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-5 rounded-2xl bg-sand-50 p-4 text-sm text-ink-500">
                    Pick an origin and destination to see live pool suggestions.
                  </p>
                )}
              </div>
            ) : null}

            {/* STEP 4 — confirm */}
            {step === 3 ? (
              <div className="p-6 sm:p-8">
                <Eyebrow>Step 4 · Confirm</Eyebrow>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
                  Booking review
                </h2>
                <div className="mt-5 overflow-hidden rounded-2xl border border-forest-950/10">
                  <div className="grid gap-px bg-forest-950/8 sm:grid-cols-2">
                    {[
                      ["Produce", `${listing.cropName} · ${GRADE_LABEL[listing.grade]}${listing.organic ? " · organic" : ""}`],
                      ["Quantity", `${qtyT.toFixed(1)} t`],
                      ["Leg", `${origin} → ${facility.district}`],
                      ["Destination", facility.name],
                      ["Departure", departure],
                      ["Vehicle", `${pool?.vehicleHint ?? "—"}${cold ? " · cold chain" : ""}`],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{k}</p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-forest-50 p-5 ring-1 ring-forest-600/15 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-500">
                      Estimated freight {joinPool ? "(pooled share)" : "(solo)"}
                    </p>
                    <p className="mt-1 font-display text-3xl font-semibold text-forest-800">
                      ₹{freight.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {joinPool && pool ? (
                    <p className="text-xs font-bold text-forest-700">
                      You save ₹{(pool.soloFreight - pool.pooledFreight).toLocaleString("en-IN")}{" "}
                      vs a solo rig
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-sand-50 p-4 text-xs leading-relaxed text-ink-600">
                  <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                  <span>
                    Payment for freight goes into an <strong className="text-ink-900">escrow hold</strong>{" "}
                    and releases to the transporter on proof of delivery. This demo simulates the
                    state machine; production escrow rails are a documented v2 item.
                  </span>
                </div>
              </div>
            ) : null}

            {/* Nav */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-forest-950/8 bg-sand-50/60 p-4 sm:p-5">
              <button
                onClick={() => (canPrev ? setStep((s) => s - 1) : undefined)}
                disabled={!canPrev}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                  canPrev
                    ? "border border-forest-950/15 bg-white text-forest-800 hover:bg-forest-50"
                    : "cursor-not-allowed border border-forest-950/8 bg-sand-100 text-ink-400"
                }`}
              >
                <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                Back
              </button>
              {step < 3 ? (
                <button
                  onClick={() => (canNext ? setStep((s) => s + 1) : undefined)}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
                >
                  Continue
                  <Icon name="arrowRight" className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCreated(bookingRef)}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-6 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
                >
                  <Icon name="shield" className="h-4 w-4" />
                  Confirm & hold escrow
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}