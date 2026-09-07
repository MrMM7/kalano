"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAddToCart } from "@/lib/hooks/use-cart";
import { useProductDetail } from "@/lib/hooks/use-product-detail";
import { SellerOffersTable } from "@/components/seller-offers-table";
import { ProductDetailSkeleton } from "@/components/product-detail-skeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params?.id as string) || "";
  const { user } = useAuth();
  const addToCartMutation = useAddToCart();

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductDetail(productId);

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Compute effective offer ID: selected offer, falling back to cheapest offer or first offer
  const effectiveOfferId =
    selectedOfferId ??
    product?.cheapest_offer?.seller_product_id ??
    (product?.offers && product.offers.length > 0
      ? product.offers[0].seller_product_id
      : null);

  // Compute active offer from selection, fallback to cheapest_offer
  const activeOffer =
    product?.offers?.find((o) => o.seller_product_id === effectiveOfferId) ||
    product?.cheapest_offer ||
    null;

  const isOutOfStock = !activeOffer || activeOffer.stock <= 0;

  const handleAddToCart = async () => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/products/${productId}`)}`
      );
      return;
    }

    if (!activeOffer) return;

    try {
      await addToCartMutation.mutateAsync({
        seller_product_id: activeOffer.seller_product_id,
        quantity: 1,
      });

      toast.success(`${product?.name || "Product"} added to your cart!`, {
        action: {
          label: "View Cart",
          onClick: () => router.push("/cart"),
        },
      });
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string; code?: string } };
      if (apiErr?.error?.code === "INSUFFICIENT_STOCK") {
        toast.error("Cannot add to cart: stock limit reached.");
      } else {
        toast.error(
          apiErr?.error?.message ||
            "Failed to add item to cart. Please try again."
        );
      }
    }
  };

  // Check if error is a 404 Not Found
  const err = error as { error?: { code?: string }; message?: string } | null;
  const isNotFound =
    err?.error?.code === "NOT_FOUND" ||
    err?.error?.code === "RESOURCE_NOT_FOUND" ||
    err?.message?.includes("404");

  return (
    <div className="bg-background text-foreground">
      {/* Loading Skeleton */}
      {isLoading && <ProductDetailSkeleton />}

      {/* 404 Not Found State */}
      {!isLoading && isNotFound && (
        <div
          data-testid="product-not-found"
          className="max-w-2xl mx-auto px-4 py-24 text-center"
        >
          <div className="rounded-full bg-muted/60 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Product Not Found
          </h1>
          <p className="mt-2 text-muted-foreground">
            The product you requested doesn&apos;t exist or may have been
            removed from our catalog.
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Product Catalog
            </Link>
          </div>
        </div>
      )}

      {/* Generic Error State */}
      {!isLoading && !isNotFound && isError && (
        <div className="my-20">
          <ErrorState
            title="Unable to load product"
            message={
              error?.message ||
              "There was an unexpected error retrieving this item."
            }
            onRetry={() => refetch()}
          />
        </div>
      )}

      {/* Product Presentation Grid */}
      {!isLoading && !isError && product && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              href="/products"
              className="hover:text-foreground transition-colors"
            >
              Products
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-xs sm:max-w-md">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: Product Image */}
            <div className="aspect-square w-full rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center p-8 shadow-sm">
              {product.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-20 w-20 stroke-[1.2] text-muted-foreground/40 mb-2" />
                  <span className="text-sm font-medium">
                    No image available
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Metadata & Featured Purchasing Box */}
            <div className="flex flex-col space-y-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {product.brand}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {product.name}
                </h1>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  About this item
                </h2>
                <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Purchasing Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                {!isOutOfStock && activeOffer ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-foreground">
                        ${activeOffer.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Unit Price
                      </span>
                    </div>

                    <div className="space-y-2 py-2 border-y border-border/60 text-sm">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Sold by {activeOffer.seller_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-4 w-4 text-muted-foreground/70" />
                        <span>
                          {activeOffer.estimated_delivery_days != null
                            ? `Estimated delivery in ${activeOffer.estimated_delivery_days} days`
                            : "Standard delivery via Kalano Logistics"}
                        </span>
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        In Stock ({activeOffer.stock} units available)
                      </div>
                    </div>

                    <Button
                      size="lg"
                      disabled={addToCartMutation.isPending}
                      onClick={handleAddToCart}
                      className="w-full text-base font-semibold gap-2"
                      aria-label={`Add to cart from ${activeOffer.seller_name}`}
                    >
                      {addToCartMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Adding to Cart...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Fulfillment and delivery handled safely by Kalano
                      Logistics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-4">
                    <div className="inline-flex items-center gap-2 text-destructive font-semibold">
                      <AlertCircle className="h-5 w-5" />
                      <span>Currently Unavailable / Out of Stock</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We don&apos;t know when or if this item will be back in
                      stock from any merchant.
                    </p>
                    <Button disabled size="lg" className="w-full text-base">
                      Out of Stock
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Sellers Table Section */}
          <div className="mt-16 pt-12 border-t border-border/60">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Compare All Merchant Offers
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the best merchant offer based on price, delivery time,
                and stock availability.
              </p>
            </div>

            <SellerOffersTable
              offers={product.offers}
              selectedOfferId={effectiveOfferId}
              onSelectOffer={(newId) => setSelectedOfferId(newId)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
