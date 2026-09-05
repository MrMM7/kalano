import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OrdersEmptyState() {
  return (
    <div
      data-testid="orders-empty-state"
      className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-xl mx-auto my-8 shadow-sm"
    >
      <div className="rounded-full bg-muted/70 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        You haven't placed any orders yet
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        When you make purchases, your order history, delivery statuses, and
        tracking details will appear here.
      </p>
      <div className="mt-6">
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <span>Explore Products</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
