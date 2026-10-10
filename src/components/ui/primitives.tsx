import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

export function Eyebrow({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
        dark
          ? "border-gold-400/30 bg-gold-400/10 text-gold-300"
          : "border-forest-600/20 bg-forest-600/5 text-forest-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div
      className={`max-w-2xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      }`}
    >
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl ${
          dark ? "text-sand-50" : "text-ink-900"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            dark ? "text-forest-100/80" : "text-ink-500"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Pill({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        dark
          ? "bg-white/10 text-forest-100 ring-1 ring-white/20"
          : "bg-forest-50 text-forest-700 ring-1 ring-forest-600/10"
      }`}
    >
      {children}
    </span>
  );
}

export function CheckItem({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          dark ? "bg-gold-400/20 text-gold-300" : "bg-forest-600/10 text-forest-700"
        }`}
      >
        <Icon name="check" className="h-3 w-3" strokeWidth={2.4} />
      </span>
      <span className={dark ? "text-forest-100/90" : "text-ink-700"}>
        {children}
      </span>
    </li>
  );
}