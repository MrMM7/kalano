"use client";

import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import { useProducts } from "@/lib/hooks/use-products";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";

export default function Home() {
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    limit: 8,
    offset: 0,
  });

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/30 to-background py-16 sm:py-24"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Frontend ready - API: http://localhost:8000</span>
          </div>

          <h1
            id="hero-heading"
            className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground"
          >
            Kalano
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern multi-vendor marketplace
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Discover verified merchant offers with the lowest prices guaranteed
            and Kalano logistics fulfillment.
          </p>

          <div className="mt-8 max-w-xl mx-auto">
            <SearchBar placeholder="Search products, brands, or descriptions..." />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        aria-labelledby="featured-products-heading"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              id="featured-products-heading"
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Featured Products
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Top curated items available now across verified marketplace
              sellers.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            View all products &rarr;
          </Link>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div
            data-testid="featured-loading"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center max-w-lg mx-auto"
          >
            <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
            <h3 className="text-lg font-semibold text-foreground">
              Unable to load products
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {error?.message ||
                "There was a problem connecting to the catalog service."}
            </p>
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Try Again
            </Button>
          </div>
        )}

        {/* Empty Catalog State */}
        {!isLoading && !isError && data && data.items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">
              No products available yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon as merchants add their products to the catalog.
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !isError && data && data.items.length > 0 && (
          <div
            data-testid="featured-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
