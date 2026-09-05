"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShieldCheck, Truck, ArrowRight } from "lucide-react";

interface CartSummaryProps {
  totalPrice: number;
  totalItems: number;
  isEmpty?: boolean;
}

export function CartSummary({
  totalPrice,
  totalItems,
  isEmpty = false,
}: CartSummaryProps) {
  return (
    <div
      data-testid="cart-summary"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm sticky top-24 space-y-6"
    >
      <h2 className="text-xl font-bold text-foreground border-b border-border pb-4">
        Order Summary
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Items ({totalItems})</span>
          <span
            data-testid="cart-summary-subtotal"
            className="font-medium text-foreground"
          >
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Free
          </span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <span>Fulfilled & delivered via Kalano Logistics</span>
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-baseline">
          <span className="text-base font-bold text-foreground">Total</span>
          <span
            data-testid="cart-summary-total"
            className="text-2xl font-black text-foreground"
          >
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {isEmpty ? (
          <Button
            size="lg"
            disabled
            className="w-full text-base font-semibold gap-2"
            aria-label="Proceed to Checkout"
          >
            <span>Proceed to Checkout</span>
          </Button>
        ) : (
          <Link
            href="/checkout"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full text-base font-semibold gap-2"
            )}
            aria-label="Proceed to Checkout"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Safe & secure simulated checkout</span>
        </div>
      </div>
    </div>
  );
}
