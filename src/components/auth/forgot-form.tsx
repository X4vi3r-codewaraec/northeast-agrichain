"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { ApiError } from "@/lib/api-client";
import { requestOtp, verifyOtp } from "@/lib/auth-api";
import { roleHome, saveSession, toSession } from "@/lib/auth-client";
import type { Role } from "@/lib/data";

export function ForgotForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("farmer");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number (e.g. 9876543210).");
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
        setError("The database isn't connected yet, so recovery is unavailable.");
      } else {
        setError(cause instanceof Error ? cause.message : "Could not send OTP.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter any 6-digit code.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { user } = await verifyOtp({ phone, code: otp });
      saveSession(toSession(user));
      setRole(user.role);
      setStep("done");
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "registration_required") {
        setError("We couldn't find an account for that number. Please sign up.");
        return;
      }
      setError(cause instanceof Error ? cause.message : "Could not verify.");
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    router.push(roleHome(role));
    router.refresh();
  }

  const inputCls =
    "h-13 w-full rounded-xl border border-forest-600/20 bg-white px-4 text-base text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30 disabled:opacity-60";
  const buttonCls =
    "inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-sand-50 shadow-lg shadow-forest-950/10 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-60";

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
                  ? "Enter any 6-digit code to confirm"
                  : "You're back in"}
            </p>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex items-center gap-2">
          {["Phone", "OTP", "Done"].map((label, i) => {
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
            {error ? (
              <p className="text-sm font-medium text-clay-500" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className={buttonCls}>
              {busy ? "Checking…" : "Send recovery OTP"}
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </form>
        ) : step === "otp" ? (
          <form onSubmit={verify} className="mt-7 space-y-5">
            <div>
              <p className="text-sm font-semibold text-ink-700">
                Enter the OTP for +91 {phone}
              </p>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                value={otp}
                disabled={busy}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`${inputCls} mt-3 text-center font-mono text-xl tracking-[0.5em]`}
              />
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
              {busy ? "Verifying…" : "Verify number"}
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </form>
        ) : (
          <div className="mt-7 space-y-5">
            <p className="rounded-xl border border-forest-600/20 bg-sand-100 px-4 py-3 text-sm text-ink-700">
              Your number is verified and you&apos;re signed in.
            </p>
            <button type="button" onClick={finish} className={buttonCls}>
              <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              Continue to the app
            </button>
          </div>
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
        Hackathon demo: no SMS is sent — any 6-digit code verifies your number.
      </p>
    </div>
  );
}
