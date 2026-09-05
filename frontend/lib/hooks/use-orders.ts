import { useQuery } from "@tanstack/react-query";
import { fetchBuyerOrders } from "@/lib/api/orders";
import { OrderListResponse } from "@/types/order";

export function useOrders() {
  const query = useQuery<OrderListResponse, Error>({
    queryKey: ["orders"],
    queryFn: fetchBuyerOrders,
  });

  return {
    ...query,
    orders: query.data?.orders ?? [],
    totalOrders: query.data?.total_orders ?? 0,
  };
}
