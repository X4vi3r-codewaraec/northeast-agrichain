import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Module in progress" };

const NEXT_MODULES = [
  { href: "/weather", label: "Weather & climate", icon: "cloudRain" as const },
  { href: "/diagnose", label: "AI crop diagnosis", icon: "scanPlus" as const },
  { href: "/map", label: "Storage & logistics map", icon: "route" as const },
  { href: "/shipments", label: "Shipments & pooling", icon: "truck" as const },
  { href: "/marketplace", label: "B2B marketplace", icon: "store" as const },
  { href: "/prices", label: "Price intelligence", icon: "chart" as const },
  { href: "/credit", label: "Credit & insurance", icon: "coin" as const },
  { href: "/assistant", label: "Voice assistant", icon: "mic" as const },
];

export default function ComingSoonPage() {
  return (
    <section className="bg-sand-50 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-800 text-gold-400 shadow-sm">
          <Icon name="sparkles" className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          This module is being built right now
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-500">
          The landing page and OTP login are live. Weather, AI diagnosis,
          logistics and trade pages slot in behind this shell as the build
          phases land.
        </p>
        <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
          {NEXT_MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-2xl border border-forest-950/8 bg-white px-4 py-3.5 shadow-sm transition hover:border-forest-600/25 hover:bg-forest-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                <Icon name={m.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ink-900">{m.label}</span>
              <span className="ml-auto rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-bold text-gold-800">
                Next
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-forest-800 px-7 text-sm font-bold text-sand-50 shadow-sm transition hover:bg-forest-700"
          >
            <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}