"use client";

import { useState } from "react";
import Image from "next/image";
import {
  useMerchantOrders,
  useUpdateOrderStatus,
} from "@/lib/hooks/use-dashboard";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Inbox,
  Loader2,
  MapPin,
  Package,
  RotateCw,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed (Ready)" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

export function IncomingOrdersTab() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const { orders, isLoading, isError, error, refetch } = useMerchantOrders(
    selectedFilter === "all" ? undefined : selectedFilter
  );

  const updateOrderStatusMutation = useUpdateOrderStatus();

  const handleMarkReadyForPickup = async (orderId: number) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        status: "confirmed",
      });
      toast.success(`Order #${orderId} marked ready for pickup!`);
    } catch (err: unknown) {
      const errorObj = err as { error?: { message?: string } };
      toast.error(
        errorObj.error?.message ||
          "Failed to update order status. Please try again."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="incoming-orders-container">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Incoming Orders</h2>
          <p className="text-sm text-muted-foreground">
            View orders placed for your products and prepare items for courier
            pickup
          </p>
        </div>

        {/* Filter Pills */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter orders by status"
        >
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              data-testid={`status-filter-${filter.id}`}
              aria-pressed={selectedFilter === filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selectedFilter === filter.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4 animate-pulse" data-testid="orders-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-muted/60 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div
          role="alert"
          data-testid="orders-error-state"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center max-w-xl mx-auto my-8 space-y-4"
        >
          <div className="rounded-full bg-destructive/20 p-3 w-12 h-12 mx-auto flex items-center justify-center text-destructive">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Failed to load incoming orders
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.message ||
                "An unexpected error occurred while fetching orders. Please try again."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 border-destructive/30 hover:bg-destructive/20"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && orders.length === 0 && (
        <div
          data-testid="empty-orders-state"
          className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center max-w-xl mx-auto my-8 space-y-3"
        >
          <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto flex items-center justify-center text-primary">
            <Inbox className="h-8 w-8" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Orders Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {selectedFilter === "all"
              ? "No customer orders have been received yet. Once buyers order your products, they will show up here."
              : `There are currently no orders with status "${selectedFilter}".`}
          </p>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && !isError && orders.length > 0 && (
        <div className="space-y-4" data-testid="merchant-orders-list">
          {orders.map((order) => {
            const isPending = order.status === "pending";
            const isUpdating = updatingOrderId === order.id;

            return (
              <div
                key={order.id}
                data-testid={`order-card-${order.id}`}
                className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4 hover:border-border/80 transition-colors"
              >
                {/* Header: Order ID, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-foreground">
                      Order #{order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  {order.created_at && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content: Product info + Buyer/Shipping info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Product Details */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                      {order.product_image_url ? (
                        <Image
                          src={order.product_image_url}
                          alt={order.product_name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <Package
                          className="h-7 w-7 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">
                        {order.product_name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {order.product_brand}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Qty:{" "}
                        <strong className="text-foreground">
                          {order.quantity}
                        </strong>{" "}
                        × ${order.bought_price.toFixed(2)} ={" "}
                        <strong className="text-foreground">
                          ${order.total_price.toFixed(2)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Buyer & Shipping Address */}
                  <div className="space-y-1.5 text-xs bg-muted/40 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <User
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>
                        Buyer: {order.buyer_name || "Anonymous Buyer"}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <MapPin
                        className="h-3.5 w-3.5 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2">{order.address}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: "Ready for Pickup" for pending orders */}
                {isPending && (
                  <div className="flex justify-end pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      data-testid={`ready-for-pickup-button-${order.id}`}
                      onClick={() => handleMarkReadyForPickup(order.id)}
                      disabled={isUpdating}
                      aria-label={`Mark order #${order.id} ready for pickup`}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUpdating ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>Ready for Pickup</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
