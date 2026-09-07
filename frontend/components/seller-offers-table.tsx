import { SellerOffer } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Check, Truck } from "lucide-react";

interface SellerOffersTableProps {
  offers: SellerOffer[];
  selectedOfferId: string | null;
  onSelectOffer: (offerId: string) => void;
}

export function SellerOffersTable({
  offers,
  selectedOfferId,
  onSelectOffer,
}: SellerOffersTableProps) {
  if (!offers || offers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No merchants have listed offers for this product yet.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      <table
        className="w-full min-w-[600px] text-left text-sm"
        role="table"
        aria-label="Seller offers comparison table"
      >
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                Seller
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Price
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Delivery
              </th>
              <th scope="col" className="px-6 py-3 font-medium">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-right font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {offers.map((offer) => {
              const isSelected = selectedOfferId === offer.seller_product_id;
              const isOutOfStock = offer.stock <= 0;

              return (
                <tr
                  key={offer.seller_product_id}
                  className={`transition-colors ${
                    isSelected
                      ? "bg-primary/5 font-medium"
                      : isOutOfStock
                        ? "opacity-60 bg-muted/10"
                        : "hover:bg-muted/30"
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{offer.seller_name}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                          <Check className="h-3 w-3" aria-hidden="true" />{" "}
                          Selected
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    ${offer.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Truck
                        className="h-3.5 w-3.5 text-muted-foreground/70"
                        aria-hidden="true"
                      />
                      {offer.estimated_delivery_days != null
                        ? `${offer.estimated_delivery_days} days`
                        : "Standard delivery"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isOutOfStock ? (
                      <span className="text-destructive font-medium text-xs">
                        Out of stock
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                        {offer.stock} available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      disabled={isOutOfStock || isSelected}
                      onClick={() => onSelectOffer(offer.seller_product_id)}
                      aria-label={`Select offer from ${offer.seller_name} for $${offer.price.toFixed(2)}`}
                    >
                      {isSelected ? "Selected" : "Select Offer"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
}
