"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { NER_STATES } from "@/lib/data";
import {
  CATEGORY_LABEL,
  SEVERITY_META,
  alertStartsAt,
  generateAlerts,
  statusLabel,
  type NacAlert,
  type Severity,
} from "@/lib/alerts";
import { useSpeech } from "@/hooks/use-speech";

const SUBS_KEY = "nac_alerts_subs";
const ACK_KEY = "nac_alerts_ack";

function loadJSON(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function useStoredSet(key: string) {
  const [set, setSet] = useState<Set<string>>(() => new Set(loadJSON(key)));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify([...set]));
    } catch {
      /* storage unavailable */
    }
  }, [key, set]);
  return [set, setSet] as const;
}

function AlertCard({ alert, acked, onAck }: { alert: NacAlert; acked: boolean; onAck: () => void }) {
  const meta = SEVERITY_META[alert.severity];
  const status = statusLabel(alert);
  const { speak, speaking, stop, supported } = useSpeech("en-IN");

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition sm:p-6 ${meta.card} ${
        acked ? "opacity-75" : ""
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} />
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${meta.chip}`}>
          {meta.label}
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-ink-600 ring-1 ring-forest-950/10">
          {CATEGORY_LABEL[alert.category]}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
          <span className={`h-2 w-2 rounded-full ${status.live ? "animate-pulse bg-red-500" : "bg-ink-400"}`} />
          {status.text}
        </span>
        {acked ? (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-forest-600">
            <Icon name="check" className="h-3.5 w-3.5" />
            Acknowledged
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold text-ink-900 sm:text-xl">
        {alert.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{alert.body}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="mapPin" className="h-3.5 w-3.5 text-forest-600" />
          {alert.districts.join(", ")} · {alert.state}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" className="h-3.5 w-3.5 text-forest-600" />
          Until {new Date(alertStartsAt(alert)).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-forest-950/6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Suggested actions</p>
        <ul className="mt-2 space-y-1.5">
          {alert.actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta.bar}`} />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => (speaking ? stop() : speak(`${alert.title}. ${alert.body}`))}
          disabled={supported === false}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition ${
            speaking
              ? "bg-forest-800 text-gold-300"
              : "bg-forest-800 text-sand-50 hover:bg-forest-700"
          } ${supported === false ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Icon name={speaking ? "radio" : "mic"} className="h-3.5 w-3.5" />
          {speaking ? "Stop" : "Hear it"}
        </button>
        {!acked ? (
          <button
            onClick={onAck}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-forest-950/15 bg-white px-4 text-xs font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
          >
            <Icon name="check" className="h-3.5 w-3.5" />
            Acknowledge
          </button>
        ) : null}
        <span className="ml-auto text-[11px] font-medium text-ink-400">
          Source: {alert.source}
        </span>
      </div>
    </article>
  );
}

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState<NacAlert[] | null>(null);
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [subs, setSubs] = useStoredSet(SUBS_KEY);
  const [acks, setAcks] = useStoredSet(ACK_KEY);

  // Generate on the client after mount so relative timestamps are fresh —
  // kept out of the prerender pass (Next 16 treats Date.now() as unstable).
  useEffect(() => {
    const t = setTimeout(() => setAlerts(generateAlerts()), 0);
    return () => clearTimeout(t);
  }, []);

  const counts = useMemo(() => {
    const c = { red: 0, orange: 0, yellow: 0 };
    (alerts ?? []).forEach((a) => {
      c[a.severity] += 1;
    });
    return c;
  }, [alerts]);

  const filtered = useMemo(() => {
    return (alerts ?? [])
      .filter((a) => (filter === "all" ? true : a.severity === filter))
      .filter((a) => (districtFilter === "all" ? true : a.districts.includes(districtFilter)))
      .sort((a, b) => {
        const order = SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order;
        if (order !== 0) return order;
        return a.startsInHours - b.startsInHours;
      });
  }, [alerts, filter, districtFilter]);

  const toggleDistrict = (d: string) => {
    setSubs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const allDistricts = NER_STATES.flatMap((s) => s.districts);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-700 text-white">
                <Icon name="radio" className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                  Early-Warning Board
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Flood · landslide · frost · pests — NER wide
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-ink-700">{counts.red} active red alerts</span>
              </div>
              <Link
                href="/weather"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-950/15 bg-white px-4 text-sm font-bold text-forest-800 transition hover:border-forest-600/30 hover:bg-forest-50"
              >
                <Icon name="cloudRain" className="h-4 w-4" />
                Climate outlook
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "red", "orange", "yellow"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition ${
                    filter === f
                      ? "bg-forest-800 text-sand-50"
                      : "border border-forest-950/12 bg-white text-ink-600 hover:border-forest-600/30"
                  }`}
                >
                  {f === "all" ? "All" : SEVERITY_META[f].label.split(" · ")[0]}
                  <span className="text-xs opacity-70">{f === "all" ? (alerts?.length ?? 0) : counts[f]}</span>
                </button>
              ))}
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="ml-auto h-9 rounded-full border border-forest-950/12 bg-white px-3.5 text-sm font-semibold text-ink-700 outline-none transition focus:border-forest-600/50"
              >
                <option value="all">All districts</option>
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

            {alerts === null ? (
              <div className="space-y-4" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-40 animate-pulse rounded-3xl border border-forest-950/6 bg-white"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-forest-950/15 bg-white p-10 text-center">
                <Icon name="check" className="mx-auto h-8 w-8 text-forest-500" />
                <p className="mt-3 font-display text-lg font-semibold text-ink-900">
                  Nothing here right now
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  No {filter !== "all" ? filter : ""} alerts match this filter
                  {districtFilter !== "all" ? ` for ${districtFilter}` : ""}.
                </p>
              </div>
            ) : (
              filtered.map((a) => (
                <AlertCard
                  key={a.id}
                  alert={a}
                  acked={acks.has(a.id)}
                  onAck={() =>
                    setAcks((prev) => {
                      const next = new Set(prev);
                      next.add(a.id);
                      return next;
                    })
                  }
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                District subscriptions
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Get this block’s warnings on the phone. Toggled here; pushed via
                SMS/voice once the FastAPI notifier ships.
              </p>
              <div className="mt-4 max-h-[380px] space-y-1 overflow-y-auto pr-1">
                {NER_STATES.map((s) => (
                  <div key={s.id} className="mb-2">
                    <p className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                      {s.name}
                    </p>
                    <div className="space-y-1">
                      {s.districts.map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleDistrict(d)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-ink-700 transition hover:bg-forest-50"
                        >
                          <span
                            className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                              subs.has(d) ? "bg-forest-600" : "bg-forest-950/15"
                            }`}
                          >
                            <span
                              className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                subs.has(d) ? "translate-x-4" : ""
                              }`}
                            />
                          </span>
                          {d}
                          {subs.has(d) ? (
                            <Icon name="check" className="ml-auto h-3.5 w-3.5 text-forest-600" />
                          ) : (
                            <Pill>off</Pill>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-ink-400">
                Subscribed now: {subs.size} of {allDistricts.length} demo districts
              </p>
            </div>

            <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
              <h2 className="font-display text-lg font-semibold">How alerts reach you</h2>
              <ul className="mt-4 space-y-3 text-sm text-forest-100/85">
                <li className="flex items-start gap-2.5">
                  <Icon name="radio" className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                  <span><strong className="text-sand-50">Voice call (IVR)</strong> — read out in your language when the phone is a dumb phone</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                  <span><strong className="text-sand-50">SMS</strong> — short, high-priority text for red alerts</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="mic" className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                  <span><strong className="text-sand-50">In-app voice</strong> — press “Hear it” on any alert card</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}