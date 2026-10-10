"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import InteractiveMap from "@/components/map/interactive-map";
import { Pill } from "@/components/ui/primitives";
import { NER_STATES, CROPS } from "@/lib/data";
import { districtGeo } from "@/lib/geo";
import {
  FACILITIES,
  FACILITY_TYPE_LABEL,
  type Facility,
  type FacilityType,
} from "@/lib/facilities";
import {
  availabilityCurve,
  CROP_PERISHABILITY,
  routeEstimate,
  routeRiskNarration,
  shelfLifeIndex,
  shelfLifeMeta,
  type RouteEstimate,
} from "@/lib/logistics";

const TYPE_ICON: Record<FacilityType, IconName> = {
  cold: "cloud",
  godown: "building",
  ripening: "sun",
  curing: "leaf",
};

const TYPE_DOT: Record<FacilityType, string> = {
  cold: "#1e6bdb",
  godown: "#8a5a2b",
  ripening: "#f2a93b",
  curing: "#2e6b3e",
};

function FacilityPanel({
  facility,
  route,
  cropId,
  onBook,
  booked,
}: {
  facility: Facility;
  route: RouteEstimate;
  cropId: string;
  onBook: () => void;
  booked: boolean;
}) {
  const index = shelfLifeIndex({
    perishability: CROP_PERISHABILITY[cropId] ?? 0.55,
    transitHours: route.etaMin / 60,
    ambientC: 27,
    coldChain: facility.type === "cold",
  });
  const sm = shelfLifeMeta(index);
  const availability = availabilityCurve(facility.id, facility.availableT);
  const perception = CROPS.find((c) => c.id === cropId);
  const risk = routeRiskNarration(route, facility.district === "East Sikkim" || route.climbM > 300, 28);
  const maxAvail = Math.max(...availability, 1);
  const profilePts = useMemo(() => {
    const origin = districtGeo("Kamrup Metro");
    if (!origin) return [];
    const base = origin.elevation;
    const diff = facility.lat > 26.5 ? facility.lat > 27.2 ? 900 : 400 : 100;
    return [0, 1, 2, 3, 4].map((i, idx) => ({
      i: idx,
      elev: base + Math.round(diff * (idx / 4) + Math.sin(idx * 2.1) * 60),
      base,
    }));
  }, [facility]);

  const maxElev = Math.max(...profilePts.map((p) => p.elev), 400) + 80;

  return (
    <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_DOT[facility.type] }} />
            {FACILITY_TYPE_LABEL[facility.type]}
          </span>
          <h3 className="mt-1.5 font-display text-xl font-semibold text-ink-900">{facility.name}</h3>
          <p className="mt-1 text-sm text-ink-500">{facility.address}</p>
          <Link
            href={`/map/facility/${facility.id}`}
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition hover:text-forest-600"
          >
            View full facility profile
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
          <Icon name={TYPE_ICON[facility.type]} className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-sand-50 p-3">
          <p className="text-[11px] font-medium text-ink-400">Free capacity</p>
          <p className="font-display text-lg font-semibold text-ink-900">{facility.availableT} t</p>
          <p className="text-[11px] text-ink-400">of {facility.capacityT} t</p>
        </div>
        <div className="rounded-2xl bg-sand-50 p-3">
          <p className="text-[11px] font-medium text-ink-400">Set-point</p>
          <p className="font-display text-lg font-semibold text-ink-900">{facility.tempC.split(" ")[0]}</p>
          <p className="text-[11px] text-ink-400">{facility.tempC.split(" ").slice(1).join(" ")}</p>
        </div>
        <div className="rounded-2xl bg-sand-50 p-3">
          <p className="text-[11px] font-medium text-ink-400">Distance / ETA</p>
          <p className="font-display text-lg font-semibold text-ink-900">{route.km} km</p>
          <p className="text-[11px] text-ink-400">~{route.etaMin} min · +{route.climbM} m</p>
        </div>
        <div className="rounded-2xl bg-sand-50 p-3">
          <p className="text-[11px] font-medium text-ink-400">Storage rate</p>
          <p className="font-display text-lg font-semibold text-ink-900">₹{facility.rate}</p>
          <p className="text-[11px] text-ink-400">/ t / day</p>
        </div>
      </div>

      {/* Elevation profile */}
      <div className="mt-5 rounded-2xl border border-forest-950/6 bg-sand-50/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Elevation profile · origin → facility
          </p>
          <span className="text-xs font-semibold text-ink-600">
            {profilePts[0]?.elev ?? 0} m → {profilePts[profilePts.length - 1]?.elev ?? 0} m
          </span>
        </div>
        <svg viewBox="0 0 320 90" className="mt-2 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="el-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e6b3e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2e6b3e" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,85 ${profilePts.map((p) => `${(p.i / 4) * 320},${85 - ((p.elev - 200) / maxElev) * 70}`).join(" ")} 320,85`}
            fill="url(#el-grad)"
          />
          <polyline
            points={profilePts.map((p) => `${(p.i / 4) * 320},${85 - ((p.elev - 200) / maxElev) * 70}`).join(" ")}
            fill="none"
            stroke="#2e6b3e"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {profilePts.map((p) => (
            <circle key={p.i} cx={(p.i / 4) * 320} cy={85 - ((p.elev - 200) / maxElev) * 70} r="2.6" fill="#f2c266" stroke="#0a1e12" strokeWidth="1" />
          ))}
        </svg>
      </div>

      {/* Availability */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Availability · next 7 days (tonnes)
          </p>
          <p className="text-xs font-semibold text-ink-600">today: {availability[0]} t</p>
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          {availability.map((t, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${t >= 200 ? "bg-forest-600" : t >= 100 ? "bg-gold-500" : "bg-red-500"}`}
                style={{ height: `${(t / maxAvail) * 64}px` }}
              />
              <span className="text-[10px] text-ink-400">
                {["M", "T", "W", "T", "F", "S", "S"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shelf-life + risk narration */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-forest-50 p-4 ring-1 ring-forest-600/10">
          <div className="h-10 w-10 shrink-0 rounded-full" style={{ background: sm.cls }} />
          <div>
            <p className="text-sm font-bold text-ink-900">
              {perception?.name ?? "Crop"} shelf-life on arrival: {index}/100
            </p>
            <p className="text-xs text-ink-600">{sm.label}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-sand-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Route risk · gpt-4o mini narration
          </p>
          {risk.map((r, i) => (
            <p key={i} className="mt-1.5 text-sm leading-relaxed text-ink-700">
              {r}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {booked ? (
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-600 px-5 text-sm font-bold text-sand-50">
            <Icon name="check" className="h-4 w-4" />
            Booking requested · escrow hold on payment
          </span>
        ) : (
          <button
            onClick={onBook}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50 shadow-sm transition hover:bg-forest-700"
          >
            <Icon name="truck" className="h-4 w-4" />
            Request booking
          </button>
        )}
        <span className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-950/15 px-5 text-sm font-bold text-forest-800">
          <Icon name="clock" className="h-4 w-4" />
          {facility.hours}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-ink-400">
        {facility.owner} · ★ {facility.rating.toFixed(1)} · {facility.solarBackup ? "Solar backup ✔" : "Grid power"}
      </p>
    </div>
  );
}

export default function LogisticsMap() {
  const [origin, setOrigin] = useState("Kamrup Metro");
  const [cropId, setCropId] = useState("king-chilli");
  const [typeFilter, setTypeFilter] = useState<"all" | FacilityType>("all");
  const [minAvail, setMinAvail] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const originGeo = districtGeo(origin);

  const facilities = useMemo(() => {
    if (!originGeo) return [];
    return FACILITIES.map((f) => ({
      facility: f,
      route: routeEstimate(originGeo, { lat: f.lat, lon: f.lon, elevation: f.lat > 26.4 ? 900 : 150, label: f.name }),
    }))
      .filter((x) => (typeFilter === "all" ? true : x.facility.type === typeFilter))
      .filter((x) => x.facility.availableT >= minAvail)
      .sort((a, b) => a.route.etaMin - b.route.etaMin);
  }, [originGeo, typeFilter, minAvail]);

  const selected = selectedId ? FACILITIES.find((f) => f.id === selectedId) : facilities[0]?.facility;
  const selectedRoute = selected
    ? routeEstimate(originGeo ?? { lat: 26.14, lon: 91.73, elevation: 55, label: "" }, {
        lat: selected.lat,
        lon: selected.lon,
        elevation: selected.lat > 26.4 ? 900 : 150,
        label: selected.name,
      })
    : null;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="route" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Storage & Terrain Logistics
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Cold chain, godowns & safe routes across the NER
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {/* Controls + list */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wide text-ink-400">
                Send from
              </label>
              <select
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setBooked(false);
                  setSelectedId(null);
                }}
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

              <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink-400">
                Load (crop)
              </label>
              <select
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-forest-950/15 bg-sand-50 px-4 text-sm font-semibold text-ink-900 outline-none transition focus:border-forest-600/50 focus:ring-2 focus:ring-forest-600/20"
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.local}
                  </option>
                ))}
              </select>

              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-400">Facility type</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["all", "cold", "godown", "ripening", "curing"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
                      typeFilter === t
                        ? "bg-forest-800 text-sand-50"
                        : "border border-forest-950/12 bg-sand-50 text-ink-600 hover:border-forest-600/30"
                    }`}
                  >
                    {t === "all" ? "All" : FACILITY_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
                  <span>Min free capacity</span>
                  <span>{minAvail}+ t</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={600}
                  step={50}
                  value={minAvail}
                  onChange={(e) => setMinAvail(Number(e.target.value))}
                  className="mt-2 w-full accent-forest-700"
                />
              </div>
            </div>

            <div className="space-y-3">
              {facilities.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-forest-950/15 bg-white p-8 text-center">
                  <Icon name="route" className="mx-auto h-7 w-7 text-ink-400" />
                  <p className="mt-2 text-sm font-semibold text-ink-600">
                    No facilities match those filters.
                  </p>
                </div>
              ) : (
                facilities.map(({ facility, route }) => (
                  <button
                    key={facility.id}
                    onClick={() => {
                      setSelectedId(facility.id);
                      setBooked(false);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected?.id === facility.id
                        ? "border-forest-600/40 bg-forest-50"
                        : "border-forest-950/8 bg-white hover:border-forest-600/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                          style={{ background: TYPE_DOT[facility.type] }}
                        >
                          <Icon name={TYPE_ICON[facility.type]} className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-ink-900">{facility.name}</p>
                          <p className="text-[11px] text-ink-500">
                            {facility.district} · {FACILITY_TYPE_LABEL[facility.type]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-forest-700">{route.km} km</p>
                        <p className="text-[11px] text-ink-500">~{route.etaMin} min</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-ink-500">
                      <span className={facility.availableT >= 100 ? "text-forest-700" : "text-red-600"}>
                        {facility.availableT} t free
                      </span>
                      <span>₹{facility.rate}/t/day</span>
                      <span>★ {facility.rating}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Map + detail */}
          <div className="space-y-5">
            {/* Interactive map */}
            <div className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-forest-950/6 px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                  NER facility map · OpenStreetMap
                </p>
                <Pill>
                  {facilities.length} shown of {FACILITIES.length}
                </Pill>
              </div>
              <InteractiveMap
                className="relative z-0 h-[420px] w-full sm:h-[500px]"
                origin={originGeo}
                facilities={facilities.map((x) => x.facility)}
                selectedId={selected?.id ?? null}
                onSelect={(id) => {
                  setSelectedId(id);
                  setBooked(false);
                }}
                typeColor={TYPE_DOT}
              />
              <div className="flex flex-wrap gap-3 border-t border-forest-950/6 px-5 py-3">
                {(["cold", "godown", "ripening", "curing"] as const).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_DOT[t] }} />
                    {FACILITY_TYPE_LABEL[t]}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-forest-700" />
                  Origin
                </span>
              </div>
            </div>

            {selected && selectedRoute ? (
              <FacilityPanel
                key={selected.id}
                facility={selected}
                route={selectedRoute}
                cropId={cropId}
                booked={booked}
                onBook={() => setBooked(true)}
              />
            ) : null}

            <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                  <Icon name="truck" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">Pool your loads</h3>
                  <p className="text-sm text-forest-100/75">
                    Small lots on the same route split the freight bill.
                  </p>
                </div>
              </div>
              <Link
                href="/shipments"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                Open shipments & pooling
                <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}