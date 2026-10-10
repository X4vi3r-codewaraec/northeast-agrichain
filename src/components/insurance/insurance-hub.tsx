"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { useSpeech } from "@/hooks/use-speech";
import {
  CLAIM_EVENT_LABEL,
  CLAIM_STATUS_ORDER,
  DEMO_CLAIMS,
  POLICIES,
  claimStatusMeta,
  estimateClaim,
  type ClaimEvent,
  type Policy,
} from "@/lib/insurance";

const EVENTS: ClaimEvent[] = ["flood", "frost", "hail", "drought"];

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function InsuranceHub() {
  const [policyId, setPolicyId] = useState(POLICIES[0].id);
  const [event, setEvent] = useState<ClaimEvent>("flood");
  const [severityPct, setSeverityPct] = useState(60);
  const [indexDeviation, setIndexDeviation] = useState(35);
  const [filed, setFiled] = useState(false);
  const { speak, stop, speaking } = useSpeech();

  const policy: Policy = POLICIES.find((p) => p.id === policyId) ?? POLICIES[0];
  const estimate = useMemo(
    () => estimateClaim({ policy, areaHa: 2, event, severityPct, indexDeviation }),
    [policy, event, severityPct, indexDeviation],
  );

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="shield" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Weather-index Insurance
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Objective index triggers · no field inspection · deterministic payouts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {/* Policies */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Your policies</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {POLICIES.map((p) => {
                  const active = p.id === policyId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPolicyId(p.id);
                        setFiled(false);
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-forest-600/50 bg-forest-50 ring-2 ring-forest-600/20"
                          : "border-forest-950/8 bg-white hover:border-forest-600/25"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-ink-400">{p.id}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === "active"
                              ? "bg-forest-600 text-white"
                              : p.status === "expiring"
                                ? "bg-gold-500 text-ink-900"
                                : "bg-ink-400 text-white"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-2 font-display text-base font-semibold text-ink-900">
                        {p.cropName}
                      </p>
                      <p className="text-xs text-ink-500">
                        Sum insured {inr(p.sumInsured)} · premium {inr(p.premium)}
                      </p>
                      <p className="mt-2 text-[11px] text-ink-400">{p.trigger}</p>
                      <p className="mt-1 text-[11px] font-semibold text-ink-500">
                        Valid to {p.validUntil}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Claims table */}
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Recent claims</h2>
              <div className="mt-4 space-y-3">
                {DEMO_CLAIMS.map((c) => {
                  const meta = claimStatusMeta(c.status);
                  const idx = CLAIM_STATUS_ORDER.indexOf(c.status);
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-forest-950/6 bg-sand-50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-mono text-xs font-bold text-ink-500">{c.id}</span>
                        <span className="text-sm font-semibold text-ink-900">{c.crop}</span>
                        <span className="text-xs text-ink-500">
                          {CLAIM_EVENT_LABEL[c.event]} · filed {c.filedOn}
                        </span>
                        <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        {CLAIM_STATUS_ORDER.map((s, i) => (
                          <div key={s} className="flex flex-1 items-center gap-1">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                i <= idx ? "bg-forest-600" : "bg-forest-950/10"
                              }`}
                            />
                            {i < CLAIM_STATUS_ORDER.length - 1 ? (
                              <span
                                className={`h-0.5 flex-1 ${i < idx ? "bg-forest-500" : "bg-forest-950/10"}`}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-700">
                        {c.amount > 0 ? `${inr(c.amount)} paid` : "Assessment in progress"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Claim estimator */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink-900">File a claim</h2>
              <p className="mt-1 text-xs text-ink-500">
                The index, not an inspector, decides. Move the sliders to model a triggered event.
              </p>

              <p className="mt-4 text-xs font-semibold text-ink-500">Event</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {EVENTS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setEvent(e);
                      setFiled(false);
                    }}
                    className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-bold transition ${
                      event === e
                        ? "bg-forest-800 text-sand-50"
                        : "border border-forest-950/12 bg-sand-50 text-ink-600"
                    }`}
                  >
                    {CLAIM_EVENT_LABEL[e]}
                  </button>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Reported intensity
                  <span className="font-display text-sm text-ink-900">{severityPct}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={severityPct}
                  onChange={(e) => setSeverityPct(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>

              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Index departure beyond trigger
                  <span className="font-display text-sm text-ink-900">{indexDeviation} pts</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={indexDeviation}
                  onChange={(e) => setIndexDeviation(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>
            </div>

            <div
              className={`rounded-3xl p-5 shadow-lg ${
                estimate.triggered ? "bg-forest-900 text-sand-50" : "bg-ink-900 text-sand-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-white/70">
                  {estimate.triggered ? "Payout triggered" : "No payout"}
                </span>
                <Icon name={estimate.triggered ? "check" : "x"} className="h-5 w-5 text-gold-300" />
              </div>
              <p className="mt-1 font-display text-4xl font-semibold text-gold-300">
                {inr(estimate.netPayable)}
              </p>
              <dl className="mt-4 space-y-1.5 text-sm text-white/85">
                <div className="flex justify-between">
                  <dt>Affected area</dt>
                  <dd className="font-semibold text-white">{estimate.affectedHa} ha</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Assessed yield loss</dt>
                  <dd className="font-semibold text-white">{estimate.yieldLossPct}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Gross payable</dt>
                  <dd className="font-semibold text-white">{inr(estimate.grossPayable)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Standard deductible</dt>
                  <dd className="font-semibold text-white">− {inr(estimate.deductible)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-white/75">{estimate.narrative}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => (speaking ? stop() : speak(estimate.narrative))}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                >
                  <Icon name="mic" className="h-4 w-4" />
                  {speaking ? "Stop" : "Listen"}
                </button>
                <button
                  onClick={() => setFiled(true)}
                  disabled={!estimate.triggered}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
                    estimate.triggered
                      ? "bg-gold-500 text-ink-900 hover:bg-gold-400"
                      : "cursor-not-allowed bg-white/10 text-white/40"
                  }`}
                >
                  <Icon name="shield" className="h-4 w-4" />
                  {filed ? "Claim filed ✓" : "File claim"}
                </button>
              </div>
              {filed ? (
                <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold text-white ring-1 ring-white/20">
                  Claim submitted. Objective index verification runs automatically; settlement lands
                  in your linked account — typically 5–7 working days.
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm">
              <Pill>₹2.7 – 3.9 cr settled NER-wide (demo)</Pill>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
                Payout maths (affected area, yield loss, deductible) is computed in code and never
                by the model — the assistant only explains it.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
