"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { AlertCircle, ShoppingBag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        data-testid="dashboard-page-skeleton"
      >
        <div className="w-full max-w-4xl space-y-6 animate-pulse">
          <div className="h-12 bg-muted rounded-xl w-1/3" />
          <div className="h-8 bg-muted/60 rounded-xl w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
          </div>
          <div className="h-64 bg-muted/40 rounded-2xl mt-8" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.user_role !== "merchant") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
              aria-label="Kalano Home"
            >
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              <span>Kalano</span>
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div
            role="alert"
            data-testid="access-restricted-banner"
            className="p-8 rounded-2xl border border-destructive/30 bg-destructive/10 text-foreground space-y-4"
          >
            <div className="rounded-full bg-destructive/20 p-3 w-14 h-14 mx-auto flex items-center justify-center text-destructive">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Access Restricted
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This area is reserved for merchant accounts. You are currently logged in
              as a <strong className="capitalize">{user.user_role}</strong>. Please switch
              to a merchant account to access inventory and sales tools.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Back to Home
              </Link>
              {user.user_role === "buyer" && (
                <Link
                  href="/orders"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                >
                  View Your Orders
                </Link>
              )}
              {user.user_role === "logistics" && (
                <Link
                  href="/logistics"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "gap-1.5"
                  )}
                >
                  <Truck className="h-4 w-4" />
                  <span>Logistics Hub</span>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <DashboardShell user={user} />;
}
