"use client";

import { Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";
import { PaginationControls } from "@/components/pagination-controls";
import { useProducts } from "@/lib/hooks/use-products";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ShoppingBag, X } from "lucide-react";

function ProductsCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") || "";
  const limitParam = parseInt(searchParams.get("limit") || "20", 10);
  const offsetParam = parseInt(searchParams.get("offset") || "0", 10);

  const limit = isNaN(limitParam) || limitParam < 1 ? 20 : limitParam;
  const offset = isNaN(offsetParam) || offsetParam < 0 ? 0 : offsetParam;

  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    limit,
    offset,
    q: q.trim() || undefined,
  });

  function handlePageChange(newOffset: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(limit));
    params.set("offset", String(newOffset));
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleClearSearch() {
    startTransition(() => {
      router.push("/products");
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header Bar */}
      <div className="mb-8 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="w-full md:max-w-md">
          <SearchBar
            key={q}
            initialQuery={q}
            placeholder="Search products, brands, or descriptions..."
          />
        </div>

        {q.trim() && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSearch}
            className="gap-1.5 self-start md:self-center"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear search
          </Button>
        )}
      </div>

      {/* Results Metadata Header */}
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {q.trim() ? `Results for "${q.trim()}"` : "All Products"}
          </h1>
          {!isLoading && data && (
            <p className="text-sm text-muted-foreground mt-1">
              Found {data.total} {data.total === 1 ? "product" : "products"}
            </p>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div
          data-testid="products-loading"
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
          <h2 className="text-lg font-semibold text-foreground">
            Unable to load products
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {error?.message || "There was a problem connecting to the catalog."}
          </p>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <div
          data-testid="empty-catalog"
          className="rounded-xl border border-dashed border-border p-12 text-center max-w-md mx-auto my-8"
        >
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
          <h2 className="text-lg font-semibold text-foreground">
            {q.trim() ? `No products found matching "${q.trim()}"` : "No products available"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            {q.trim()
              ? "Try checking your spelling or searching for a more general keyword."
              : "Check back later as merchants add new inventory to Kalano."}
          </p>
          {q.trim() && (
            <Button onClick={handleClearSearch} variant="default">
              View All Products
            </Button>
          )}
        </div>
      )}

      {/* Catalog Grid */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div
            data-testid="products-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <PaginationControls
            total={data.total}
            limit={limit}
            offset={offset}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
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
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <ProductsCatalogContent />
      </Suspense>
    </main>
  );
}
