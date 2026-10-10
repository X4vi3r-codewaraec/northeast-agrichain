"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { useSpeech } from "@/hooks/use-speech";
import { clearSession, getSession, type Session } from "@/lib/auth-client";
import { ROLES } from "@/lib/data";
import { dashboardSummary } from "@/lib/dashboard";

const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function roleLabel(role: Session["role"]) {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}

export function DashboardShell() {
  const router = useRouter();
  const mounted = useMounted();
  const { speak, stop, speaking } = useSpeech();
  const session: Session | null = mounted ? getSession() : null;

  const summary = useMemo(
    () => (session ? dashboardSummary(session.role, session.district, session.name) : null),
    [session],
  );

  if (!mounted) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center px-4">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest-600/30 border-t-forest-700" />
      </div>
    );
  }

  if (!session || !summary) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="text-ink-500">You are signed out.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-forest-800 px-6 text-sm font-semibold text-sand-50"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const advisoryText = `${summary.greeting}. ${summary.advisory.join(" ")}`;

  return (
    <div className="bg-sand-50">
      <div className="border-b border-forest-950/6 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-800 font-display text-2xl font-semibold text-gold-300">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gold-700">
                  {roleLabel(session.role)}
                </p>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                  {summary.greeting}
                </h1>
                <p className="mt-0.5 text-sm text-ink-500">
                  {session.district}, {session.state} · {session.lang}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-600/25 px-5 text-sm font-semibold text-forest-700 transition hover:bg-forest-50"
              >
                <Icon name="globe" className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  router.push("/");
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-forest-600/25 px-5 text-sm font-semibold text-forest-700 transition hover:bg-forest-50"
              >
                <Icon name="x" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.kpis.map((k) => (
            <Link
              key={k.label}
              href={k.href}
              className="group rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm transition hover:border-forest-600/25 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                  <Icon name={k.icon} className="h-5 w-5" />
                </span>
                <Icon
                  name="arrowRight"
                  className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-forest-600"
                />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-ink-900">{k.value}</p>
              <p className="text-sm font-semibold text-ink-700">{k.label}</p>
              <p className="text-xs text-ink-400">{k.sub}</p>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Quick actions</p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {summary.quickActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-forest-800 shadow-sm ring-1 ring-forest-950/8 transition hover:bg-forest-50"
              >
                <Icon name={a.icon} className="h-4 w-4" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Advisory */}
          <div className="rounded-3xl bg-forest-900 p-6 text-sand-50 shadow-lg sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{summary.advisoryTitle}</h2>
              <button
                onClick={() => (speaking ? stop() : speak(advisoryText))}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3.5 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <Icon name="mic" className="h-3.5 w-3.5" />
                {speaking ? "Stop" : "Listen"}
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {summary.advisory.map((a) => (
                <li key={a} className="flex items-start gap-3 text-sm leading-relaxed text-forest-100/90">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-300">
                    <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/weather"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-500 px-4 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                <Icon name="cloudRain" className="h-4 w-4" />
                Full forecast
              </Link>
              <Link
                href="/assistant"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <Icon name="sparkles" className="h-4 w-4" />
                Ask the assistant
              </Link>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-3xl border border-forest-950/8 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-semibold text-ink-900">Recent activity</h2>
            <ul className="mt-4 space-y-3.5">
              {summary.activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />
                  <div>
                    <p className="text-sm text-ink-700">{a.text}</p>
                    <p className="text-[11px] text-ink-400">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Module shortcuts */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/weather", label: "Weather & climate", icon: "cloudRain" as const },
            { href: "/soil", label: "Soil & nutrients", icon: "seedling" as const },
            { href: "/yield", label: "Yield forecast", icon: "chart" as const },
            { href: "/insurance", label: "Index insurance", icon: "shield" as const },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-2xl border border-forest-950/8 bg-white px-4 py-3.5 shadow-sm transition hover:border-forest-600/25 hover:bg-forest-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                <Icon name={m.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ink-900">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
