"use client";

import { useState } from "react";
import { MerchantOffer } from "@/types/dashboard";
import { useUpdateOffer } from "@/lib/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface EditOfferDialogProps {
  offer: MerchantOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

interface EditOfferFormProps {
  offer: MerchantOffer;
  onClose: () => void;
}

function EditOfferForm({ offer, onClose }: EditOfferFormProps) {
  const [price, setPrice] = useState<string>(offer.price.toString());
  const [stock, setStock] = useState<string>(offer.stock.toString());
  const [deliveryDays, setDeliveryDays] = useState<string>(
    offer.estimated_delivery_days != null
      ? offer.estimated_delivery_days.toString()
      : ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateOfferMutation = useUpdateOffer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const parsedDelivery = deliveryDays.trim()
      ? parseInt(deliveryDays, 10)
      : null;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage("Price must be a valid number strictly greater than 0.");
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMessage("Stock must be a non-negative integer.");
      return;
    }

    if (
      parsedDelivery !== null &&
      (isNaN(parsedDelivery) || parsedDelivery < 1)
    ) {
      setErrorMessage("Estimated delivery days must be at least 1 day.");
      return;
    }

    try {
      await updateOfferMutation.mutateAsync({
        offerId: offer.id,
        payload: {
          price: parsedPrice,
          stock: parsedStock,
          estimated_delivery_days: parsedDelivery,
        },
      });
      toast.success("Offer updated successfully!");
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { error?: { message?: string } };
      setErrorMessage(
        errorObj.error?.message || "Failed to update offer. Please try again."
      );
    }
  };

  return (
    <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl text-card-foreground">
      <button
        type="button"
        onClick={onClose}
        disabled={updateOfferMutation.isPending}
        className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        aria-label="Close dialog"
      >
        <X className="h-5 w-5" />
      </button>

      <h2 id="edit-offer-dialog-title" className="text-xl font-bold">
        Edit Offer
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update price, stock, and delivery terms for{" "}
        <strong className="text-foreground">{offer.product_name}</strong>.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="edit-price"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Price ($) <span className="text-destructive">*</span>
          </label>
          <Input
            id="edit-price"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={updateOfferMutation.isPending}
            placeholder="e.g. 29.99"
          />
        </div>

        <div>
          <label
            htmlFor="edit-stock"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Available Stock <span className="text-destructive">*</span>
          </label>
          <Input
            id="edit-stock"
            type="number"
            step="1"
            min="0"
            required
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={updateOfferMutation.isPending}
            placeholder="e.g. 50"
          />
        </div>

        <div>
          <label
            htmlFor="edit-delivery"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Estimated Delivery Days (Optional)
          </label>
          <Input
            id="edit-delivery"
            type="number"
            step="1"
            min="1"
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(e.target.value)}
            disabled={updateOfferMutation.isPending}
            placeholder="e.g. 3"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateOfferMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateOfferMutation.isPending}
            className="gap-2"
          >
            {updateOfferMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export function EditOfferDialog({
  offer,
  isOpen,
  onClose,
}: EditOfferDialogProps) {
  if (!isOpen || !offer) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-offer-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <EditOfferForm key={offer.id} offer={offer} onClose={onClose} />
    </div>
  );
}
