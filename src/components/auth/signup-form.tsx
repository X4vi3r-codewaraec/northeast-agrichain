"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { saveSession } from "@/lib/auth-client";
import {
  LANGUAGES,
  NER_STATES,
  type Role,
} from "@/lib/data";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>("farmer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
  const [error, setError] = useState("");

  function onStateChange(id: string) {
    setStateId(id);
    const next = NER_STATES.find((s) => s.id === id);
    if (next) setDistrict(next.districts[0]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^\d{10}$/.test(phone)) return setError("Enter a valid 10-digit mobile number.");
    const state = NER_STATES.find((s) => s.id === stateId)?.name ?? "Assam";
    saveSession({
      name: name.trim(),
      role,
      state,
      district,
      lang: LANGUAGES.find((l) => l.code === lang)?.name ?? "English",
    });
    router.push("/dashboard");
  }

  const inputCls =
    "h-12 w-full rounded-xl border border-forest-600/20 bg-white px-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30";

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-3xl border border-forest-950/8 bg-white p-8 shadow-xl shadow-forest-950/5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
            <Icon name="leaf" className="h-5.5 w-5.5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">
              Create your free account
            </h1>
            <p className="text-sm text-ink-500">
              One account, five roles — pick what fits you.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-5">
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
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
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

          <button
            type="submit"
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-sand-50 shadow-lg shadow-forest-950/10 transition hover:bg-forest-700"
          >
            Create account &amp; continue
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
      </div>
      <p className="mt-4 text-center text-xs text-ink-300">
        Demo mode: the account lives in your browser until the FastAPI backend
        ships with OTP + role access control.
      </p>
    </div>
  );
}