"use client";

import { useState } from "react";
import { MerchantOffer } from "@/types/dashboard";
import { useDeleteOffer } from "@/lib/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface DeleteOfferDialogProps {
  offer: MerchantOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteOfferDialog({
  offer,
  isOpen,
  onClose,
}: DeleteOfferDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteOfferMutation = useDeleteOffer();

  if (!isOpen || !offer) {
    return null;
  }

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      await deleteOfferMutation.mutateAsync(offer.id);
      toast.success("Offer deleted successfully.");
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { error?: { message?: string } };
      setErrorMessage(
        errorObj.error?.message || "Failed to delete offer. Please try again."
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-offer-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl text-card-foreground">
        <button
          type="button"
          onClick={onClose}
          disabled={deleteOfferMutation.isPending}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-destructive">
          <div className="rounded-full bg-destructive/15 p-2.5">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 id="delete-offer-dialog-title" className="text-xl font-bold">
            Delete Listing Offer
          </h2>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Are you sure you want to remove your offer for{" "}
          <strong className="text-foreground">{offer.product_name}</strong>?
          Customers will no longer be able to purchase this product from you.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-5 border-t border-border mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteOfferMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteOfferMutation.isPending}
            className="gap-2"
          >
            {deleteOfferMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Delete Offer
          </Button>
        </div>
      </div>
    </div>
  );
}
