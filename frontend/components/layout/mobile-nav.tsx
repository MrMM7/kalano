"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { NavSearch } from "@/components/layout/nav-search";

const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function getRoleDetails(role?: string): {
  label: "Buyer" | "Merchant" | "Logistics";
  variant: "default" | "secondary" | "outline";
} {
  const normalized = role?.toLowerCase();
  if (normalized === "merchant") {
    return { label: "Merchant", variant: "default" };
  }
  if (normalized === "logistics") {
    return { label: "Logistics", variant: "secondary" };
  }
  return { label: "Buyer", variant: "outline" };
}

export interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps = {}) {
  const mounted = useMounted();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer on Escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/");
  };

  const role = user?.user_role?.toLowerCase();
  const roleDetails = user ? getRoleDetails(user.user_role) : null;

  return (
    <div className={cn("md:hidden", className)}>
      {/* Hamburger Trigger Button */}
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        className="size-9 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      {/* Slide-out Drawer Overlay & Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-xs flex-col bg-background p-6 shadow-xl animate-in slide-in-from-right duration-300 sm:max-w-sm"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
                aria-label="Kalano Home"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                <span>Kalano</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="size-8 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Search Bar in Mobile Menu */}
              <div>
                <NavSearch onSearchSubmit={handleLinkClick} />
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </p>
                <Link
                  href="/"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ShoppingBag
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Home</span>
                </Link>
                <Link
                  href="/products"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Package
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Catalog</span>
                </Link>
              </div>

              {/* Role-Specific or Account Links */}
              {mounted && !isLoading && user && (
                <div className="space-y-1 border-t border-border pt-4">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </p>
                    {roleDetails && (
                      <Badge
                        variant={roleDetails.variant}
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {roleDetails.label}
                      </Badge>
                    )}
                  </div>

                  {role === "merchant" && (
                    <Link
                      href="/dashboard"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <LayoutDashboard
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>Seller Dashboard</span>
                    </Link>
                  )}

                  {role === "logistics" && (
                    <Link
                      href="/logistics"
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Truck
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span>Logistics Dashboard</span>
                    </Link>
                  )}

                  {role !== "merchant" && role !== "logistics" && (
                    <>
                      <Link
                        href="/orders"
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Package
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href="/cart"
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <ShoppingCart
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>My Cart</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer (Auth Actions) */}
            <div className="border-t border-border pt-4">
              {mounted && !isLoading && user ? (
                <div className="space-y-3">
                  <div className="px-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.display_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive cursor-pointer"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    <span>Log Out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={handleLinkClick}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-center focus-visible:ring-primary"
                    )}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={handleLinkClick}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full justify-center focus-visible:ring-primary"
                    )}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileNav;
