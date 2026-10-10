"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { ApiError } from "@/lib/api-client";
import { requestOtp, verifyOtp } from "@/lib/auth-api";
import { roleHome, saveSession, toSession } from "@/lib/auth-client";
import { LANGUAGES, NER_STATES, type Role } from "@/lib/data";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [role, setRole] = useState<Role>("farmer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(
    (params.get("phone") ?? "").replace(/\D/g, "").slice(0, 10),
  );
  const [stateId, setStateId] = useState(
    params.get("state") ?? NER_STATES[0].id,
  );
  const initialDistrict =
    NER_STATES.find((s) => s.id === params.get("state"))?.districts[0] ??
    NER_STATES[0].districts[0];
  const [district, setDistrict] = useState(
    params.get("district") ?? initialDistrict,
  );
  const [lang, setLang] = useState("en");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function onStateChange(id: string) {
    setStateId(id);
    const next = NER_STATES.find((s) => s.id === id);
    if (next) setDistrict(next.districts[0]);
  }

  async function submitDetails(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await requestOtp(phone);
      setNotice("Any 6-digit code works here — just make one up.");
      setStep("otp");
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "auth_not_configured") {
        setError(
          "The database isn't connected yet. Set POSTGRES_URL and AUTH_SECRET to create real accounts.",
        );
      } else {
        setError(
          cause instanceof Error ? cause.message : "Could not start sign-up.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter any 6-digit code.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const state = NER_STATES.find((s) => s.id === stateId)?.name ?? "Assam";
      const { user } = await verifyOtp({
        phone,
        code: otp,
        profile: { name: name.trim(), role, state, district, language: lang },
      });
      saveSession(toSession(user));
      router.push(roleHome(user.role));
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create your account.",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-xl border border-forest-600/20 bg-white px-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30 disabled:opacity-60";
  const buttonCls =
    "inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-sand-50 shadow-lg shadow-forest-950/10 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-forest-950/8 bg-white p-8 shadow-xl shadow-forest-950/5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
            <Icon name="leaf" className="h-5.5 w-5.5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">
              {step === "details" ? "Create your free account" : "Verify your number"}
            </h1>
            <p className="text-sm text-ink-500">
              {step === "details"
                ? "One account, five roles — pick what fits you."
                : `Enter any 6-digit code for +91 ${phone}`}
            </p>
          </div>
        </div>

        {step === "details" ? (
          <form onSubmit={submitDetails} className="mt-8 space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink-700">
                I am a…
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { id: "farmer" as Role, label: "Farmer" },
                  { id: "fpo" as Role, label: "FPO / Producer org" },
                  { id: "buyer" as Role, label: "Buyer / Retailer" },
                  { id: "transporter" as Role, label: "Logistics" },
                  { id: "admin" as Role, label: "Govt / Extension" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    aria-pressed={role === r.id}
                    className={`h-11 rounded-xl border px-3 text-sm font-semibold transition ${
                      role === r.id
                        ? "border-forest-700 bg-forest-800 text-sand-50 shadow-sm"
                        : "border-forest-600/20 bg-white text-ink-700 hover:border-forest-500/50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="su-name" className="mb-2 block text-sm font-semibold text-ink-700">
                  Full name
                </label>
                <input
                  id="su-name"
                  value={name}
                  disabled={busy}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rina Das"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="su-phone" className="mb-2 block text-sm font-semibold text-ink-700">
                  Mobile number
                </label>
                <div className="flex">
                  <span className="inline-flex h-12 items-center rounded-l-xl border border-r-0 border-forest-600/20 bg-sand-100 px-3.5 text-sm font-semibold text-ink-700">
                    +91
                  </span>
                  <input
                    id="su-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="9876543210"
                    value={phone}
                    disabled={busy}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className={`${inputCls} rounded-l-none`}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <label htmlFor="su-state" className="mb-2 block text-sm font-semibold text-ink-700">
                  State
                </label>
                <select
                  id="su-state"
                  value={stateId}
                  disabled={busy}
                  onChange={(e) => onStateChange(e.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  {NER_STATES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 bottom-3.5 text-ink-500">
                  <Icon name="chevronDown" className="h-4 w-4" />
                </span>
              </div>
              <div className="relative">
                <label htmlFor="su-district" className="mb-2 block text-sm font-semibold text-ink-700">
                  District
                </label>
                <select
                  id="su-district"
                  value={district}
                  disabled={busy}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={`${inputCls} appearance-none pr-9`}
                >
                  {NER_STATES.find((s) => s.id === stateId)?.districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 bottom-3.5 text-ink-500">
                  <Icon name="chevronDown" className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="su-lang" className="mb-2 block text-sm font-semibold text-ink-700">
                Advisory language
              </label>
              <select
                id="su-lang"
                value={lang}
                disabled={busy}
                onChange={(e) => setLang(e.target.value)}
                className={`${inputCls} appearance-none pr-9`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 bottom-3.5 text-ink-500">
                <Icon name="chevronDown" className="h-4 w-4" />
              </span>
            </div>

            {error ? (
              <p className="text-sm font-medium text-clay-500" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={busy} className={buttonCls}>
              {busy ? "Please wait…" : "Continue"}
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>

            <p className="text-center text-sm text-ink-500">
              Already joined?{" "}
              <Link
                href="/login"
                className="font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-600"
              >
                Log in
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="mt-8 space-y-5">
            <div>
              <label htmlFor="su-otp" className="mb-2 block text-sm font-semibold text-ink-700">
                OTP
              </label>
              <input
                id="su-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                value={otp}
                disabled={busy}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`${inputCls} text-center font-mono text-xl tracking-[0.5em]`}
              />
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setError("");
                  setNotice("");
                }}
                className="mt-2 text-xs font-medium text-forest-700 underline underline-offset-2 hover:text-forest-600"
              >
                Edit details
              </button>
            </div>

            {notice ? (
              <p className="rounded-xl border border-gold-600/25 bg-gold-50 px-4 py-2.5 text-xs font-medium text-gold-800">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-clay-500" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={busy} className={buttonCls}>
              {busy ? "Creating account…" : "Create account & continue"}
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </form>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-ink-300">
        Accounts are stored in the project database — sign in later with the
        same number and any 6-digit code.
      </p>
    </div>
  );
}
