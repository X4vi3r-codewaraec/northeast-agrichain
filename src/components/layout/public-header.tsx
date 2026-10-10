"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { LANGUAGES } from "@/lib/data";
import { setLanguage, useLanguage } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/crops", label: "Crops" },
  { href: "/prices", label: "Prices" },
  { href: "/weather", label: "Weather" },
  { href: "/alerts", label: "Alerts" },
  { href: "/marketplace", label: "Market" },
  { href: "/insurance", label: "Insurance" },
  { href: "/assistant", label: "Assistant" },
];

export function LanguageSelect({ menuId = "lang-select" }: { menuId?: string }) {
  const lang = useLanguage();
  return (
    <div className="relative">
      <label htmlFor={menuId} className="sr-only">
        Choose language
      </label>
      <select
        id={menuId}
        value={lang}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Choose language"
        className="h-10 appearance-none rounded-full border border-forest-600/20 bg-white pr-8 pl-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-500">
        <Icon name="chevronDown" className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const lang = useLanguage();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-900 transition hover:bg-forest-950/5 lg:hidden"
      >
        <Icon name="menu" className="h-6 w-6" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-sand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-forest-950/10 px-5 py-4">
              <span className="font-display text-lg font-semibold text-ink-900">
                Northeast AgriChain
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-900 transition hover:bg-forest-950/5"
              >
                <Icon name="x" className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-ink-700 transition hover:bg-forest-100/70 hover:text-ink-900"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-forest-950/10 px-4 pt-4">
                <p className="mb-2 text-xs font-semibold tracking-widest text-ink-500 uppercase">
                  Language
                </p>
                <select
                  value={lang}
                  onChange={(e) => setLanguage(e.target.value)}
                  aria-label="Choose language"
                  className="h-12 w-full appearance-none rounded-xl border border-forest-600/20 bg-white px-4 text-sm font-medium text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/30"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-ink-500">
                  Interface and voice prompts follow this choice.
                </p>
              </div>
            </nav>
            <div className="grid grid-cols-2 gap-2 border-t border-forest-950/10 p-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-full border border-forest-600/25 px-4 text-sm font-semibold text-forest-700 transition hover:bg-forest-50"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-full bg-forest-800 px-4 text-sm font-semibold text-sand-50 shadow-sm transition hover:bg-forest-700"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LogoLockup() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-800 text-gold-400">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M19.5 4.5C11 5 5.5 9.3 5.5 15.8c0 1.6.2 2.9.7 4.2C10 18.4 14.2 13.6 18.5 9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 20.5C7 17 11.4 12.7 15.5 10"
            stroke="#8cc49c"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-[17px] leading-none font-semibold tracking-tight text-ink-900">
        Northeast
        <span className="block text-[12px] font-medium tracking-[0.18em] text-forest-600 uppercase">
          AgriChain
        </span>
      </span>
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-forest-950/5 bg-sand-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Northeast AgriChain home">
          <LogoLockup />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-forest-100/70 hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSelect />
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-forest-800 transition hover:bg-forest-100/70"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-forest-800 px-4 text-sm font-semibold text-sand-50 shadow-sm transition hover:bg-forest-700"
          >
            Get started
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}