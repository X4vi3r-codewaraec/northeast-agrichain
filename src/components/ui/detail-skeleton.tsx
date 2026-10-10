/** Neutral loading shell for dynamic detail pages. Kept as a server-renderable
 *  skeleton so the static shell paints instantly while id-dependent content
 *  streams in behind a `<Suspense>` boundary. */
export function DetailSkeleton() {
  return (
    <div className="bg-sand-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-36 animate-pulse rounded-full bg-forest-950/10" />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-forest-950/10" />
          <div className="space-y-2">
            <div className="h-6 w-56 animate-pulse rounded-full bg-forest-950/10" />
            <div className="h-3 w-32 animate-pulse rounded-full bg-forest-950/8" />
          </div>
        </div>
        <div className="mt-6 h-64 w-full animate-pulse rounded-3xl bg-forest-950/5" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-3xl bg-forest-950/5" />
          <div className="h-32 animate-pulse rounded-3xl bg-forest-950/5" />
        </div>
      </div>
    </div>
  );
}
