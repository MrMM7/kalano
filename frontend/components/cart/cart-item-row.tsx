"use client";

import Link from "next/link";
import { CartItem } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Package } from "lucide-react";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
  isRemoving,
}: CartItemRowProps) {
  const isAtMaxStock = item.quantity >= item.stock;
  const isAtMinQuantity = item.quantity <= 1;
  const isBusy = isUpdating || isRemoving;

  return (
    <div
      data-testid={`cart-item-${item.id}`}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-border/60 last:border-b-0"
    >
      {/* Product Image & Details */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center p-2">
          {item.product_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.product_image_url}
              alt={item.product_name}
              className="h-full w-full object-contain"
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {item.product_brand}
          </span>
          <h3 className="text-base font-semibold text-foreground truncate mt-0.5">
            <Link
              href={`/products/${item.product_id}`}
              className="hover:text-primary hover:underline transition-colors"
            >
              {item.product_name}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sold by{" "}
            <span className="font-medium text-foreground">
              {item.seller_name}
            </span>
          </p>
          <div className="text-xs text-muted-foreground mt-1">
            {item.estimated_delivery_days != null
              ? `Estimated delivery: ${item.estimated_delivery_days} days`
              : "Standard delivery via Kalano Logistics"}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-bold text-foreground sm:hidden">
              ${item.unit_price.toFixed(2)} each
            </span>
            {isAtMaxStock && (
              <span
                data-testid={`max-stock-indicator-${item.id}`}
                className="inline-flex items-center text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded"
              >
                Max stock reached ({item.stock})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing, Stepper & Removal */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        {/* Desktop Unit Price */}
        <div className="hidden sm:block text-right">
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="text-sm font-semibold text-foreground">
            ${item.unit_price.toFixed(2)}
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center border border-border rounded-lg bg-background p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isBusy || isAtMinQuantity}
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            aria-label={`Decrease quantity of ${item.product_name}`}
            className="h-7 w-7 rounded"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span
            data-testid={`quantity-display-${item.id}`}
            className="w-9 text-center text-sm font-semibold text-foreground select-none"
          >
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isBusy || isAtMaxStock}
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            aria-label={`Increase quantity of ${item.product_name}`}
            className="h-7 w-7 rounded"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Line Subtotal */}
        <div className="text-right min-w-[70px]">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Subtotal
          </div>
          <div
            data-testid={`subtotal-${item.id}`}
            className="text-base font-bold text-foreground"
          >
            ${item.subtotal.toFixed(2)}
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isBusy}
          onClick={onRemove}
          aria-label={`Remove ${item.product_name} from cart`}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
