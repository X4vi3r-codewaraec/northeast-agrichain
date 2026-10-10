import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { CheckItem, Eyebrow } from "@/components/ui/primitives";
import { CTAInner } from "@/components/public/cta";
import { MODULES } from "@/lib/data";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest-950 text-sand-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_10%,rgba(237,168,68,0.14),transparent_60%)]"
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Eyebrow dark>Platform tour</Eyebrow>
          <h1 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Four modules, one climate-first chain
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-forest-100/85 sm:text-lg">
            Every module shares the same district map, farm registry and AI
            brain — so a diagnosis in Meghalaya instantly improves the logistics
            and credit picture in Shillong.
          </p>
        </div>
      </section>

      {MODULES.map((m, idx) => (
        <section
          key={m.id}
          id={m.id}
          className={`scroll-mt-20 py-16 sm:py-20 ${
            idx % 2 === 0 ? "bg-sand-50" : "bg-white"
          }`}
        >
          <div
            className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"
          >
            <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-800 text-gold-400 shadow-sm">
                <Icon name={m.icon} className="h-7 w-7" />
              </span>
              <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-forest-600 uppercase">
                Module 0{idx + 1}
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900">
                {m.title}
              </h2>
              <p className="mt-3 text-lg font-medium text-gold-700">{m.tagline}</p>
              <ul className="mt-6 space-y-3">
                {m.points.map((p) => (
                  <CheckItem key={p}>{p}</CheckItem>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-forest-800 px-7 text-sm font-bold text-sand-50 shadow-sm transition hover:bg-forest-700"
              >
                Try module {idx + 1} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
            <div className={idx % 2 === 1 ? "lg:order-1" : ""}>
              <div className="rounded-3xl border border-forest-950/8 bg-sand-50 p-6 shadow-inner">
                <p className="text-xs font-semibold tracking-widest text-ink-300 uppercase">
                  What you get on day one
                </p>
                <ul className="mt-4 space-y-3">
                  {(m.id === "climate"
                    ? [
                        "7-day microclimate forecast, mapped to your block",
                        "Flash-flood, landslide, cloudburst & frost alerts",
                        "Sowing + harvesting calendar with ITK wisdom",
                      ]
                    : m.id === "ai-crop"
                      ? [
                          "Photo diagnosis for high-value NER crops",
                          "Organic remedy + chemical dosage, in your language",
                          "Soil health card → nutrient advisory in minutes",
                        ]
                      : m.id === "logistics"
                        ? [
                            "Cold storage with live capacity & price",
                            "Elevation-aware routes with road closure flags",
                            "Pooled loads across nearby farms",
                          ]
                        : [
                            "Direct B2B listings with trace-to-farm",
                            "Mandi vs eNAM price comparison",
                            "Credit score + escrow-backed settlement",
                          ]).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-600/10 text-forest-700">
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </span>
                      <span className="text-sm leading-relaxed text-ink-700">{item}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3 rounded-xl bg-gold-50 px-3 py-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
                      <Icon name="sparkles" className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="text-sm leading-relaxed text-gold-800">
                      Narrated by <strong>GPT-4o mini</strong> in 6 languages, with
                      voice playback.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-sand-50 px-4 pb-20 sm:px-6 lg:px-8">
        <CTAInner />
      </section>
    </>
  );
}