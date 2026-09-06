"use client";

import Link from "next/link";
import { UserResponse } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { LogOut, ShoppingBag, Truck, User } from "lucide-react";

interface LogisticsHeaderProps {
  user: UserResponse;
}

export function LogisticsHeader({ user }: LogisticsHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand and Portal Identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity"
            aria-label="Kalano Home"
          >
            <ShoppingBag className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Kalano</span>
          </Link>

          <span
            className="text-muted-foreground/40 font-light"
            aria-hidden="true"
          >
            /
          </span>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-xs tracking-wide">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Logistics Hub</span>
            </div>
          </div>
        </div>

        {/* Right: Operator Profile & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right text-xs">
            <span className="font-semibold text-foreground">
              {user.display_name}
            </span>
            <span className="text-muted-foreground">{user.email}</span>
          </div>

          <div
            className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-semibold text-xs border border-purple-200 dark:border-purple-800"
            title={user.display_name}
            aria-hidden="true"
          >
            <User className="h-4 w-4" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
