"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { NavSearch } from "@/components/layout/nav-search";
import { CartBadge } from "@/components/layout/cart-badge";
import { UserNav } from "@/components/layout/user-nav";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps = {}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <nav
        aria-label="Main Navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        {/* Left: Brand logo & Catalog link */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Kalano Home"
          >
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            <span>Kalano</span>
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Catalog
          </Link>
        </div>

        {/* Center: Persistent Search */}
        <div className="flex-1 max-w-md mx-4">
          <NavSearch />
        </div>

        {/* Right: Cart Badge & User Menu */}
        <div className="flex items-center gap-3">
          <CartBadge />
          <UserNav />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
