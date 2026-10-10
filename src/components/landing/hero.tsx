import Link from "next/link";
import { DistrictPicker } from "@/components/landing/district-picker";
import { Icon, type IconName } from "@/components/icons";

export function AlertStrip() {
  return (
    <div className="border-b border-gold-600/20 bg-gold-100 text-gold-800">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-500 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-500" />
          </span>
          <Icon name="radio" className="h-4 w-4 text-gold-700" />
        </span>
        <p className="truncate text-[13px] font-medium">
          <span className="font-bold">Flash flood watch</span> · Kamrup Metro,
          Assam — valid till 18:00 IST today
        </p>
        <Link
          href="/alerts"
          className="ml-auto hidden shrink-0 text-[13px] font-semibold underline underline-offset-2 transition hover:text-gold-700 sm:block"
        >
          Enable alerts →
        </Link>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-forest-950 text-sand-50">
      {/* Decorative backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-[-8%] h-[440px] w-[440px] rounded-full bg-forest-600/30 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[-10%] h-[400px] w-[400px] rounded-full bg-gold-500/10 blur-3xl" />
        <svg
          className="absolute right-[-6%] bottom-[-10%] h-[520px] w-[520px] text-forest-300/10"
          viewBox="0 0 400 400"
          fill="none"
        >
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="170" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="200" cy="200" r="220" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="80" cy="340" r="60" stroke="currentColor" strokeWidth="0.75" />
        </svg>
        <svg
          className="absolute top-10 left-[3%] hidden h-40 w-72 text-forest-300/10 lg:block"
          viewBox="0 0 200 80"
          fill="none"
        >
          <path d="M10 70 C40 20 90 0 190 10" stroke="currentColor" strokeWidth="1" />
          <path d="M10 78 C50 40 100 25 190 30" stroke="currentColor" strokeWidth="0.75" />
        </svg>
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:pt-24 lg:pb-28">
        {/* Left: copy + picker */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gold-300">
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Powered by GPT-4o mini intelligence
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-sand-50 sm:text-5xl lg:text-[3.4rem]">
            Agriculture, climate &amp; supply-chain intelligence for{" "}
            <span className="text-gold-400">North-East India</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-forest-100/85 sm:text-lg">
            Hyper-local weather alerts, instant AI crop diagnosis, cold-chain
            logistics across hill terrain, and direct fair-trade — built for the
            8 NER states, in your language, on any phone.
          </p>

          <div className="mt-8">
            <DistrictPicker dark />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-medium text-forest-100/80">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="check" className="h-4 w-4 text-gold-400" strokeWidth={2.4} />
              8 states · district-level
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="check" className="h-4 w-4 text-gold-400" strokeWidth={2.4} />
              Works on 2G · offline-first
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="mic" className="h-4 w-4 text-gold-400" strokeWidth={2.4} />
              Voice + 6 languages
            </span>
          </div>
        </div>

        {/* Right: app preview */}
        <div className="relative hidden md:block" aria-hidden="true">
          <div className="relative mx-auto max-w-md">
            {/* Weather card */}
            <div className="animate-float-slow rounded-3xl border border-white/10 bg-forest-900/80 p-5 shadow-2xl shadow-forest-950/50 backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-forest-300 uppercase">
                    Today · Jorhat, Assam
                  </p>
                  <p className="mt-1 font-display text-5xl font-semibold text-sand-50">
                    24<span className="text-2xl">°C</span>
                  </p>
                  <p className="mt-1 text-sm text-forest-100/80">
                    Light rain in ~3h · humidity 84%
                  </p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/15 text-gold-300">
                  <Icon name="cloudRain" className="h-7 w-7" />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {(
                  [
                    { day: "Mon", temp: "29", icon: "sun" },
                    { day: "Tue", temp: "27", icon: "drop" },
                    { day: "Wed", temp: "26", icon: "cloudRain" },
                    { day: "Thu", temp: "24", icon: "sun" },
                  ] as { day: string; temp: string; icon: IconName }[]
                ).map((d) => (
                  <div
                    key={d.day}
                    className="flex flex-col items-center gap-1 rounded-xl bg-white/5 py-2"
                  >
                    <span className="text-[11px] text-forest-100/70">{d.day}</span>
                    <span className="text-sm font-semibold">{d.temp}°</span>
                    <Icon name={d.icon} className="h-4 w-4 text-gold-300/80" />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating alert chip */}
            <div className="animate-float-slower absolute -top-5 -right-4 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-clay-500/90 px-4 py-3 shadow-xl">
              <Icon name="route" className="h-5 w-5 text-white" />
              <div>
                <p className="text-xs font-semibold text-white">Landslide watch</p>
                <p className="text-[11px] text-white/80">NH-37 · reroute +32 min</p>
              </div>
            </div>

            {/* Floating price chip */}
            <div className="animate-float-slow absolute -bottom-6 -left-5 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-gold-400 px-4 py-3 shadow-xl">
              <Icon name="coin" className="h-5 w-5 text-forest-950" />
              <div>
                <p className="text-xs font-semibold text-forest-950">
                  Lakadong Turmeric
                </p>
                <p className="text-[11px] font-medium text-forest-900/80">
                  ₹620/kg · +3.1% vs mandi
                </p>
              </div>
            </div>

            {/* Diagnosis mini card */}
            <div className="absolute right-6 -bottom-14 w-52 rounded-2xl border border-white/10 bg-forest-900/90 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                  <Icon name="scanPlus" className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-forest-600 px-2.5 py-1 text-[10px] font-bold text-white">
                  GPT-4o mini
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-sand-50">Leaf blight</p>
              <p className="text-[11px] text-forest-100/70">
                King chilli · 92% confidence
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gold-300">
                  Organic remedy
                </span>
                <Icon name="arrowRight" className="h-3.5 w-3.5 text-gold-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom curve into next section */}
      <div className="relative h-6 bg-gradient-to-b from-transparent to-sand-50/0" />
    </section>
  );
}