import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Eyebrow } from "@/components/ui/primitives";
import { CTAInner } from "@/components/public/cta";
import { CROPS } from "@/lib/data";

export const metadata: Metadata = { title: "NER crop registry" };

export default function CropsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest-950 text-sand-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_75%_0%,rgba(237,168,68,0.14),transparent_60%)]"
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Eyebrow dark>Specialty registry</Eyebrow>
          <h1 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Crops the rest of India never tastes
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-forest-100/85 sm:text-lg">
            The north-east grows the world’s hottest chilli, the world’s most
            curcumin-rich turmeric, and GI-tagged rice and pineapple most
            markets have never seen. AgriChain gives each crop its own disease
            model, price track and cold-chain setting.
          </p>
        </div>
      </section>

      <section className="bg-sand-50 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {CROPS.map((c) => (
            <div
              key={c.id}
              className="group overflow-hidden rounded-2xl border border-forest-950/8 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br ${c.grad} p-4`}
              >
                <span className="pointer-events-none absolute -right-2 -top-6 font-display text-[110px] leading-none font-bold text-white/40 select-none">
                  {c.name.charAt(0)}
                </span>
                <span
                  className={`rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold ${c.accent}`}
                >
                  GI-tagged region
                </span>
              </div>
              <div className="p-5">
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  {c.name}
                </h2>
                <p className={`text-[13px] font-semibold ${c.accent}`}>{c.local}</p>
                <p className="mt-2 text-[13px] font-medium text-forest-700">
                  {c.region}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  {c.fact}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl px-4 text-center text-sm leading-relaxed text-ink-500">
          The demo registry carries <strong>12 crops</strong> once the diagnosis
          model is wired in — each with its own set of known pests, diseases and
          organic remedies in GPT-4o mini’s system prompt.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/diagnose"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-forest-800 px-7 text-sm font-bold text-sand-50 shadow-sm transition hover:bg-forest-700"
          >
            See AI diagnosis in action
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-sand-50 px-4 pb-20 sm:px-6 lg:px-8">
        <CTAInner />
      </section>
    </>
  );
}