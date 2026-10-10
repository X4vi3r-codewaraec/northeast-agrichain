"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: "How does the AI diagnosis work — and is it safe to rely on?",
    a: "You photograph the affected part, the app compresses it for hill bandwidth, and GPT-4o mini reads it together with your crop and district context. It returns a ranked issue, a confidence score and both organic and chemical remedies with dosage and waiting days. Below 55% confidence we explicitly ask for a clearer photo instead of guessing, and you can always route the case to an extension officer.",
  },
  {
    q: "Does it work without internet?",
    a: "Yes. Advisories, weather and your saved diagnosis history stay cached. If you are offline when you take a photo, it is queued on the device and analysed automatically once you reconnect — you get a notification. The app is installable as a PWA so it opens like a native app.",
  },
  {
    q: "How is my price or payout number calculated?",
    a: "Every number you see — ETA, shelf-life index, fair-price band, insurance payout, freight split — is computed by deterministic code from your inputs and public data. The language model only narrates or explains it. It never invents a figure.",
  },
  {
    q: "What are the payments protected by?",
    a: "Buyers pay into an escrow hold. Money is released to the seller only when proof-of-delivery is recorded and any quality dispute window closes. Pooled freight shares and index-insurance payouts settle through the same rail.",
  },
  {
    q: "Which languages are supported?",
    a: "English, Assamese, Bengali, Hindi, Khasi and Mizo today, with the interface and voice both switching from Settings. More North-East languages are being added through the same translation seam.",
  },
  {
    q: "Who can see my farm data?",
    a: "Only you, and the counterparties you transact with (for trace-to-farm on a listing). Government dashboards are aggregated and anonymised. You control what appears on each listing.",
  },
];

const TOPICS: { icon: IconName; title: string; body: string; href: string; cta: string }[] = [
  { icon: "cloudRain", title: "Weather & alerts", body: "Forecasts, crop calendar and disaster early warning.", href: "/weather", cta: "Open weather" },
  { icon: "scanPlus", title: "Crop diagnosis", body: "Photograph a leaf and get a remedy in seconds.", href: "/diagnose", cta: "Diagnose a crop" },
  { icon: "truck", title: "Logistics & pooling", body: "Terrain routes, cold chain and shared freight.", href: "/shipments", cta: "Open shipments" },
  { icon: "store", title: "Marketplace & escrow", body: "List, trace-to-farm and buy with protected payment.", href: "/marketplace", cta: "Browse market" },
];

export default function HelpCenter() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400">
              <Icon name="book" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Help &amp; Guide
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Answers, offline tips and ways to reach a human
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className="group rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm transition hover:border-forest-600/25 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                <Icon name={topic.icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 font-display text-base font-semibold text-ink-900">{topic.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{topic.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-forest-700">
                {topic.cta}
                <Icon name="arrowRight" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">Frequently asked</h2>
          <div className="mt-4 divide-y divide-forest-950/6">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="py-1">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-3 py-3.5 text-left"
                  >
                    <span className="flex-1 text-sm font-semibold text-ink-900">{f.q}</span>
                    <Icon
                      name="chevronDown"
                      className={`h-4 w-4 shrink-0 text-ink-400 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen ? (
                    <p className="pb-4 pr-7 text-sm leading-relaxed text-ink-600">{f.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg">
            <h2 className="font-display text-lg font-semibold">Talk to us</h2>
            <p className="mt-1.5 text-sm text-forest-100/80">
              Toll-free support in your language, and a WhatsApp line for quick questions.
            </p>
            <div className="mt-4 space-y-2.5 text-sm">
              <p className="flex items-center gap-2.5">
                <Icon name="phone" className="h-4 w-4 text-gold-300" /> 1800-345-NER (24 × 7)
              </p>
              <p className="flex items-center gap-2.5">
                <Icon name="mic" className="h-4 w-4 text-gold-300" /> Ask the in-app voice assistant
              </p>
            </div>
            <Link
              href="/assistant"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
            >
              <Icon name="sparkles" className="h-4 w-4" />
              Open the assistant
            </Link>
          </div>
          <div className="rounded-3xl border border-forest-950/8 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink-900">Offline tips</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                  <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
                </span>
                Open a page once on wifi — it stays available offline afterwards.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                  <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
                </span>
                Turn on low-bandwidth mode in Settings on 2G/edge connectivity.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                  <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
                </span>
                Queued photos analyse automatically when you reconnect.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
