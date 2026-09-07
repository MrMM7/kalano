"use client";

import { useState } from "react";
import Link from "next/link";
import { UserResponse } from "@/types/auth";
import {
  useMerchantOffers,
  useMerchantOrders,
} from "@/lib/hooks/use-dashboard";
import { MyOffersTab } from "./my-offers-tab";
import { AddOfferTab } from "./add-offer-tab";
import { IncomingOrdersTab } from "./incoming-orders-tab";
import {
  Clock,
  Inbox,
  Package,
  PlusCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  user: UserResponse;
}

type TabType = "my-offers" | "add-offer" | "incoming-orders";

export function DashboardShell({ user }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<TabType>("my-offers");

  const { totalOffers } = useMerchantOffers();
  const { orders } = useMerchantOrders("pending");
  const pendingOrdersCount = orders.length;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-testid="dashboard-shell"
    >
      {/* Top Navbar */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
              aria-label="Kalano Home"
            >
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              <span>Kalano</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground border-l border-border pl-6">
              <Store className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                Merchant Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              Signed in as{" "}
              <strong className="text-foreground">{user.display_name}</strong>
            </span>
            <Link
              href="/products"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header & Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Merchant Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage listings, monitor stock levels, and prepare orders for
              courier pickup
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-card border border-border/80 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Package className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Active Offers
                </p>
                <p
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-active-offers"
                >
                  {totalOffers}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-card border border-border/80 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Pending Pickup
                </p>
                <p
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-pending-orders"
                >
                  {pendingOrdersCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div
          className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto"
          role="tablist"
          aria-label="Merchant Dashboard Tabs"
        >
          <button
            type="button"
            role="tab"
            id="tab-my-offers"
            aria-controls="panel-my-offers"
            aria-selected={activeTab === "my-offers"}
            data-testid="tab-my-offers"
            onClick={() => setActiveTab("my-offers")}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              activeTab === "my-offers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="h-4 w-4" aria-hidden="true" />
            <span>My Offers</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {totalOffers}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-add-offer"
            aria-controls="panel-add-offer"
            aria-selected={activeTab === "add-offer"}
            data-testid="tab-add-offer"
            onClick={() => setActiveTab("add-offer")}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              activeTab === "add-offer"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>Add Offer</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-incoming-orders"
            aria-controls="panel-incoming-orders"
            aria-selected={activeTab === "incoming-orders"}
            data-testid="tab-incoming-orders"
            onClick={() => setActiveTab("incoming-orders")}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              activeTab === "incoming-orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="h-4 w-4" aria-hidden="true" />
            <span>Incoming Orders</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "my-offers" && (
            <MyOffersTab
              onNavigateToAddOffer={() => setActiveTab("add-offer")}
            />
          )}

          {activeTab === "add-offer" && (
            <AddOfferTab onOfferAdded={() => setActiveTab("my-offers")} />
          )}

          {activeTab === "incoming-orders" && <IncomingOrdersTab />}
        </div>
      </main>
    </div>
  );
}
