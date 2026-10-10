import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import {
  CheckItem,
  Eyebrow,
  SectionHeading,
} from "@/components/ui/primitives";
import {
  CROPS,
  LANGUAGES,
  MODULES,
  PERSONAS,
  STATS,
  TICKER,
} from "@/lib/data";
import { CTAInner } from "@/components/public/cta";

export function PriceTicker() {
  return (
    <div
      className="relative border-y border-forest-950/10 bg-sand-100/70 py-2.5"
      aria-label="Live NER produce prices"
    >
      <div className="flex overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-10 pr-10 hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={`${t.crop}-${i}`} className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-ink-900">{t.crop}</span>
              <span className="text-sm font-medium text-ink-500">{t.price}</span>
              <span
                className={`text-[13px] font-bold ${
                  t.up ? "text-forest-600" : "text-clay-500"
                }`}
              >
                {t.up ? "▲" : "▼"} {t.change}
              </span>
              <span className="ml-6 h-1 w-1 rounded-full bg-forest-950/25" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsBand() {
  return (
    <section className="bg-forest-900 text-sand-50">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:grid-cols-5 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center">
            <span className="font-display text-4xl font-semibold text-gold-400">
              {s.value}
            </span>
            <span className="mt-1 text-sm font-semibold tracking-wide text-sand-50">
              {s.label}
            </span>
            <span className="mt-0.5 max-w-[160px] text-xs leading-relaxed text-forest-100/70">
              {s.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ModuleGrid() {
  return (
    <section id="modules" className="bg-sand-50 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Four engines, one platform"
          title={<>Everything a NER farm economy needs</>}
          description="Each module talks to the others — a diagnosis feeds storage needs, price trends feed credit scores, and weather feeds everything."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m, idx) => (
            <Link
              key={m.id}
              href={`/features#${m.id}`}
              className="group relative flex flex-col rounded-2xl border border-forest-950/8 bg-white p-6 shadow-sm shadow-forest-950/5 transition duration-200 hover:-translate-y-1 hover:border-forest-600/25 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-800 text-gold-400 shadow-sm transition group-hover:bg-forest-700">
                  <Icon name={m.icon} className="h-6 w-6" />
                </span>
                <span className="font-display text-sm font-semibold text-forest-950/25">
                  0{idx + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg leading-snug font-semibold text-ink-900">
                {m.title}
              </h3>
              <p className="mt-1.5 text-sm font-medium text-gold-700">
                {m.tagline}
              </p>
              <ul className="mt-4 space-y-2.5">
                {m.points.map((p) => (
                  <CheckItem key={p}>{p}</CheckItem>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-semibold text-forest-700 transition group-hover:gap-2.5 group-hover:text-forest-600">
                Learn more <Icon name="arrowRight" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CropShowcase() {
  return (
    <section id="crops" className="bg-forest-50 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The NER specialty crop registry"
          title={<>High-value crops, badly served. Until now.</>}
          description="Disease models, price intelligence and cold-chain setpoints tuned crop-by-crop for the north-east’s most precious produce."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CROPS.map((c) => (
            <div
              key={c.id}
              className="group relative overflow-hidden rounded-2xl border border-forest-950/8 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`relative flex h-32 items-end overflow-hidden bg-gradient-to-br ${c.grad} p-4`}
              >
                <span className="pointer-events-none absolute -right-2 -top-4 font-display text-[92px] leading-none font-bold text-white/40 select-none">
                  {c.name.charAt(0)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold ${c.accent}`}
                >
                  GI-tagged region
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-ink-900">
                  {c.name}
                </h3>
                <p className={`text-[13px] font-semibold ${c.accent}`}>
                  {c.local}
                </p>
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
        <div className="mt-10 text-center">
          <Link
            href="/crops"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-forest-600/25 px-6 text-sm font-semibold text-forest-700 transition hover:bg-white"
          >
            Browse the full registry <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps: {
    icon: IconName;
    title: string;
    desc: string;
  }[] = [
    {
      icon: "mapPin",
      title: "Pick your district, plant your farm",
      desc: "Tell us where you farm and what you grow. The entire platform — weather, disease models, prices — tunes itself to that polygon.",
    },
    {
      icon: "scanPlus",
      title: "Snap, listen, act",
      desc: "Photograph a damaged leaf for an instant GPT-4o mini diagnosis, or hear today’s sowing advisory spoken aloud in your language.",
    },
    {
      icon: "truck",
      title: "Store, ship & get paid",
      desc: "Find cold storage, pool your load with neighbours, list at a fair price — and settle payment through escrow, not middlemen.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-sand-50 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title={<>From a missed monsoon to a signed sale, in three steps</>}
          description="Designed for a 4-inch screen, a village network and a voice interface. No PDFs, no paperwork, no English required."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-forest-950/8 bg-white p-7 shadow-sm"
            >
              <span className="absolute top-6 right-6 font-display text-5xl font-bold text-forest-950/8">
                0{i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                <Icon name={s.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Personas() {
  return (
    <section id="personas" className="bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Who it’s for"
          title={<>Five roles. One shared map of the NER economy.</>}
          description="Every stakeholder in the chain — from a smallholder in Mokokchung to a government extension office in Shillong — sees the same ground truth."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-forest-950/8 bg-sand-50 p-6 transition hover:border-forest-600/25 hover:bg-forest-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-800 text-gold-400">
                <Icon name={p.icon} className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-forest-100 px-2.5 py-1 text-[11px] font-semibold text-forest-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VoiceBand() {
  return (
    <section className="relative overflow-hidden bg-forest-950 py-20 text-sand-50 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_20%,rgba(237,168,68,0.12),transparent_60%)]"
      />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Eyebrow dark>Built for every farmer</Eyebrow>
          <h2 className="mt-5 font-display text-3xl leading-tight font-semibold tracking-tight text-sand-50 sm:text-4xl">
            Most advisers write. This one speaks Assamese.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-forest-100/80 sm:text-lg">
            Voice-guided advisories, spoken alerts and an offline-first app that
            works when the network doesn’t. Our AI is tuned to reply in whatever
            language you chose at login — no literacy required.
          </p>
          <ul className="mt-7 space-y-3">
            <CheckItem dark>
              Spoken weather &amp; disease advisories via text-to-speech
            </CheckItem>
            <CheckItem dark>
              Offline-first PWA — syncs when the hills allow
            </CheckItem>
            <CheckItem dark>
              SMS + push alerts for floods, landslides and frost
            </CheckItem>
          </ul>
        </div>
        <div>
          <div className="mx-auto max-w-sm rounded-3xl border border-white/10 bg-forest-900/70 p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                <Icon name="sparkles" className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-sand-50">AgriChain Assistant</p>
              <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-forest-100/70">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-400" />
                listening…
              </span>
            </div>
            <div className="mt-5 rounded-2xl rounded-tl-md bg-white/8 p-4 text-sm leading-relaxed text-forest-100/90">
              “Bora khetit ki lagibo aji? (What should I do in my paddy field
              today?)”
            </div>
            <div className="mt-3 ml-6 rounded-2xl rounded-tr-md border border-white/10 bg-forest-800 p-4 text-sm leading-relaxed text-sand-50">
              Light rain in 3 hours. Delay spraying by 2 days. Consider transplanting
              Joha seedlings tomorrow morning. 🔊 Listening available.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <span
                  key={l.code}
                  className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-medium text-forest-100/85 ring-1 ring-white/15"
                >
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTABand() {
  return (
    <section className="bg-sand-50 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <CTAInner />
      </div>
    </section>
  );
}