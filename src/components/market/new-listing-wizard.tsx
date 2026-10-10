"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CROPS, NER_STATES } from "@/lib/data";
import { DISTRICT_COORDS } from "@/lib/geo";
import { GRADE_LABEL, type ListingGrade } from "@/lib/market";

const STEPS = ["Produce", "Lot & price", "Origin", "Proof", "Review"] as const;

function stateForDistrict(district: string): string {
  return NER_STATES.find((s) => s.districts.includes(district))?.name ?? "Assam";
}

export default function NewListingWizard() {
  const [step, setStep] = useState(0);
  const [cropId, setCropId] = useState(CROPS[0].id);
  const [grade, setGrade] = useState<ListingGrade>("A");
  const [organic, setOrganic] = useState(false);
  const [giCert, setGiCert] = useState(false);
  const [qtyT, setQtyT] = useState(2);
  const [pricePerKg, setPricePerKg] = useState(120);
  const [district, setDistrict] = useState("Jorhat");
  const [deliveryWindow, setDeliveryWindow] = useState("48 h, pooled");
  const [photos, setPhotos] = useState(0);
  const [published, setPublished] = useState(false);

  const crop = useMemo(() => CROPS.find((c) => c.id === cropId) ?? CROPS[0], [cropId]);
  const districts = useMemo(() => Object.keys(DISTRICT_COORDS).sort(), []);
  const grossValue = Math.round(qtyT * 1000 * pricePerKg);

  const canNext = step < STEPS.length - 1;

  if (published) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-600 text-white">
          <Icon name="check" className="h-8 w-8" strokeWidth={2.6} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">Listing submitted</h1>
        <p className="mt-2 text-sm text-ink-500">
          {crop.name} · {qtyT} t at ₹{pricePerKg}/kg is queued for moderation. Once approved it
          appears in the marketplace with its trace-to-farm panel and escrow rail.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/marketplace"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50"
          >
            View marketplace
          </Link>
          <button
            onClick={() => {
              setPublished(false);
              setStep(0);
              setPhotos(0);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-950/15 px-6 text-sm font-bold text-forest-800"
          >
            List another lot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-600"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
            Back to marketplace
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-900">
            Create a listing
          </h1>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Photos, grade &amp; certification — escrow and pooling auto-fill from your profile
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Stepper */}
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    i < step
                      ? "bg-forest-600 text-white"
                      : i === step
                        ? "bg-forest-800 text-sand-50 ring-4 ring-forest-600/15"
                        : "bg-forest-950/8 text-ink-400"
                  }`}
                >
                  {i < step ? <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> : i + 1}
                </span>
                <span className="mt-1.5 hidden text-[11px] font-semibold text-ink-500 sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 ? (
                <div className={`mx-2 mb-5 h-0.5 flex-1 ${i < step ? "bg-forest-500" : "bg-forest-950/10"}`} />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
          {step === 0 ? (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">What are you selling?</h2>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {CROPS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCropId(c.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      cropId === c.id
                        ? "border-forest-600/50 bg-forest-50 ring-2 ring-forest-600/20"
                        : "border-forest-950/8 hover:border-forest-600/25"
                    }`}
                  >
                    <span className={`block h-8 w-8 rounded-lg bg-gradient-to-br ${c.grad}`} />
                    <span className="mt-2 block text-xs font-bold text-ink-900">{c.name}</span>
                  </button>
                ))}
              </div>

              <p className="mt-5 text-xs font-semibold text-ink-500">Quality grade</p>
              <div className="mt-1.5 flex gap-2">
                {(["A", "B", "C"] as ListingGrade[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`inline-flex h-10 flex-1 items-center justify-center rounded-full text-sm font-bold transition ${
                      grade === g ? "bg-forest-800 text-sand-50" : "border border-forest-950/12 bg-sand-50 text-ink-600"
                    }`}
                  >
                    {GRADE_LABEL[g]}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setOrganic((v) => !v)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
                    organic ? "bg-forest-800 text-sand-50" : "border border-forest-950/12 bg-sand-50 text-ink-600"
                  }`}
                >
                  <Icon name="leaf" className="h-4 w-4" />
                  Organic certified
                </button>
                <button
                  onClick={() => setGiCert((v) => !v)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
                    giCert ? "bg-forest-800 text-sand-50" : "border border-forest-950/12 bg-sand-50 text-ink-600"
                  }`}
                >
                  <Icon name="shield" className="h-4 w-4" />
                  GI tag (source district)
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Quantity &amp; price</h2>
              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Available quantity
                  <span className="font-display text-sm text-ink-900">{qtyT} t</span>
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={20}
                  step={0.1}
                  value={qtyT}
                  onChange={(e) => setQtyT(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>
              <label className="mt-4 block">
                <span className="flex items-center justify-between text-xs font-semibold text-ink-500">
                  Asking price
                  <span className="font-display text-sm text-ink-900">₹{pricePerKg}/kg</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={1500}
                  step={2}
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(Number(e.target.value))}
                  className="mt-1.5 w-full accent-forest-700"
                />
              </label>
              <p className="mt-4 rounded-2xl bg-forest-50 px-4 py-3 text-sm font-semibold text-forest-800 ring-1 ring-forest-600/15">
                Gross lot value ≈ ₹{grossValue.toLocaleString("en-IN")} · escrow-protected on sale
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Origin &amp; delivery</h2>
              <label className="mt-4 block text-xs font-semibold text-ink-500">
                District
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-forest-950/12 bg-sand-50 px-3 text-sm font-semibold text-ink-700 outline-none focus:border-forest-600/50"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d} — {stateForDistrict(d)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-4 text-xs font-semibold text-ink-500">Delivery window</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {["24 h, ripening centre", "48 h, pooled", "72 h, cold chain", "5 d, ambient"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setDeliveryWindow(w)}
                    className={`inline-flex h-10 items-center justify-center rounded-full text-xs font-bold transition ${
                      deliveryWindow === w
                        ? "bg-forest-800 text-sand-50"
                        : "border border-forest-950/12 bg-sand-50 text-ink-600"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-xs text-ink-500 ring-1 ring-forest-950/6">
                Your farm polygon, soil history and diagnosis log attach automatically as the
                trace-to-farm panel — buyers see proof, not claims.
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Photos &amp; certification</h2>
              <button
                onClick={() => setPhotos((p) => Math.min(5, p + 1))}
                className="mt-4 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-forest-950/15 bg-sand-50 text-ink-500 transition hover:border-forest-600/30"
              >
                <Icon name="image" className="h-7 w-7 text-forest-600/60" />
                <span className="text-sm font-semibold">Add produce photos ({photos}/5)</span>
                <span className="text-[11px] text-ink-400">Daylight, one affected/representative area per shot</span>
              </button>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setGiCert((v) => !v)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
                    giCert ? "bg-forest-800 text-sand-50" : "border border-forest-950/12 bg-sand-50 text-ink-600"
                  }`}
                >
                  <Icon name="shield" className="h-4 w-4" />
                  {giCert ? "GI certificate attached" : "Attach GI certificate"}
                </button>
                <button
                  onClick={() => setOrganic((v) => !v)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${
                    organic ? "bg-forest-800 text-sand-50" : "border border-forest-950/12 bg-sand-50 text-ink-600"
                  }`}
                >
                  <Icon name="leaf" className="h-4 w-4" />
                  {organic ? "Organic certificate attached" : "Attach organic certificate"}
                </button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Review the lot</h2>
              <dl className="mt-4 divide-y divide-forest-950/6 text-sm">
                {[
                  ["Crop", `${crop.name} · ${GRADE_LABEL[grade]}`],
                  ["Quantity", `${qtyT} t`],
                  ["Price", `₹${pricePerKg}/kg`],
                  ["Origin", `${district}, ${stateForDistrict(district)}`],
                  ["Delivery", deliveryWindow],
                  ["Certification", [organic ? "Organic" : null, giCert ? "GI tag" : null].filter(Boolean).join(" + ") || "None"],
                  ["Photos", `${photos}`],
                  ["Gross value", `₹${grossValue.toLocaleString("en-IN")}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2.5">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-right font-semibold text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 rounded-2xl bg-forest-50 px-4 py-3 text-xs text-forest-800 ring-1 ring-forest-600/15">
                By publishing you confirm the grade and certification are accurate. Listings with
                misleading grades can be suspended by extension officers.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                step === 0
                  ? "cursor-not-allowed bg-forest-950/8 text-ink-400"
                  : "border border-forest-950/15 text-forest-800 hover:bg-forest-50"
              }`}
            >
              <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
              Back
            </button>
            {canNext ? (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
              >
                Continue
                <Icon name="arrowRight" className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setPublished(true)}
                className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-6 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                Publish listing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
