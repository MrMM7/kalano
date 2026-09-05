export function ProductCardSkeleton() {
  return (
    <div
      data-testid="product-card-skeleton"
      className="flex flex-col rounded-xl border border-border bg-card p-4 animate-pulse"
      aria-hidden="true"
    >
      <div className="aspect-square w-full rounded-lg bg-muted/60" />
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <div className="h-3 w-1/4 rounded bg-muted/60" />
          <div className="h-4 w-5/6 rounded bg-muted/60" />
          <div className="h-4 w-3/5 rounded bg-muted/60" />
        </div>
        <div className="mt-4 pt-2 border-t border-border/50 flex items-center justify-between">
          <div className="h-5 w-20 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
