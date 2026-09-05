import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api/products";
import { GetProductsParams, ProductsListResponse } from "@/types/product";

export function useProducts(params: GetProductsParams) {
  return useQuery<ProductsListResponse, Error>({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
    placeholderData: (previousData) => previousData,
  });
}
