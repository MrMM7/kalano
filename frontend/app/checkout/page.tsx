"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { processCheckout } from "@/lib/api/checkout";
import { CheckoutPayload } from "@/types/checkout";
import { ShippingAddressForm } from "@/components/checkout/shipping-address-form";
import { SimulatedPaymentCard } from "@/components/checkout/simulated-payment-card";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { data: cart, isLoading: isCartLoading } = useCart();

  const [userAddressInitialized, setUserAddressInitialized] = useState<
    string | null
  >(null);
  const [address, setAddress] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState<boolean>(true);
  const [addressError, setAddressError] = useState<string | undefined>(
    undefined
  );
  const [serverError, setServerError] = useState<string | null>(null);

  // Sync address from user profile when it loads
  if (user?.address && userAddressInitialized !== user.address) {
    setUserAddressInitialized(user.address);
    setAddress(user.address);
    setSaveAddress(false);
  }

  const checkoutMutation = useMutation({
    mutationFn: (payload: CheckoutPayload) => processCheckout(payload),
    onSuccess: async () => {
      // Invalidate cart state so cart becomes empty
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      if (saveAddress) {
        try {
          await refreshUser();
        } catch {
          // Profile refresh failure shouldn't block redirection
        }
      }

      toast.success("Order placed successfully!");
      router.push("/orders");
    },
    onError: (err: unknown) => {
      const apiErr = err as { error?: { message?: string; code?: string } };
      const message =
        apiErr?.error?.message ||
        "An unexpected error occurred while placing your order. Please try again.";
      setServerError(message);
      toast.error(message);
    },
  });

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (addressError) {
      setAddressError(undefined);
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handlePlaceOrder = () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress || trimmedAddress.length < 5) {
      setAddressError(
        "Please enter a valid shipping address (minimum 5 characters)."
      );
      return;
    }

    setAddressError(undefined);
    setServerError(null);

    checkoutMutation.mutate({
      address: trimmedAddress,
      save_address: saveAddress,
    });
  };

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
              href="/cart"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </header>

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
          <Link
            href="/cart"
            className="hover:text-foreground transition-colors"
          >
            Shopping Cart
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Checkout</span>
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
                  Checkout is reserved for Buyer accounts
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
        {isCartLoading && <CheckoutSkeleton />}

        {/* Empty Cart State */}
        {!isCartLoading && (!cart || cart.items.length === 0) && (
          <div
            data-testid="empty-checkout-state"
            className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-xl mx-auto my-12"
          >
            <div className="rounded-full bg-muted/60 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              There are no items in your cart to checkout. Browse our catalog to
              find items you love!
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        )}

        {/* Populated Checkout Content */}
        {!isCartLoading && cart && cart.items.length > 0 && (
          <div className="space-y-6">
            {/* Server Error Banner */}
            {serverError && (
              <div
                role="alert"
                data-testid="checkout-error-banner"
                className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{serverError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Forms */}
              <div className="lg:col-span-2 space-y-6">
                <ShippingAddressForm
                  address={address}
                  onAddressChange={handleAddressChange}
                  saveAddress={saveAddress}
                  onSaveAddressChange={setSaveAddress}
                  error={addressError}
                  disabled={checkoutMutation.isPending}
                />

                <SimulatedPaymentCard />

                <div className="flex items-center">
                  <Link
                    href="/cart"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "gap-2 text-sm text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Return to Shopping Cart</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-1">
                <CheckoutOrderSummary
                  cart={cart}
                  isSubmitting={checkoutMutation.isPending}
                  onSubmit={handlePlaceOrder}
                  disabled={Boolean(isNonBuyer)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
