"use client";

import * as React from "react";
import Image from "next/image";
import {
  Package,
  MapPin,
  User,
  Store,
  CheckCircle,
  Truck,
  Ban,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { LogisticsOrderItem } from "@/types/logistics";
import { LogisticsStatusBadge } from "@/components/logistics/logistics-status-badge";
import { Button } from "@/components/ui/button";

export interface LogisticsTableProps {
  orders: LogisticsOrderItem[];
  updatingOrderId?: number | null;
  onStatusUpdate: (orderId: number, targetStatus: string) => void;
  onRequestCancel: (order: LogisticsOrderItem) => void;
  onRequestReturn: (order: LogisticsOrderItem) => void;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function LogisticsTable({
  orders,
  updatingOrderId,
  onStatusUpdate,
  onRequestCancel,
  onRequestReturn,
}: LogisticsTableProps) {
  const renderActions = (order: LogisticsOrderItem) => {
    const isRowUpdating = updatingOrderId === order.id;
    const status = (order.delivery_types || "").toLowerCase().trim();

    switch (status) {
      case "pending":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isRowUpdating}
              onClick={() => onStatusUpdate(order.id, "confirmed")}
              aria-label={`Confirm pickup for order #${order.id}`}
            >
              {isRowUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Truck className="h-3.5 w-3.5 mr-1.5" />
              )}
              Confirm Pickup
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isRowUpdating}
              onClick={() => onRequestCancel(order)}
              aria-label={`Cancel order #${order.id}`}
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
        );

      case "confirmed":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={isRowUpdating}
              onClick={() => onStatusUpdate(order.id, "shipped")}
              aria-label={`Mark order #${order.id} shipped`}
            >
              {isRowUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Truck className="h-3.5 w-3.5 mr-1.5" />
              )}
              Mark Shipped
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isRowUpdating}
              onClick={() => onRequestCancel(order)}
              aria-label={`Cancel order #${order.id}`}
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
        );

      case "shipped":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
              disabled={isRowUpdating}
              onClick={() => onStatusUpdate(order.id, "delivered")}
              aria-label={`End delivery for order #${order.id}`}
            >
              {isRowUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              End Delivery
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isRowUpdating}
              onClick={() => onRequestCancel(order)}
              aria-label={`Cancel order #${order.id}`}
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
        );

      case "delivered":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isRowUpdating}
              onClick={() => onRequestReturn(order)}
              aria-label={`Process return for order #${order.id}`}
            >
              {isRowUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Process Return
            </Button>
          </div>
        );

      case "cancelled":
      case "returned":
        return (
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
              Final
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-end">
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left text-sm"
          role="table"
          aria-label="Logistics orders table"
        >
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 font-medium whitespace-nowrap"
              >
                Order ID & Placed Date
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Product
              </th>
              <th
                scope="col"
                className="px-6 py-3 font-medium whitespace-nowrap"
              >
                Merchant Seller
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Buyer & Shipping Address
              </th>
              <th
                scope="col"
                className="px-6 py-3 font-medium whitespace-nowrap"
              >
                Items & Subtotal
              </th>
              <th
                scope="col"
                className="px-6 py-3 font-medium whitespace-nowrap"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 font-medium text-right whitespace-nowrap"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package
                      className="h-8 w-8 text-muted-foreground/50"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium">
                      No orders match the selected criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const formattedDate = formatDate(order.created_at);

                return (
                  <tr
                    key={order.id}
                    data-testid={`logistics-order-row-${order.id}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Order ID & Date */}
                    <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        #{order.id}
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">
                        {formattedDate}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40 flex items-center justify-center">
                          {order.product_image_url ? (
                            <Image
                              src={order.product_image_url}
                              alt={order.product_name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package
                              className="h-5 w-5 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <div
                            className="font-medium text-foreground truncate"
                            title={order.product_name}
                          >
                            {order.product_name}
                          </div>
                          {order.product_brand && (
                            <div
                              className="text-xs text-muted-foreground truncate"
                              title={order.product_brand}
                            >
                              {order.product_brand}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Merchant Seller */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-foreground text-sm">
                        <Store
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span
                          className="truncate max-w-[150px]"
                          title={order.seller_name}
                        >
                          {order.seller_name}
                        </span>
                      </div>
                    </td>

                    {/* Buyer & Shipping Address */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span
                            className="truncate max-w-[180px]"
                            title={order.buyer_name}
                          >
                            {order.buyer_name}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5"
                            aria-hidden="true"
                          />
                          <span
                            className="truncate max-w-[220px]"
                            title={order.address}
                          >
                            {order.address}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Items & Subtotal */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-semibold text-foreground">
                          ${order.subtotal.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.quantity} × ${order.bought_price.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <LogisticsStatusBadge status={order.delivery_types} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {renderActions(order)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
