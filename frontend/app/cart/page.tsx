"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useCart,
  useDeleteCartItem,
  useUpdateCartItem,
} from "@/lib/hooks/use-cart";
import { CartItemList } from "@/components/cart/cart-item-list";
import { CartSummary } from "@/components/cart/cart-summary";
import { CartEmptyState } from "@/components/cart/cart-empty-state";
import { CartSkeleton } from "@/components/cart/cart-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Store,
  Truck,
} from "lucide-react";

export default function CartPage() {
  const { user } = useAuth();
  const {
    data: cart,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCart();
  const updateMutation = useUpdateCartItem();
  const deleteMutation = useDeleteCartItem();

  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  // Check if role is not buyer
  const isNonBuyer = user && user.user_role !== "buyer";

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItemId(itemId);
    try {
      await updateMutation.mutateAsync({
        itemId,
        data: { quantity: newQuantity },
      });
      toast.success("Cart updated");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string; code?: string } };
      const message =
        apiErr?.error?.message ||
        "Failed to update quantity. Please try again.";
      toast.error(message);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setRemovingItemId(itemId);
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success("Item removed from cart");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string; code?: string } };
      const message =
        apiErr?.error?.message || "Failed to remove item. Please try again.";
      toast.error(message);
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <main className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Shopping Cart</span>
        </nav>

        {/* Non-buyer Role Banner */}
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
                  Carts are reserved for Buyer accounts
                </h2>
                <p className="text-sm text-muted-foreground">
                  You are currently logged in as a{" "}
                  <strong className="capitalize">{user.user_role}</strong>.
                  Please switch to a buyer account or navigate to your
                  specialized dashboard.
                </p>
                <div className="pt-2">
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
        {isLoading && <CartSkeleton />}

        {/* Error State */}
        {!isLoading && isError && (
          <div
            role="alert"
            className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-destructive/20 bg-destructive/5 text-center"
          >
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground">
              Unable to load your cart
            </h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {error?.message ||
                "There was an unexpected error retrieving your cart items."}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!cart || cart.items.length === 0) && (
          <CartEmptyState />
        )}

        {/* Populated Cart Grid */}
        {!isLoading && !isError && cart && cart.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <CartItemList
                items={cart.items}
                updatingItemId={updatingItemId}
                removingItemId={removingItemId}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />

              <div className="mt-6 flex items-center justify-between">
                <Link
                  href="/products"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "gap-2 text-sm text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <CartSummary
                totalPrice={cart.total_price}
                totalItems={cart.total_items}
                isEmpty={false}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
