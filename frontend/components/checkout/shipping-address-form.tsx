"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface ShippingAddressFormProps {
  address: string;
  onAddressChange: (address: string) => void;
  saveAddress: boolean;
  onSaveAddressChange: (save: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function ShippingAddressForm({
  address,
  onAddressChange,
  saveAddress,
  onSaveAddressChange,
  error,
  disabled = false,
}: ShippingAddressFormProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-lg font-bold text-foreground">
            Shipping Address
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="shipping-address"
            className="block text-sm font-medium text-foreground"
          >
            Delivery Address
            <span className="sr-only"> (Delivery Destination)</span>{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="shipping-address"
            rows={3}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            disabled={disabled}
            placeholder="Street address, apartment, city, state, zip code..."
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "address-error" : undefined}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
          {error && (
            <p
              id="address-error"
              role="alert"
              className="text-xs font-medium text-destructive mt-1"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="save-address"
            checked={saveAddress}
            onChange={(e) => onSaveAddressChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
          <label
            htmlFor="save-address"
            className="text-sm text-muted-foreground select-none cursor-pointer"
          >
            Save this shipping address to my profile for future orders
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
