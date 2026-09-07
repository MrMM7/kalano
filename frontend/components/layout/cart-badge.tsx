"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/hooks/use-cart";
import { cn } from "@/lib/utils";

export interface CartBadgeProps {
  className?: string;
}

export function CartBadge({ className }: CartBadgeProps) {
  const { data } = useCart();

  const count =
    data?.total_items ??
    data?.items?.reduce((sum, item) => sum + item.quantity, 0) ??
    0;

  const displayCount = count > 99 ? "99+" : count;

  return (
    <Link
      href="/cart"
      data-testid="cart-badge"
      aria-label={
        count > 0 ? `Shopping Cart with ${count} items` : "Shopping Cart"
      }
      className={cn(
        "relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          data-testid="cart-badge-count"
          className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center pointer-events-none"
        >
          {displayCount}
        </span>
      )}
    </Link>
  );
}

export default CartBadge;
