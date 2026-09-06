import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLogisticsOrders,
  updateLogisticsOrderStatus,
} from "@/lib/api/logistics";
import { LogisticsOrderItem } from "@/types/logistics";

export function useLogisticsOrders(status?: string) {
  const query = useQuery<LogisticsOrderItem[], Error>({
    queryKey: ["logistics-orders", status || "all"],
    queryFn: () => fetchLogisticsOrders(status),
  });

  return {
    ...query,
    orders: query.data ?? [],
    totalOrders: query.data?.length ?? 0,
  };
}

export function useUpdateLogisticsOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    LogisticsOrderItem,
    Error,
    { orderId: number; status: string }
  >({
    mutationFn: ({ orderId, status }) =>
      updateLogisticsOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistics-orders"] });
    },
  });
}
