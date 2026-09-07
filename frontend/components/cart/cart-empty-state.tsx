"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingCart, ArrowRight } from "lucide-react";

export function CartEmptyState() {
  return (
    <div
      data-testid="cart-empty-state"
      className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-xl mx-auto my-12"
    >
      <div className="rounded-full bg-muted/60 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <ShoppingCart
          className="h-8 w-8 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Your cart is empty
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Looks like you haven&apos;t added any items to your shopping cart yet.
        Explore our marketplace catalog to find what you need!
      </p>

      <div className="mt-6">
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <span>Browse Products</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
