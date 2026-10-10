import Link from "next/link";
import { Icon } from "@/components/icons";

const MODULE_LINKS = [
  { href: "/weather", label: "Climate & Weather" },
  { href: "/alerts", label: "Early-Warning Board" },
  { href: "/diagnose", label: "AI Crop Diagnosis" },
  { href: "/soil", label: "Soil & Nutrients" },
  { href: "/yield", label: "Yield Forecast" },
  { href: "/map", label: "Storage & Logistics" },
  { href: "/shipments", label: "Shipments & Pooling" },
  { href: "/marketplace", label: "B2B Marketplace" },
  { href: "/insurance", label: "Weather-index Insurance" },
  { href: "/credit", label: "Credit Readiness" },
  { href: "/prices", label: "Price Intelligence" },
];

const PLATFORM_LINKS = [
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Create account" },
  { href: "/assistant", label: "Voice assistant" },
  { href: "/help", label: "Help & support" },
  { href: "/admin", label: "Government portal" },
  { href: "/settings", label: "Settings" },
];

const DATA_LINKS = [
  { href: "/crops", label: "NER crop registry" },
  { href: "/pricing-tracker", label: "Public price tracker" },
  { href: "/features", label: "Feature overview" },
];

export function Footer() {
  return (
    <footer className="border-t border-forest-950/10 bg-forest-950 text-forest-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-400">
                <Icon name="leaf" className="h-5 w-5" />
              </span>
              <span className="font-display text-lg leading-none font-semibold text-sand-50">
                Northeast
                <span className="block text-xs font-medium tracking-[0.18em] text-forest-300 uppercase">
                  AgriChain
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-forest-100/75">
              Agriculture, climate & supply-chain intelligence for the eight
              north-eastern states of India. Built for smallholder farmers,
              honest middlemen removal, and climate-first thinking.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
              </span>
              <span className="text-xs font-medium tracking-wide text-gold-200">
                Live — Assam, Meghalaya, Tripura districts above
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-forest-300 uppercase">
                Modules
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {MODULE_LINKS.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-forest-100/80 transition hover:text-gold-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-forest-300 uppercase">
                Platform
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PLATFORM_LINKS.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-forest-100/80 transition hover:text-gold-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-forest-300 uppercase">
                Explore
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {DATA_LINKS.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-forest-100/80 transition hover:text-gold-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-forest-100/60">
            Data partners: IMD · Open-Meteo · eNAM · Organic Mission NE · OpenStreetMap
          </p>
          <p className="text-xs text-forest-100/60">
            © 2026 Northeast AgriChain — demo build for the NER agri hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}