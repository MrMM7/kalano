"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { useOrders } from "@/lib/hooks/use-orders";
import { OrderCard } from "@/components/orders/order-card";
import { OrdersEmptyState } from "@/components/orders/orders-empty-state";
import { OrdersSkeleton } from "@/components/orders/orders-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Clock,
  RotateCw,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const { orders, totalOrders, isLoading, isError, error, refetch } =
    useOrders();

  const isNonBuyer = user && user.user_role !== "buyer";

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
            aria-label="Kalano Home"
          >
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            <span>Kalano</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              href="/cart"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cart
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Order History</span>
        </nav>

        {/* Page Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Your Orders
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track delivery progress and view previous purchases
            </p>
          </div>
          {!isLoading && !isError && orders.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border/60 rounded-full px-4 py-1.5 self-start sm:self-auto">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                {totalOrders} {totalOrders === 1 ? "order" : "orders"} placed
              </span>
            </div>
          )}
        </div>

        {/* Non-buyer Role Notice */}
        {isNonBuyer && (
          <div
            role="alert"
            data-testid="non-buyer-banner"
            className="mb-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-foreground"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2 className="text-base font-semibold">
                  Order history is designed for Buyer accounts
                </h2>
                <p className="text-sm text-muted-foreground">
                  You are currently logged in as a{" "}
                  <strong className="capitalize">{user.user_role}</strong>. Your
                  orders as a customer are shown below, or you may navigate to
                  your specialized dashboard.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  {user.user_role === "merchant" && (
                    <Link
                      href="/dashboard"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2"
                      )}
                    >
                      <Store className="h-4 w-4" />
                      <span>Go to Merchant Dashboard</span>
                    </Link>
                  )}
                  {user.user_role === "logistics" && (
                    <Link
                      href="/logistics"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2"
                      )}
                    >
                      <Truck className="h-4 w-4" />
                      <span>Go to Logistics Dashboard</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <OrdersSkeleton />}

        {/* Error State */}
        {!isLoading && isError && (
          <div
            role="alert"
            data-testid="orders-error-state"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center max-w-xl mx-auto my-8 space-y-4"
          >
            <div className="rounded-full bg-destructive/20 p-3 w-12 h-12 mx-auto flex items-center justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Failed to load your orders
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.message ||
                  "An unexpected error occurred while fetching your order history. Please try again."}
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="gap-2 border-destructive/30 hover:bg-destructive/20"
              >
                <RotateCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && orders.length === 0 && <OrdersEmptyState />}

        {/* Populated Orders List */}
        {!isLoading && !isError && orders.length > 0 && (
          <div className="space-y-4" data-testid="orders-list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
