"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";

const DEMO_OTP = "123456";

export function ForgotForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function sendOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number (e.g. 9876543210).");
      return;
    }
    setError("");
    setStep("otp");
  }

  function verifyOtp(e: FormEvent) {
    e.preventDefault();
    if (otp !== DEMO_OTP) {
      setError(`Wrong OTP. For this demo use ${DEMO_OTP}.`);
      return;
    }
    setError("");
    setStep("done");
  }

  function savePin(e: FormEvent) {
    e.preventDefault();
    if (pin.length < 4) {
      setError("Choose a 4-digit or longer PIN.");
      return;
    }
    setError("");
    router.push("/login");
  }

  const inputCls =
    "h-13 w-full rounded-xl border border-forest-600/20 bg-white px-4 text-base text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-forest-950/8 bg-white p-8 shadow-xl shadow-forest-950/5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
            <Icon name="shield" className="h-5.5 w-5.5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">Account recovery</h1>
            <p className="text-sm text-ink-500">
              {step === "phone"
                ? "Re-verify your number to regain access"
                : step === "otp"
                  ? "Confirm the OTP we sent"
                  : "Set a new PIN"}
            </p>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex items-center gap-2">
          {["Phone", "OTP", "Reset"].map((label, i) => {
            const active = (step === "phone" ? 0 : step === "otp" ? 1 : 2) >= i;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-forest-700 text-white" : "bg-forest-950/8 text-ink-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-[11px] font-semibold text-ink-500">{label}</span>
                {i < 2 ? <span className={`h-0.5 flex-1 ${active ? "bg-forest-500" : "bg-forest-950/10"}`} /> : null}
              </div>
            );
          })}
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="mt-7 space-y-5">
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-ink-700">
                Registered mobile number
              </label>
              <div className="flex">
                <span className="inline-flex h-13 items-center rounded-l-xl border border-r-0 border-forest-600/20 bg-sand-100 px-4 text-sm font-semibold text-ink-700">
                  +91
                </span>
                <input
                  id="phone"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={`${inputCls} rounded-l-none`}
                />
              </div>
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
              Send recovery OTP
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </form>
        ) : step === "otp" ? (
          <form onSubmit={verifyOtp} className="mt-7 space-y-5">
            <div>
              <p className="text-sm font-semibold text-ink-700">
                6-digit OTP sent to +91 {phone}
              </p>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${inputCls} mt-3 text-center font-mono text-xl tracking-[0.5em]`}
              />
            </div>
            <p className="rounded-xl border border-gold-600/25 bg-gold-50 px-4 py-2.5 text-xs font-medium text-gold-800">
              Demo OTP is <strong>{DEMO_OTP}</strong>
            </p>
            {error ? (
              <p className="text-sm font-medium text-clay-500" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-sand-50 shadow-lg shadow-forest-950/10 transition hover:bg-forest-700"
            >
              Verify number
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </form>
        ) : (
          <form onSubmit={savePin} className="mt-7 space-y-5">
            <div>
              <label htmlFor="pin" className="mb-2 block text-sm font-semibold text-ink-700">
                New login PIN
              </label>
              <input
                id="pin"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className={`${inputCls} text-center font-mono text-xl tracking-[0.5em]`}
              />
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
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Save PIN &amp; back to login
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-500">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-600"
          >
            Back to login
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-ink-300">
        Recovery still requires your OTP — even support cannot bypass it.
      </p>
    </div>
  );
}
