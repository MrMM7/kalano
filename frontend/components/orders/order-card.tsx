import Link from "next/link";
import Image from "next/image";
import { MapPin, Store, Package } from "lucide-react";
import { OrderItem } from "@/types/order";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderCardProps {
  order: OrderItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article
      data-testid={`order-card-${order.id}`}
      aria-labelledby={`order-title-${order.id}`}
      className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:border-border transition-all space-y-4"
    >
      {/* Header: ID, Date, Status Badge */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <span
            id={`order-title-${order.id}`}
            className="font-bold text-foreground"
          >
            Order #{order.id}
          </span>
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            •
          </span>
          <time
            dateTime={order.created_at}
            className="text-sm text-muted-foreground"
          >
            {formattedDate}
          </time>
        </div>
        <OrderStatusBadge
          status={order.delivery_types}
          aria-label={`Order status: ${order.delivery_types}`}
        />
      </header>

      {/* Main Body */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Product Image */}
        <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-muted/50 border border-border/50 flex items-center justify-center">
          {order.product_image_url ? (
            <Image
              src={order.product_image_url}
              alt={order.product_name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <Package
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Product Information */}
        <div className="flex-1 min-w-0 space-y-1">
          <Link
            href={`/products/${order.product_id}`}
            className="font-semibold text-foreground hover:text-primary hover:underline transition-colors line-clamp-1"
          >
            {order.product_name}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {order.product_brand && (
              <span className="font-medium text-foreground/80">
                {order.product_brand}
              </span>
            )}
            {order.product_brand && <span aria-hidden="true">•</span>}
            <span className="flex items-center gap-1">
              <Store className="h-3 w-3" aria-hidden="true" />
              <span>Sold by: {order.seller_name}</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground pt-0.5">
            Quantity: {order.quantity} × ${order.bought_price.toFixed(2)}
          </div>
        </div>

        {/* Subtotal */}
        <div className="sm:text-right shrink-0 pt-2 sm:pt-0">
          <div className="text-xs text-muted-foreground">Total Paid</div>
          <div className="text-lg font-bold text-foreground">
            ${order.subtotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Footer: Shipping destination */}
      <footer className="border-t border-border/40 pt-3 flex items-start sm:items-center gap-2 text-xs text-muted-foreground">
        <MapPin
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5 sm:mt-0"
          aria-hidden="true"
        />
        <span className="truncate">Shipping to: {order.address}</span>
      </footer>
    </article>
  );
}
