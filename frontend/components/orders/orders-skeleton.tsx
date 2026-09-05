export function OrdersSkeleton() {
  return (
    <div data-testid="orders-skeleton" className="space-y-4" aria-busy="true" aria-label="Loading orders">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm animate-pulse space-y-4"
        >
          {/* Header row skeleton */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 bg-muted rounded-md" />
              <div className="h-4 w-32 bg-muted/60 rounded-md" />
            </div>
            <div className="h-6 w-24 bg-muted rounded-full" />
          </div>

          {/* Body row skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="h-20 w-20 bg-muted rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-3/4 bg-muted rounded-md" />
              <div className="h-4 w-1/3 bg-muted/60 rounded-md" />
              <div className="h-4 w-1/4 bg-muted/60 rounded-md" />
            </div>
            <div className="sm:text-right space-y-1 shrink-0">
              <div className="h-6 w-20 bg-muted rounded-md sm:ml-auto" />
              <div className="h-4 w-16 bg-muted/60 rounded-md sm:ml-auto" />
            </div>
          </div>

          {/* Footer address skeleton */}
          <div className="border-t border-border/40 pt-3 flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded-full shrink-0" />
            <div className="h-4 w-1/2 bg-muted/60 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
