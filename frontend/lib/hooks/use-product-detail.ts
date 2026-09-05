import { useQuery } from "@tanstack/react-query";
import { getProductById } from "@/lib/api/products";
import { ProductDetailResponse } from "@/types/product";

export function useProductDetail(productId: string) {
  return useQuery<ProductDetailResponse, Error>({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: Boolean(productId),
    retry: (failureCount, error: unknown) => {
      // Do not retry on 404 not found errors
      const err = error as { error?: { code?: string }; message?: string };
      if (
        err?.error?.code === "NOT_FOUND" ||
        err?.error?.code === "RESOURCE_NOT_FOUND" ||
        err?.message?.includes("404")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
