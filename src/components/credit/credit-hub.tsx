"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { Eyebrow, Pill } from "@/components/ui/primitives";
import { NER_STATES } from "@/lib/data";
import {
  creditAssessment,
  climateRiskScore,
  INDEX_POLICIES,
  payoutEstimate,
  premiumEstimate,
  riskMeta,
} from "@/lib/credit";

function Gauge({ score }: { score: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = score >= 60 ? "#dc2626" : score >= 35 ? "#f2a93b" : "#2e6b3e";
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-36 w-36" aria-label={`Climate risk score ${score}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="11" className="text-forest-950/8" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 700ms" }}
        />
        <text x="70" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0a1e12">
          {score}
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#5b6d63">
          risk / 100
        </text>
      </svg>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-700">What drives the number</p>
        {[
          { c: "bg-sky-500", label: "Flood / valley exposure" },
          { c: "bg-gold-500", label: "Frost by elevation" },
          { c: "bg-forest-600", label: "Monsoon intensity" },
          { c: "bg-clay-400", label: "Slope soil wash" },
        ].map((f) => (
          <span key={f.label} className="flex items-center gap-2 text-xs text-ink-600">
            <span className={`h-2.5 w-2.5 rounded-full ${f.c}`} /> {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CreditHub() {
  const [district, setDistrict] = useState("Jorhat");
  const [ha, setHa] = useState(2);
  const [policyId, setPolicyId] = useState(INDEX_POLICIES[0].cropId);
  const [scenario, setScenario] = useState(20); // % deviation beyond trigger

  const risk = useMemo(() => climateRiskScore(district), [district]);
  const rmeta = riskMeta(risk.level);
  const credit = useMemo(() => creditAssessment(district), [district]);
  const policy = INDEX_POLICIES.find((p) => p.cropId === policyId) ?? INDEX_POLICIES[0];
  const premium = premiumEstimate(policy, ha);
  const payout = payoutEstimate(policy, scenario);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="coin" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Credit & Weather-Index Insurance
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Climate-risk scoring · loan readiness · automatic payouts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Left column */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wide text-ink-400">
                Your district (risk model)
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
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

              <div className="mt-6 rounded-2xl bg-sand-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                    Climate risk · {district}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold text-white ${rmeta.cls}`}>
                    {rmeta.label}
                  </span>
                </div>
                <div className="mt-4">
                  <Gauge score={risk.score} />
                </div>
                <ul className="mt-5 space-y-2">
                  {risk.factors.map((f) => (
                    <li key={f.label} className="flex items-center justify-between text-sm">
                      <span className="text-ink-600">{f.label}</span>
                      <span className="font-bold text-ink-900">+{f.contribution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <Eyebrow>Credit readiness</Eyebrow>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink-900">
                  Estimated approval
                </h2>
                <span className="font-display text-3xl font-semibold text-forest-700">
                  ₹{credit.approvedLakh} lakh
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-forest-50 p-4 ring-1 ring-forest-600/10">
                  <p className="text-xs font-medium text-ink-500">Rate (renewable)</p>
                  <p className="font-display text-lg font-semibold text-ink-900">{credit.ratePct}% p.a.</p>
                </div>
                <div className="rounded-2xl bg-forest-50 p-4 ring-1 ring-forest-600/10">
                  <p className="text-xs font-medium text-ink-500">Tenure</p>
                  <p className="font-display text-lg font-semibold text-ink-900">{credit.tenureMonths} months</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-ink-700">Unlocks with</p>
              <ul className="mt-2 space-y-2">
                {credit.needs.map((n) => (
                  <li key={n} className="flex items-start gap-2.5 text-sm text-ink-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {n}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-ink-400">
                Score and limits are code-computed from district climate factors — the FastAPI underwriter adds farm-level history.
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
              <Eyebrow>Weather-index insurance</Eyebrow>
              <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">
                Triggered by rainfall, not inspections
              </h2>

              <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-ink-400">
                Policy
              </label>
              <div className="mt-2 space-y-2">
                {INDEX_POLICIES.map((p) => (
                  <button
                    key={p.cropId}
                    onClick={() => setPolicyId(p.cropId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      policy.cropId === p.cropId
                        ? "border-forest-600/40 bg-forest-50"
                        : "border-forest-950/8 bg-sand-50/60 hover:border-forest-600/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink-900">{p.cropName}</p>
                      <span className="text-xs font-semibold text-ink-500">₹{p.sumAssuredPerHa.toLocaleString("en-IN")}/ha assured</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{p.trigger}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
                      <span className="rounded-full bg-white px-2.5 py-1 text-forest-700 ring-1 ring-forest-600/15">
                        Premium {p.premiumPct}% of sum assured
                      </span>
                      <span className="text-ink-500">Payout slice ₹{p.payoutUnitPerHa}/deviation unit/ha</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
                    <span>Area</span>
                    <span>{ha} ha</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ha}
                    onChange={(e) => setHa(Number(e.target.value))}
                    className="mt-2 w-full accent-forest-700"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
                    <span>Scenario: deviation beyond trigger</span>
                    <span>{scenario} pts</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={scenario}
                    onChange={(e) => setScenario(Number(e.target.value))}
                    className="mt-2 w-full accent-forest-700"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-forest-900 p-5 text-sand-50">
                <div>
                  <p className="text-xs text-forest-100/70">Premium (your area)</p>
                  <p className="font-display text-2xl font-semibold text-gold-300">₹{premium.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-forest-100/70">Auto payout in this scenario</p>
                  <p className="font-display text-2xl font-semibold">₹{payout.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
                Payout math is deterministic from the rainfall index (Imd grid data via FastAPI later) — no field inspection, no claims form. Money lands in your linked account.
              </p>
            </div>

            <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                  <Icon name="sparkles" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">Why this matters</h3>
                  <p className="text-sm text-forest-100/75">For lenders and insurers</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-forest-100/85">
                <li className="flex items-start gap-2.5">
                  <Icon name="chart" className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                  <span>Yield + climate signals underwrite faster than credit-history-free farmers can elsewhere.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                  <span>Index-linked payouts remove disputes — the number writes itself.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="drop" className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                  <span>District risk feeds the drought/flood planning dashboard too.</span>
                </li>
              </ul>
              <div className="mt-5">
                <Pill dark>gpt-4o mini writes the plain-language explanation — never the payout math</Pill>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}