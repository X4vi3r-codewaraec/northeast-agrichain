"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/icons";
import { LANGUAGES, ROLES } from "@/lib/data";
import {
  clearSession,
  reconcileSession,
  roleHome,
  useSession,
  type Session,
} from "@/lib/auth-client";
import { setLanguage, t, useLanguage } from "@/lib/i18n";

type NavItem = { href: string; key: string };

/** Links always visible in the desktop bar. */
const PRIMARY_LINKS: NavItem[] = [
  { href: "/features", key: "nav.features" },
  { href: "/crops", key: "nav.crops" },
  { href: "/prices", key: "nav.prices" },
  { href: "/weather", key: "nav.weather" },
  { href: "/marketplace", key: "nav.market" },
];

/** Links tucked into the "More" dropdown (keeps the bar from overflowing). */
const MORE_LINKS: (NavItem & { icon: IconName })[] = [
  { href: "/diagnose", key: "nav.diagnose", icon: "scanPlus" },
  { href: "/alerts", key: "nav.alerts", icon: "radio" },
  { href: "/insurance", key: "nav.insurance", icon: "shield" },
  { href: "/assistant", key: "nav.assistant", icon: "sparkles" },
];

const ALL_LINKS: NavItem[] = [...PRIMARY_LINKS, ...MORE_LINKS];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const emptySubscribe = () => () => {};

/** True only after hydration — portals can't run during SSR. */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** Close a popover on Escape or a click/tap outside of `ref`. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);
  return ref;
}

const MENU_ITEM_BASE =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition";

const TOP_LINK = "rounded-full px-3.5 py-2 text-sm font-medium transition";
const TOP_LINK_IDLE = "text-ink-700 hover:bg-forest-100/70 hover:text-ink-900";
const TOP_LINK_ACTIVE = "bg-forest-100/80 text-ink-900";

export function LanguageSelect() {
  const lang = useLanguage();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.name}`}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-600/20 bg-white px-3.5 text-sm font-medium text-ink-900 transition hover:border-forest-600/40 hover:bg-forest-50/70"
      >
        <Icon name="globe" className="h-4 w-4 shrink-0 text-forest-600" />
        <span className="max-w-[7.5rem] truncate">{current.name}</span>
        <Icon
          name="chevronDown"
          className={`h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Choose language"
          className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-forest-950/10 bg-white p-1.5 shadow-xl shadow-forest-950/10"
        >
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLanguage(l.code);
                  close();
                }}
                className={`${MENU_ITEM_BASE} justify-between text-left ${
                  active
                    ? "bg-forest-50 font-semibold text-forest-800"
                    : "text-ink-700 hover:bg-sand-100"
                }`}
              >
                <span>{l.name}</span>
                {active ? (
                  <Icon name="check" className="h-4 w-4 shrink-0 text-forest-600" strokeWidth={2.4} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MoreMenu({ pathname }: { pathname: string | null }) {
  const lang = useLanguage();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const active = MORE_LINKS.some((l) => isActive(pathname, l.href));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${TOP_LINK} inline-flex h-10 items-center gap-1 ${
          open || active ? TOP_LINK_ACTIVE : TOP_LINK_IDLE
        }`}
      >
        {t("nav.more", lang)}
        <Icon
          name="chevronDown"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-forest-950/10 bg-white p-1.5 shadow-xl shadow-forest-950/10"
        >
          {MORE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={close}
              aria-current={isActive(pathname, l.href) ? "page" : undefined}
              className={`${MENU_ITEM_BASE} text-ink-700 hover:bg-sand-100 hover:text-ink-900`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
                <Icon name={l.icon} className="h-4 w-4" />
              </span>
              {t(l.key, lang)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function roleLabel(role: Session["role"]): string {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}

/** Reconcile the localStorage session mirror with the server once per mount. */
function SessionSync() {
  useEffect(() => {
    void reconcileSession();
  }, []);
  return null;
}

function UserMenu({ session }: { session: Session }) {
  const lang = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  const home = roleHome(session.role);
  const initial = session.name.trim().slice(0, 1).toUpperCase() || "U";
  const firstName = session.name.trim().split(/\s+/)[0] || session.name;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${session.name}`}
        className={`inline-flex h-10 items-center gap-2 rounded-full border border-forest-600/20 bg-white pr-2.5 pl-1.5 text-sm font-semibold text-ink-900 transition hover:border-forest-600/40 hover:bg-forest-50/70 ${
          open ? "ring-2 ring-forest-600/15" : ""
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-800 text-xs font-bold text-gold-300">
          {initial}
        </span>
        <span className="max-w-[8rem] truncate">{firstName}</span>
        <Icon
          name="chevronDown"
          className={`h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-forest-950/10 bg-white p-1.5 shadow-xl shadow-forest-950/10"
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-sm font-semibold text-gold-300">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900">{session.name}</p>
              <p className="truncate text-xs text-ink-500">
                {roleLabel(session.role)} · {session.district}, {session.state}
              </p>
            </div>
          </div>
          <div className="my-1 h-px bg-forest-950/8" />
          <Link
            href={home}
            role="menuitem"
            onClick={close}
            className={`${MENU_ITEM_BASE} text-ink-700 hover:bg-sand-100 hover:text-ink-900`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
              <Icon name="chart" className="h-4 w-4" />
            </span>
            {t("nav.dashboard", lang)}
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={close}
            className={`${MENU_ITEM_BASE} text-ink-700 hover:bg-sand-100 hover:text-ink-900`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
              <Icon name="globe" className="h-4 w-4" />
            </span>
            {t("settings.title", lang)}
          </Link>
          <div className="my-1 h-px bg-forest-950/8" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              clearSession();
              router.push("/");
              router.refresh();
            }}
            className={`${MENU_ITEM_BASE} text-clay-600 hover:bg-clay-100`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay-100 text-clay-600">
              <Icon name="x" className="h-4 w-4" />
            </span>
            {t("nav.signout", lang)}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Log in button when signed out; the account menu when signed in. */
export function AuthAction() {
  const lang = useLanguage();
  const session = useSession();

  if (session) return <UserMenu session={session} />;

  return (
    <Link
      href="/login"
      className="inline-flex h-10 items-center rounded-full bg-forest-800 px-4 text-sm font-semibold text-sand-50 shadow-sm transition hover:bg-forest-700"
    >
      {t("nav.login", lang)}
    </Link>
  );
}

function DesktopNav({ pathname }: { pathname: string | null }) {
  const lang = useLanguage();
  return (
    <>
      {PRIMARY_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`${TOP_LINK} ${active ? TOP_LINK_ACTIVE : TOP_LINK_IDLE}`}
          >
            {t(link.key, lang)}
          </Link>
        );
      })}
      <MoreMenu pathname={pathname} />
    </>
  );
}

function DesktopNavWithPath() {
  const pathname = usePathname();
  return <DesktopNav pathname={pathname} />;
}

function MobileNavPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const lang = useLanguage();
  const router = useRouter();
  const session = useSession();

  return (
    <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 cursor-default bg-forest-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-sand-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-forest-950/10 px-5 py-4">
          <span className="font-display text-lg font-semibold text-ink-900">
            Northeast AgriChain
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-900 transition hover:bg-forest-950/5"
          >
            <Icon name="x" className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4" aria-label="Main">
          {ALL_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-4 py-3 text-base font-medium transition ${
                  active
                    ? "bg-forest-100/80 text-ink-900"
                    : "text-ink-700 hover:bg-forest-100/70 hover:text-ink-900"
                }`}
              >
                {t(link.key, lang)}
              </Link>
            );
          })}

          <div className="mt-3 border-t border-forest-950/10 pt-4">
            <p className="mb-2.5 px-3 text-xs font-semibold tracking-widest text-ink-500 uppercase">
              {t("common.language", lang)}
            </p>
            <div className="flex flex-wrap gap-2 px-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  aria-pressed={l.code === lang}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    l.code === lang
                      ? "bg-forest-800 text-sand-50"
                      : "bg-white text-ink-700 ring-1 ring-forest-950/10 hover:bg-forest-50"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-forest-950/10 p-4">
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-lg font-semibold text-gold-300">
                  {session.name.trim().slice(0, 1).toUpperCase() || "U"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{session.name}</p>
                  <p className="truncate text-xs text-ink-500">
                    {roleLabel(session.role)} · {session.district}
                  </p>
                </div>
              </div>
              <Link
                href={roleHome(session.role)}
                onClick={onClose}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-semibold text-sand-50 shadow-sm transition hover:bg-forest-700"
              >
                <Icon name="chart" className="h-4 w-4" />
                {t("nav.dashboard", lang)}
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  clearSession();
                  router.push("/");
                  router.refresh();
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-forest-950/15 px-4 text-sm font-semibold text-clay-600 transition hover:bg-clay-100"
              >
                <Icon name="x" className="h-4 w-4" />
                {t("nav.signout", lang)}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-forest-800 px-4 text-sm font-semibold text-sand-50 shadow-sm transition hover:bg-forest-700"
            >
              {t("nav.login", lang)}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-900 transition hover:bg-forest-950/5"
      >
        <Icon name="menu" className="h-6 w-6" />
      </button>

      {mounted && open ? createPortal(<MobileNavPanel onClose={close} />, document.body) : null}
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
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Northeast AgriChain home" className="shrink-0">
          <LogoLockup />
        </Link>

        <nav className="ml-3 hidden items-center gap-0.5 xl:flex" aria-label="Main">
          <Suspense fallback={<DesktopNav pathname={null} />}>
            <DesktopNavWithPath />
          </Suspense>
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <LanguageSelect />
          <AuthAction />
        </div>

        <div className="ml-auto xl:hidden">
          <MobileNav />
        </div>
      </div>
      <SessionSync />
    </header>
  );
}
