import Link from "next/link";
import { Icon } from "@/components/icons";

export const metadata = {
  title: "Access denied",
};

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-500/10 text-clay-500">
        <Icon name="shield" className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">
        You don&apos;t have access to this page
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        This area is restricted to a different role. If you think this is a
        mistake, contact your administrator.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-800 px-6 text-sm font-bold text-sand-50 shadow-lg shadow-forest-950/10 transition hover:bg-forest-700"
      >
        Back to dashboard
        <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
      </Link>
    </div>
  );
}
