"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogisticsFilterBarProps {
  selectedStatus: string; // 'all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts?: Record<string, number>;
}

const STATUS_OPTIONS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
] as const;

export function LogisticsFilterBar({
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  counts,
}: LogisticsFilterBarProps) {
  const currentStatus = (selectedStatus || "all").toLowerCase().trim();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Status Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter orders by fulfillment status"
        className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50"
      >
        {STATUS_OPTIONS.map((tab) => {
          const isSelected = currentStatus === tab.key;
          const count = counts ? counts[tab.key] : undefined;

          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isSelected}
              onClick={() => onSelectStatus(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <span>{tab.label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold rounded-full min-w-4.5 leading-none",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground border border-border/60"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full lg:w-80 shrink-0">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search order #, customer, seller, product, address..."
          aria-label="Search orders"
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
