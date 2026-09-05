export function CartSkeleton() {
  return (
    <div
      data-testid="cart-skeleton"
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-pulse"
    >
      {/* Left Column: Items Skeleton */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="divide-y divide-border/60">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-muted rounded-lg shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-muted rounded-lg" />
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Order Summary Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="h-6 w-36 bg-muted rounded" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
        <div className="h-10 w-full bg-muted rounded-lg" />
      </div>
    </div>
  );
}
