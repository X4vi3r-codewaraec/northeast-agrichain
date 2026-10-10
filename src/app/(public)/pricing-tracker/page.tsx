import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Eyebrow } from "@/components/ui/primitives";
import { CTAInner } from "@/components/public/cta";
import { TICKER } from "@/lib/data";

export const metadata: Metadata = { title: "Price tracker" };

export default function PricingTrackerPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest-950 text-sand-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(237,168,68,0.14),transparent_60%)]"
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Eyebrow dark>Public price snapshot</Eyebrow>
          <h1 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            What NER produce fetches today
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-forest-100/85 sm:text-lg">
            In the full platform these figures stream live from APMC mandis,
            eNAM and the platform’s own trades. This demo snapshot shows the
            layout of the real pricing module.
          </p>
        </div>
      </section>

      <section className="bg-sand-50 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-forest-950/8 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-forest-950/8 bg-forest-50 text-xs tracking-widest uppercase">
                    <th className="px-6 py-4 font-semibold text-forest-700">Crop</th>
                    <th className="px-6 py-4 font-semibold text-forest-700">
                      Demo modal price
                    </th>
                    <th className="px-6 py-4 font-semibold text-forest-700">
                      7-day trend
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {TICKER.map((t) => (
                    <tr
                      key={t.crop}
                      className="border-b border-forest-950/5 last:border-0 hover:bg-sand-50"
                    >
                      <td className="px-6 py-4 font-semibold text-ink-900">
                        {t.crop}
                      </td>
                      <td className="px-6 py-4 font-medium text-ink-700">
                        {t.price}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            t.up
                              ? "bg-forest-600/10 text-forest-700"
                              : "bg-clay-100 text-clay-600"
                          }`}
                        >
                          {t.up ? "▲" : "▼"} {t.change}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href="/prices"
                          aria-label={`Price history for ${t.crop}`}
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-forest-600/20 px-3.5 text-xs font-semibold text-forest-700 transition hover:bg-forest-50"
                        >
                          History <Icon name="arrowRight" className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-forest-950/8 bg-sand-50 px-6 py-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="chart" className="h-4 w-4 text-forest-600" />
                Sources: APMC mandis · eNAM · platform trades
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="h-4 w-4 text-forest-600" />
                Refreshes every 30 minutes in the live build
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "chart" as const,
                title: "Trend vs mandi",
                desc: "Compare your local mandi against national eNAM every 30 min.",
              },
              {
                icon: "shield" as const,
                title: "Sell-window alert",
                desc: "Get told when holding or selling now is the smarter move.",
              },
              {
                icon: "coin" as const,
                title: "Fair floor prices",
                desc: "List with your floor price — escrow guarantees settlement.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-forest-950/8 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-800 text-gold-400">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-[17px] font-semibold text-ink-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand-50 px-4 pb-20 sm:px-6 lg:px-8">
        <CTAInner />
      </section>
    </>
  );
}