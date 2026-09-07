"use client";

import { useState } from "react";
import Image from "next/image";
import { MerchantOffer } from "@/types/dashboard";
import { useMerchantOffers } from "@/lib/hooks/use-dashboard";
import { EditOfferDialog } from "./edit-offer-dialog";
import { DeleteOfferDialog } from "./delete-offer-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  Edit2,
  Package,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MyOffersTabProps {
  onNavigateToAddOffer?: () => void;
}

export function MyOffersTab({ onNavigateToAddOffer }: MyOffersTabProps) {
  const { offers, isLoading, isError, error, refetch } = useMerchantOffers();

  const [editingOffer, setEditingOffer] = useState<MerchantOffer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<MerchantOffer | null>(
    null
  );

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="offers-loading">
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        data-testid="offers-error-state"
        className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center max-w-xl mx-auto my-8 space-y-4"
      >
        <div className="rounded-full bg-destructive/20 p-3 w-12 h-12 mx-auto flex items-center justify-center text-destructive">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Failed to load your offers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message ||
              "An unexpected error occurred while fetching your offers. Please try again."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="gap-2 border-destructive/30 hover:bg-destructive/20"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          <span>Try Again</span>
        </Button>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div
        data-testid="empty-offers-state"
        className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center max-w-2xl mx-auto my-8 space-y-4"
      >
        <div className="rounded-full bg-primary/10 p-4 w-16 h-16 mx-auto flex items-center justify-center text-primary">
          <Package className="h-8 w-8" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            No Active Product Offers
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You haven&apos;t added any product listings to your inventory yet.
            Search the catalog or create a new product to start selling.
          </p>
        </div>
        {onNavigateToAddOffer && (
          <Button onClick={onNavigateToAddOffer} className="gap-2 mt-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Your First Offer</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="offers-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Offers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your pricing, inventory stock, and delivery times (
            {offers.length} {offers.length === 1 ? "offer" : "offers"})
          </p>
        </div>
        {onNavigateToAddOffer && (
          <Button onClick={onNavigateToAddOffer} size="sm" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Offer</span>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table
          className="w-full text-left border-collapse"
          data-testid="offers-table"
          aria-label="Merchant offers table"
        >
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
              <th scope="col" className="py-3.5 px-4">
                Product
              </th>
              <th scope="col" className="py-3.5 px-4">
                Price
              </th>
              <th scope="col" className="py-3.5 px-4">
                Stock
              </th>
              <th scope="col" className="py-3.5 px-4">
                Est. Delivery
              </th>
              <th
                scope="col"
                aria-label="Actions"
                className="py-3.5 px-4 text-right"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {offers.map((offer) => {
              const stockStatus =
                offer.stock === 0
                  ? {
                      label: "Out of Stock",
                      className:
                        "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
                    }
                  : offer.stock <= 5
                    ? {
                        label: `Low Stock (${offer.stock})`,
                        className:
                          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
                      }
                    : {
                        label: `In Stock (${offer.stock})`,
                        className:
                          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
                      };

              return (
                <tr
                  key={offer.id}
                  data-testid={`offer-row-${offer.id}`}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                        {offer.product_image_url ? (
                          <Image
                            src={offer.product_image_url}
                            alt={offer.product_name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <Package
                            className="h-6 w-6 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <p className="font-semibold text-foreground truncate">
                          {offer.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {offer.product_brand}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-semibold text-foreground">
                    ${offer.price.toFixed(2)}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        stockStatus.className
                      )}
                    >
                      {stockStatus.label}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {offer.estimated_delivery_days ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {offer.estimated_delivery_days}{" "}
                        {offer.estimated_delivery_days === 1 ? "day" : "days"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/70">
                        Not specified
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingOffer(offer)}
                        className="h-8 px-2.5 gap-1.5 text-xs"
                        aria-label={`Edit offer for ${offer.product_name}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingOffer(offer)}
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete offer for ${offer.product_name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditOfferDialog
        offer={editingOffer}
        isOpen={Boolean(editingOffer)}
        onClose={() => setEditingOffer(null)}
      />

      <DeleteOfferDialog
        offer={deletingOffer}
        isOpen={Boolean(deletingOffer)}
        onClose={() => setDeletingOffer(null)}
      />
    </div>
  );
}
