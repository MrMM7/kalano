"use client";

import { CartItem } from "@/types/cart";
import { CartItemRow } from "./cart-item-row";

interface CartItemListProps {
  items: CartItem[];
  updatingItemId: number | null;
  removingItemId: number | null;
  onUpdateQuantity: (itemId: number, newQuantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

export function CartItemList({
  items,
  updatingItemId,
  removingItemId,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemListProps) {
  return (
    <div
      data-testid="cart-item-list"
      className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm"
      aria-label="Shopping Cart Items"
    >
      <div className="border-b border-border pb-4 mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Cart Items ({items.length})
        </h2>
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Price & Quantity
        </span>
      </div>

      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            isUpdating={updatingItemId === item.id}
            isRemoving={removingItemId === item.id}
            onUpdateQuantity={(quantity) => onUpdateQuantity(item.id, quantity)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
