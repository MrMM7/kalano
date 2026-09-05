import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CheckoutSkeleton() {
  return (
    <div
      data-testid="checkout-skeleton"
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-pulse"
    >
      {/* Left Form Column Skeleton */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="rounded-2xl border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="h-6 w-44 bg-muted rounded-md" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-24 w-full bg-muted rounded-lg" />
            <div className="h-4 w-72 bg-muted rounded" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="h-6 w-36 bg-muted rounded-md" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-16 w-full bg-muted rounded-xl" />
            <div className="h-28 w-full bg-muted rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Right Order Summary Skeleton */}
      <div className="lg:col-span-1">
        <Card className="rounded-2xl border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="h-6 w-32 bg-muted rounded-md" />
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="h-12 w-full bg-muted rounded-lg" />
              <div className="h-12 w-full bg-muted rounded-lg" />
            </div>
            <div className="space-y-2 pt-4 border-t border-border/40">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-10 bg-muted rounded" />
              </div>
              <div className="flex justify-between pt-2">
                <div className="h-6 w-16 bg-muted rounded" />
                <div className="h-6 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-11 w-full bg-muted rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
