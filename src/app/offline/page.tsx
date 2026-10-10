import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Offline",
  description: "You are offline. Cached pages and your saved advisories are still available.",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-forest-950/8 bg-white p-8 text-center shadow-xl shadow-forest-950/5">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
          <Icon name="cloud" className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">You are offline</h1>
        <p className="mt-2 text-sm text-ink-500">
          Hill connectivity comes and goes. Your saved advisories, diagnosis history and queued
          photos are still on this device — they sync automatically when you reconnect.
        </p>

        <div className="mt-6 space-y-2.5 text-left">
          {[
            "Weather and advisories you opened earlier stay cached.",
            "Photos taken offline are analysed once the network returns.",
            "No data is lost — everything queues locally first.",
          ].map((line) => (
            <p key={line} className="flex items-start gap-2.5 text-sm text-ink-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
              </span>
              {line}
            </p>
          ))}
        </div>

        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-forest-800 px-6 text-sm font-bold text-sand-50 transition hover:bg-forest-700"
        >
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
          Try again
        </Link>
      </div>
    </div>
  );
}
