"use client";

import Image from "next/image";
import { CartResponse } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PackageCheck, ShieldCheck, Truck } from "lucide-react";

interface CheckoutOrderSummaryProps {
  cart: CartResponse;
  isSubmitting: boolean;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CheckoutOrderSummary({
  cart,
  isSubmitting,
  onSubmit,
  disabled = false,
}: CheckoutOrderSummaryProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm sticky top-24">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-lg font-bold text-foreground">
            Order Summary
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Item Breakdown List */}
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0"
            >
              <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted/50 border border-border/50 flex items-center justify-center">
                {item.product_image_url ? (
                  <Image
                    src={item.product_image_url}
                    alt={item.product_name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold text-center px-1">
                    No image
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Seller: {item.seller_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Qty: {item.quantity} ×
                </p>
              </div>

              <div className="text-sm font-semibold text-foreground text-right shrink-0"></div>
            </div>
          ))}
        </div>

        {/* Cost Calculations */}
        <div className="space-y-3 pt-2 border-t border-border/60 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Items ({cart.total_items})</span>
            <span className="font-medium text-foreground"></span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Free
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <span>Fulfilled via Kalano Logistics</span>
          </div>

          <div className="pt-3 border-t border-border flex justify-between items-baseline">
            <span className="text-base font-bold text-foreground">
              Grand Total
            </span>
            <span className="text-2xl font-black text-foreground"></span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            onClick={onSubmit}
            disabled={disabled || isSubmitting || cart.items.length === 0}
            className="w-full text-base font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <span>Place Order ()</span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Simulated transaction • No real charges</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
