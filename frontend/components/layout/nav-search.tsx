"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavSearchProps {
  className?: string;
  placeholder?: string;
  onSearchSubmit?: () => void;
}

function NavSearchForm({
  className,
  placeholder = "Search products...",
  onSearchSubmit,
}: NavSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [prevQParam, setPrevQParam] = useState(qParam);
  const [query, setQuery] = useState(qParam);

  // Sync input value when URL search param changes without an effect
  if (prevQParam !== qParam) {
    setPrevQParam(qParam);
    setQuery(qParam);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearchSubmit?.();
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn("relative flex w-full max-w-md items-center", className)}
    >
      <label htmlFor="nav-search-input" className="sr-only">
        Search products
      </label>
      <input
        id="nav-search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-background focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function NavSearchFallback({
  className,
  placeholder = "Search products...",
}: NavSearchProps) {
  return (
    <div
      className={cn("relative flex w-full max-w-md items-center", className)}
      role="search"
    >
      <label htmlFor="nav-search-fallback-input" className="sr-only">
        Search products
      </label>
      <input
        id="nav-search-fallback-input"
        type="search"
        disabled
        placeholder={placeholder}
        aria-label="Search products"
        className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-3 pr-9 text-sm text-muted-foreground opacity-70"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-70">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
    </div>
  );
}

export function NavSearch(props: NavSearchProps) {
  return (
    <Suspense fallback={<NavSearchFallback {...props} />}>
      <NavSearchForm {...props} />
    </Suspense>
  );
}

export default NavSearch;
