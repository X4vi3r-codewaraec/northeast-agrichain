"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import {
  AUDIT_LOG,
  VERIFICATION_QUEUE,
  diseaseSurveillance,
  heatMeta,
  stateHeat,
} from "@/lib/admin";

const TREND_META: Record<"up" | "flat" | "down", { label: string; cls: string }> = {
  up: { label: "▲ rising", cls: "text-red-600" },
  flat: { label: "→ steady", cls: "text-ink-500" },
  down: { label: "▼ easing", cls: "text-forest-700" },
};

export default function AdminDashboard() {
  const heat = useMemo(() => stateHeat(), []);
  const surveillance = useMemo(() => diseaseSurveillance(), []);
  const [verified, setVerified] = useState<string[]>([]);

  const totalDistricts = 26;
  const highAlert = heat.filter((h) => h.pestIndex >= 70).length;
  const floodClusters = heat.reduce((s, h) => s + h.floodClusters, 0);
  const avgStorage = Math.round(heat.reduce((s, h) => s + h.storageUtilPct, 0) / heat.length);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="users" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Government &amp; Extension Console
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Regional surveillance · alerts · verification · audit
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Districts tracked", value: String(totalDistricts), sub: "across 8 states", icon: "mapPin" as const },
            { label: "High pest alert", value: String(highAlert), sub: "districts ≥ 70 index", icon: "scanPlus" as const },
            { label: "Flood clusters", value: String(floodClusters), sub: "river-adjacent blocks", icon: "drop" as const },
            { label: "Avg storage use", value: `${avgStorage}%`, sub: "NER-wide utilisation", icon: "building" as const },
          ].map((k) => (
            <div key={k.label} className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                <Icon name={k.icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 font-display text-3xl font-semibold text-ink-900">{k.value}</p>
              <p className="text-sm font-semibold text-ink-700">{k.label}</p>
              <p className="text-xs text-ink-400">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {/* State heat */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-ink-900">State heat map</h2>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-500">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-forest-600" /> Calm</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> Elevated</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Watch</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" /> High</span>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-ink-400">
                      <th className="py-2">State</th>
                      <th className="py-2">Pest index</th>
                      <th className="py-2">Flood clusters</th>
                      <th className="py-2">Price anomaly</th>
                      <th className="py-2">Storage use</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-950/6">
                    {heat.map((h) => {
                      const meta = heatMeta(h.pestIndex);
                      return (
                        <tr key={h.id}>
                          <td className="py-2.5 font-semibold text-ink-900">{h.name}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" >
                                <span className={`block h-2.5 w-2.5 rounded-full ${meta.cls}`} />
                              </span>
                              <span className="font-display font-semibold text-ink-900">{h.pestIndex}</span>
                              <span className="text-[11px] font-semibold text-ink-400">{meta.label}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-ink-600">{h.floodClusters}</td>
                          <td className={`py-2.5 font-semibold ${h.priceAnomalyPct >= 0 ? "text-red-600" : "text-forest-700"}`}>
                            {h.priceAnomalyPct >= 0 ? "+" : ""}
                            {h.priceAnomalyPct}%
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-forest-950/8">
                                <div className="h-full rounded-full bg-forest-600" style={{ width: `${h.storageUtilPct}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-ink-600">{h.storageUtilPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Surveillance */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Disease surveillance · this week
              </h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {surveillance.map((d) => {
                  const t = TREND_META[d.trend];
                  return (
                    <div
                      key={d.district + d.issue}
                      className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3.5 ring-1 ring-forest-950/6"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                        <Icon name="scanPlus" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-900">{d.issue}</p>
                        <p className="truncate text-xs text-ink-500">
                          {d.district}, {d.state}
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-display text-lg font-semibold text-ink-900">{d.cases}</p>
                        <p className={`text-[10px] font-bold ${t.cls}`}>{t.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Verification queue */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-900">Verification queue</h2>
                <Pill>{VERIFICATION_QUEUE.length - verified.length} pending</Pill>
              </div>
              <div className="mt-4 space-y-3">
                {VERIFICATION_QUEUE.map((v) => {
                  const done = verified.includes(v.id);
                  return (
                    <div key={v.id} className="rounded-2xl border border-forest-950/6 bg-sand-50 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-ink-400">{v.id}</span>
                        <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-bold text-forest-800">
                          {v.kind}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-ink-900">{v.name}</p>
                      <p className="text-xs text-ink-500">
                        {v.district} · {v.submitted} · {v.docsReady ? "Docs ready" : "Docs pending"}
                      </p>
                      <button
                        onClick={() => setVerified((prev) => (prev.includes(v.id) ? prev : [...prev, v.id]))}
                        disabled={done || !v.docsReady}
                        className={`mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-bold transition ${
                          done
                            ? "bg-forest-100 text-forest-800"
                            : v.docsReady
                              ? "bg-forest-800 text-sand-50 hover:bg-forest-700"
                              : "cursor-not-allowed bg-forest-950/8 text-ink-400"
                        }`}
                      >
                        <Icon name={done ? "check" : "shield"} className="h-3.5 w-3.5" />
                        {done ? "Verified" : v.docsReady ? "Approve" : "Awaiting documents"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit log */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">Audit log</h2>
              <ul className="mt-3 space-y-3">
                {AUDIT_LOG.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />
                    <div>
                      <p className="text-sm text-ink-700">
                        <span className="font-semibold text-ink-900">{a.actor}</span> {a.action} ·{" "}
                        <span className="font-mono text-xs text-ink-500">{a.target}</span>
                      </p>
                      <p className="text-[11px] text-ink-400">{a.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
