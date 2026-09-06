"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useLogisticsOrders,
  useUpdateLogisticsOrderStatus,
} from "@/lib/hooks/use-logistics";
import { LogisticsOrderItem } from "@/types/logistics";
import { LogisticsHeader } from "@/components/logistics/logistics-header";
import { LogisticsMetrics } from "@/components/logistics/logistics-metrics";
import { LogisticsFilterBar } from "@/components/logistics/logistics-filter-bar";
import { LogisticsTable } from "@/components/logistics/logistics-table";
import { LogisticsConfirmDialog } from "@/components/logistics/logistics-confirm-dialog";
import { buttonVariants, Button } from "@/components/ui/button";
import { AlertCircle, RotateCw, ShieldAlert, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LogisticsPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    order: LogisticsOrderItem | null;
    targetStatus: "cancelled" | "returned";
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: "destructive" | "default";
  }>({
    isOpen: false,
    order: null,
    targetStatus: "cancelled",
    title: "",
    description: "",
    confirmLabel: "",
    confirmVariant: "destructive",
  });

  const {
    orders: allOrders,
    isLoading: isOrdersLoading,
    isError,
    error,
    refetch,
  } = useLogisticsOrders();

  const updateStatusMutation = useUpdateLogisticsOrderStatus();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?redirect=/logistics");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Status counts across all orders
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: allOrders.length };
    for (const o of allOrders) {
      const s = o.delivery_types.toLowerCase();
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [allOrders]);

  // Real-time client side filtering by status tab and keyword search
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      // Status filter tab
      if (
        selectedStatus !== "all" &&
        order.delivery_types.toLowerCase() !== selectedStatus
      ) {
        return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(order.id).includes(q);
        const matchesProduct =
          order.product_name.toLowerCase().includes(q) ||
          order.product_brand.toLowerCase().includes(q);
        const matchesSeller = order.seller_name.toLowerCase().includes(q);
        const matchesBuyer = order.buyer_name.toLowerCase().includes(q);
        const matchesAddress = order.address.toLowerCase().includes(q);

        if (
          !matchesId &&
          !matchesProduct &&
          !matchesSeller &&
          !matchesBuyer &&
          !matchesAddress
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allOrders, selectedStatus, searchQuery]);

  // Auth Loading Skeleton
  if (isAuthLoading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
        data-testid="logistics-page-skeleton"
      >
        <div className="w-full max-w-6xl space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded-xl w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
          </div>
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-72 bg-muted/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Role Protection: Restricted to logistics users
  if (user.user_role !== "logistics") {
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
            data-testid="access-denied-banner"
            className="p-8 rounded-2xl border border-destructive/30 bg-destructive/10 text-foreground space-y-4"
          >
            <div className="rounded-full bg-destructive/20 p-3 w-14 h-14 mx-auto flex items-center justify-center text-destructive">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This area is restricted strictly to Kalano logistics coordinators.
              You are currently authenticated as a{" "}
              <strong className="capitalize">{user.user_role}</strong>. Please
              sign in with an authorized logistics personnel account.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                Back to Home
              </Link>
              {user.user_role === "merchant" && (
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" })
                  )}
                >
                  Go to Merchant Dashboard
                </Link>
              )}
              {user.user_role === "buyer" && (
                <Link
                  href="/orders"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" })
                  )}
                >
                  View Your Orders
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Handle direct status updates
  const handleStatusUpdate = async (orderId: number, targetStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: targetStatus,
      });
      toast.success(
        `Order #${orderId} transitioned to ${targetStatus.toUpperCase()} successfully!`
      );
    } catch (err: unknown) {
      const errorObj = err as { error?: { message?: string } };
      toast.error(
        errorObj.error?.message ||
          "Failed to update order status. Please try again."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Open confirmation for cancellation
  const handleRequestCancel = (order: LogisticsOrderItem) => {
    setConfirmDialog({
      isOpen: true,
      order,
      targetStatus: "cancelled",
      title: "Cancel Order Fulfillment",
      description: `Are you sure you want to cancel Order #${order.id}? The reserved inventory will automatically be restored to the seller's available stock.`,
      confirmLabel: "Cancel Order",
      confirmVariant: "destructive",
    });
  };

  // Open confirmation for customer return
  const handleRequestReturn = (order: LogisticsOrderItem) => {
    setConfirmDialog({
      isOpen: true,
      order,
      targetStatus: "returned",
      title: "Process Customer Return",
      description: `Are you sure you want to mark Order #${order.id} as returned? This moves the order into its final returned state.`,
      confirmLabel: "Process Return",
      confirmVariant: "default",
    });
  };

  // Handle modal confirmation execution
  const handleConfirmModal = async () => {
    if (!confirmDialog.order) return;
    const orderId = confirmDialog.order.id;
    const targetStatus = confirmDialog.targetStatus;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    await handleStatusUpdate(orderId, targetStatus);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LogisticsHeader user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Logistics Fulfillment Operations
          </h1>
          <p className="text-sm text-muted-foreground">
            Track courier pickups, monitor shipments in transit, coordinate with
            merchants, and finalize customer deliveries.
          </p>
        </div>

        {/* Operational Metrics Cards */}
        <LogisticsMetrics orders={allOrders} />

        {/* Filter Bar: Tabs & Live Search */}
        <LogisticsFilterBar
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />

        {/* Loading Skeleton */}
        {isOrdersLoading && (
          <div
            className="space-y-4 animate-pulse"
            data-testid="orders-table-skeleton"
          >
            <div className="h-12 bg-muted rounded-xl" />
            <div className="h-20 bg-muted/50 rounded-xl" />
            <div className="h-20 bg-muted/50 rounded-xl" />
            <div className="h-20 bg-muted/50 rounded-xl" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-card-foreground flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <p className="font-semibold text-destructive">
                  Failed to load logistics orders
                </p>
                <p className="text-xs text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while fetching orders."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <RotateCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Orders Data Table */}
        {!isOrdersLoading && !isError && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <LogisticsTable
              orders={filteredOrders}
              updatingOrderId={updatingOrderId}
              onStatusUpdate={handleStatusUpdate}
              onRequestCancel={handleRequestCancel}
              onRequestReturn={handleRequestReturn}
            />
          </div>
        )}
      </main>

      {/* Reusable Confirmation Dialog for Cancellation & Returns */}
      <LogisticsConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        confirmVariant={confirmDialog.confirmVariant}
        isPending={updatingOrderId !== null}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmModal}
      />
    </div>
  );
}
