"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { saveSession } from "@/lib/auth-client";

const DEMO_OTP = "123456";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function sendOtp(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number (e.g. 9876543210).");
      return;
    }
    setError("");
    setSent(true);
    setStep("otp");
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    if (otp === DEMO_OTP) {
      saveSession({
        name: "Demo Farmer",
        role: "farmer",
        state: "Assam",
        district: "Jorhat",
        lang: "English",
      });
      router.push("/dashboard");
    } else {
      setError(`Wrong OTP. For this demo use ${DEMO_OTP}.`);
    }
  }

  const inputCls =
    "h-13 w-full rounded-xl border border-forest-600/20 bg-white px-4 text-base text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-forest-950/8 bg-white p-8 shadow-xl shadow-forest-950/5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
            <Icon name="leaf" className="h-5.5 w-5.5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">
              Welcome back
            </h1>
            <p className="text-sm text-ink-500">OTP login — no passwords</p>
          </div>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-ink-700"
              >
                Mobile number
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
              Send OTP
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <p className="rounded-xl bg-sand-100 px-4 py-3 text-xs leading-relaxed text-ink-500">
              Demo mode: OTP is delivered to this screen, not your phone. You
              will be signed in as a sample farmer.
            </p>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-8 space-y-5">
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
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="mt-2 text-xs font-medium text-forest-700 underline underline-offset-2 hover:text-forest-600"
              >
                Change number
              </button>
            </div>
            {sent ? (
              <p className="rounded-xl border border-gold-600/25 bg-gold-50 px-4 py-2.5 text-xs font-medium text-gold-800">
                Demo OTP is <strong>{DEMO_OTP}</strong>
              </p>
            ) : null}
            {error ? (
              <p className="text-sm font-medium text-clay-500" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-sand-50 shadow-lg shadow-forest-950/10 transition hover:bg-forest-700"
            >
              Verify &amp; continue
              <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
            </button>
            {step === "otp" ? (
              <Link
                href="/forgot"
                className="block text-center text-xs font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-600"
              >
                Trouble signing in? Recover your account
              </Link>
            ) : null}
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-500">
          New to AgriChain?{" "}
          <Link
            href="/signup"
            className="font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-600"
          >
            Create a free account
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-ink-300">
        SMS + WhatsApp OTP delivery activates with the production backend.
      </p>
    </div>
  );
}