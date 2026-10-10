import Link from "next/link";
import { Icon } from "@/components/icons";

export function CTAInner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-6 py-16 text-center text-sand-50 shadow-2xl shadow-forest-950/20 sm:px-16 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(237,168,68,0.18),transparent_65%)]"
      />
      <div className="relative mx-auto max-w-2xl">
        <span className="font-display text-2xl">🍃</span>
        <h2 className="mt-4 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          The 8 states have the land. We’ll add the weather sense, the buyers
          and the credit.
        </h2>
        <p className="mt-4 text-base text-forest-100/80 sm:text-lg">
          Join as a farmer, FPO, buyer, transporter or extension officer. Free
          for the demo — OTP login, no password to forget.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-13 items-center gap-2 rounded-full bg-gold-500 px-8 text-sm font-bold text-forest-950 shadow-lg shadow-gold-500/25 transition hover:bg-gold-400"
          >
            Create your account
            <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <Link
            href="/crops"
            className="inline-flex h-13 items-center rounded-full border border-white/25 px-8 text-sm font-semibold text-sand-50 transition hover:border-white/50 hover:bg-white/10"
          >
            Explore the crop registry
          </Link>
        </div>
        <p className="mt-6 text-xs text-forest-100/60">
          Built with IMD feeds, OpenStreetMap routing and GPT-4o mini — no
          credit card required.
        </p>
      </div>
    </div>
  );
}