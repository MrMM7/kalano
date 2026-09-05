import Link from "next/link";
import { ProductListItem } from "@/types/product";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { id, name, brand, image_url, cheapest_offer } = product;

  return (
    <Link
      href={`/products/${id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View details for ${name} by ${brand}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/30 flex items-center justify-center">
        {image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image_url}
            alt={name}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <svg
              className="h-12 w-12 stroke-[1.5] text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span className="mt-1 text-xs">No Image</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {brand}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>

        <div className="mt-4 pt-2 border-t border-border/50 flex items-baseline justify-between">
          {cheapest_offer ? (
            <div>
              <span className="text-xs text-muted-foreground mr-1">From</span>
              <span className="text-lg font-bold text-foreground">
                ${cheapest_offer.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
