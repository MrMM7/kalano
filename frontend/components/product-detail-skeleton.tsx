export function ProductDetailSkeleton() {
  return (
    <div
      data-testid="product-detail-skeleton"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse"
      aria-hidden="true"
    >
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 rounded bg-muted/60 mb-8" />

      {/* Main detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left column: image */}
        <div className="aspect-square w-full rounded-2xl bg-muted/60" />

        {/* Right column: metadata and purchasing card */}
        <div className="flex flex-col space-y-6">
          <div className="h-4 w-24 rounded bg-muted/60" />
          <div className="h-8 w-3/4 rounded bg-muted/60" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted/60" />
            <div className="h-4 w-5/6 rounded bg-muted/60" />
            <div className="h-4 w-2/3 rounded bg-muted/60" />
          </div>

          <div className="rounded-2xl border border-border p-6 space-y-4">
            <div className="h-4 w-28 rounded bg-muted/60" />
            <div className="h-10 w-36 rounded bg-muted/60" />
            <div className="h-4 w-48 rounded bg-muted/60" />
            <div className="h-10 w-full rounded bg-muted/60" />
          </div>
        </div>
      </div>

      {/* Offers table skeleton */}
      <div className="mt-16 space-y-4">
        <div className="h-6 w-40 rounded bg-muted/60" />
        <div className="h-36 w-full rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}
