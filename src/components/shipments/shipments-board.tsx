"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { CROP_PERISHABILITY, shelfLifeIndex, shelfLifeMeta } from "@/lib/logistics";
import {
  DEMO_SHIPMENTS,
  ROUTE_HEALTH_META,
  STATUS_ORDER,
  STATUS_LABEL,
  type DemoShipment,
  type ShipmentStatus,
} from "@/lib/shipments";

const STATUS_DOT: Record<ShipmentStatus, string> = {
  booked: "bg-ink-400",
  picked: "bg-gold-500",
  "in-transit": "bg-forest-600",
  delivered: "bg-forest-500",
};

export function shelfLifeFor(s: DemoShipment): number {
  return shelfLifeIndex({
    perishability: CROP_PERISHABILITY[s.cropId] ?? 0.55,
    transitHours: s.etaMin / 60,
    ambientC: s.ambientC,
    coldChain: s.coldChain,
  });
}

function StatusTimeline({ status }: { status: ShipmentStatus }) {
  const activeIdx = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center">
      {STATUS_ORDER.map((st, i) => (
        <div key={st} className={`flex items-center ${i < STATUS_ORDER.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                i <= activeIdx ? `${STATUS_DOT[st]} text-white` : "bg-forest-950/8 text-ink-400"
              }`}
            >
              {i < activeIdx ? <Icon name="check" className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            <span className="mt-1.5 hidden text-[10px] font-semibold text-ink-500 sm:block">
              {STATUS_LABEL[st]}
            </span>
          </div>
          {i < STATUS_ORDER.length - 1 ? (
            <div
              className={`mx-1 mb-5 h-0.5 flex-1 sm:mb-4 ${
                i < activeIdx ? "bg-forest-500" : "bg-forest-950/10"
              }`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ShipmentCard({
  s,
  onDetail,
  expanded,
}: {
  s: DemoShipment;
  onDetail: () => void;
  expanded: boolean;
}) {
  const index = useMemo(() => shelfLifeFor(s), [s]);
  const sm = shelfLifeMeta(index);
  const rh = ROUTE_HEALTH_META[s.routeHealth];

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
        expanded ? "border-forest-600/35" : "border-forest-950/8"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_DOT[s.status]} text-white`}
          >
            {s.status === "in-transit" ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : null}
            {STATUS_LABEL[s.status]}
          </span>
          <span className="font-mono text-xs font-bold text-ink-500">{s.id}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "inherit" }}>
            <span className={`h-2.5 w-2.5 rounded-full ${rh.cls}`} />
            {rh.label}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
              <Icon name="leaf" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">
                {s.cropName} · {s.qtyT} t
              </p>
              <p className="text-sm text-ink-500">
                {s.origin} <Icon name="arrowRight" className="inline h-3.5 w-3.5" /> {s.dest}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest-50 px-3.5 text-xs font-bold text-forest-800 ring-1 ring-forest-600/10">
              <Icon name="users" className="h-3.5 w-3.5" />
              Pooled ×{s.pooled}
            </span>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand-100 px-3.5 text-xs font-bold text-ink-700">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {s.etaMin === 0 ? "Arrived" : `ETA ~${Math.floor(s.etaMin / 60)}h ${s.etaMin % 60}m`}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <StatusTimeline status={s.status} />
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-2xl bg-sand-50 p-3.5">
            <p className="text-[11px] font-medium text-ink-400">Shelf-life on arrival (0–100)</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-forest-950/10">
                <div className={`h-full rounded-full ${sm.cls}`} style={{ width: `${index}%` }} />
              </div>
              <span className="font-display text-lg font-semibold text-ink-900">{index}</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-ink-500">{sm.label}</p>
          </div>
          <div className="rounded-2xl bg-sand-50 p-3.5">
            <p className="text-[11px] font-medium text-ink-400">Cold chain</p>
            <p className="mt-1 text-sm font-bold text-ink-900">
              {s.coldChain ? "Refrigerated ✔" : "Ambient"}
              <span className="ml-2 font-medium text-ink-500">~{s.ambientC} °C</span>
            </p>
            <p className="mt-1 text-[11px] text-ink-500">
              {s.transporter} · {s.vehicle}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={onDetail}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
          >
            <Icon name={expanded ? "chevronDown" : "route"} className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Hide tracking" : "Tracking & driver"}
          </button>
          <Link
            href={`/shipments/${s.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
          >
            <Icon name="route" className="h-4 w-4" />
            Open full tracking
          </Link>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-forest-950/6 bg-sand-50/60 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-forest-950/6 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Driver</p>
              <p className="mt-1 text-sm font-bold text-ink-900">{s.driverName}</p>
              <p className="text-sm text-ink-500">{s.phone} · {s.transporter}</p>
            </div>
            <div className="rounded-2xl border border-forest-950/6 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Load pooling</p>
              <p className="mt-1 text-sm text-ink-700">
                {s.pooled === 1
                  ? "Solo load — the full freight bill is on this shipment."
                  : `${s.pooled} farmers share this vehicle — freight per kg splits automatically.`}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-ink-400">
            Route heat, sensor logs and proof-of-delivery land here with the FastAPI tracker. Numbers above are code-computed, never model-generated.
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function ShipmentsBoard() {
  const [openId, setOpenId] = useState<string | null>("SH-NER-4821");
  const orders = useMemo(() => {
    const prio: Record<ShipmentStatus, number> = { booked: 0, picked: 1, "in-transit": 2, delivered: 3 };
    return [...DEMO_SHIPMENTS].sort((a, b) => prio[a.status] - prio[b.status]);
  }, []);
  const active = orders.filter((s) => s.status !== "delivered").length;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
                <Icon name="truck" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                  Shipments & Pooling
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  {active} active consignment{active === 1 ? "" : "s"} · book · track · split freight
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/map"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 bg-white px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
              >
                <Icon name="route" className="h-4 w-4" />
                Find storage
              </Link>
              <Link
                href="/shipments/new"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-bold text-sand-50 shadow-sm transition hover:bg-forest-700"
              >
                <Icon name="coin" className="h-4 w-4" />
                New shipment
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {orders.map((s) => (
              <ShipmentCard
                key={s.id}
                s={s}
                expanded={openId === s.id}
                onDetail={() => setOpenId(openId === s.id ? null : s.id)}
              />
            ))}
            <div className="rounded-3xl border border-dashed border-forest-950/15 bg-white/60 p-6 text-center">
              <Icon name="truck" className="mx-auto h-7 w-7 text-forest-600/50" />
              <p className="mt-2 text-sm font-semibold text-ink-600">
                Pooling &amp; booking run on the deterministic demo engine — live
                tracking arrives with the FastAPI booking service.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
              <h2 className="font-display text-lg font-semibold">How pooling works</h2>
              <ol className="mt-4 space-y-3 text-sm text-forest-100/85">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-bold text-gold-300">1</span>
                  <span>Enter your load, origin and preferred date.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-bold text-gold-300">2</span>
                  <span>The router finds farmers sharing your corridor that week.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-bold text-gold-300">3</span>
                  <span>Freight per kg drops with every pallet added — the split is automatic and escrow-secured.</span>
                </li>
              </ol>
              <div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-xs text-forest-100/70">
                  Example: Guwahati line today —{" "}
                  <strong className="text-sand-50">3 farmers, freight split 42% cheaper</strong>{" "}
                  than hauling alone.
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">Shelf-life legend</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-600">
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-forest-600" /> 80+ · full market window</li>
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-gold-500" /> 60–79 · sell within 2 weeks</li>
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500" /> 40–59 · prioritise cold chain</li>
                <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" /> &lt;40 · move immediately</li>
              </ul>
              <p className="mt-3 text-[11px] text-ink-400">
                Index = f(perishability, transit hours, ambient temperature) — computed, never AI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}