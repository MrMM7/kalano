"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "U";
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

export interface UserNavProps {
  className?: string;
}

export function UserNav({ className }: UserNavProps = {}) {
  const mounted = useMounted();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted || isLoading) {
    return (
      <div
        className={cn("h-8 w-20 bg-muted animate-pulse rounded-md", className)}
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Link
          href="/login"
          aria-label="Log In"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          Log In
        </Link>
        <Link
          href="/signup"
          aria-label="Sign Up"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const roleDetails = getRoleDetails(user.user_role);
  const initials = getInitials(user.display_name, user.email);
  const role = user.user_role?.toLowerCase();

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <div
      className={cn("relative inline-block text-left", className)}
      ref={menuRef}
    >
      <button
        ref={triggerRef}
        type="button"
        id="user-menu-button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User profile menu"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </span>
        <span className="max-w-[150px] truncate text-sm font-medium">
          {user.display_name || user.email}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          id="user-menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {/* Dropdown Header */}
          <div className="px-2 py-1.5 border-b border-border mb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold truncate text-foreground">
                {user.display_name || "User"}
              </span>
              <Badge
                variant={roleDetails.variant}
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {roleDetails.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {user.email}
            </p>
          </div>

          {/* Role-Specific Navigation Links */}
          <div className="py-0.5 space-y-0.5">
            {role === "merchant" && (
              <>
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <LayoutDashboard
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Seller Dashboard</span>
                </Link>
                <Link
                  href="/products"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <Package
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>Catalog</span>
                </Link>
              </>
            )}

            {role === "logistics" && (
              <Link
                href="/logistics"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
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
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <Package
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>My Orders</span>
                </Link>
                <Link
                  href="/cart"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
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

          {/* Divider */}
          <div className="my-1 border-t border-border" role="separator" />

          {/* Log Out */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1 cursor-pointer"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
