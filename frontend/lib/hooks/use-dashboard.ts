import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMerchantOffer,
  createProductAndOffer,
  deleteMerchantOffer,
  fetchMerchantOffers,
  fetchMerchantOrders,
  updateMerchantOffer,
  updateMerchantOrderStatus,
} from "@/lib/api/dashboard";
import {
  CreateOfferPayload,
  CreateProductAndOfferPayload,
  MerchantOffer,
  MerchantOfferDeleteResponse,
  MerchantOfferResponse,
  MerchantOrder,
  MerchantProductCreateResponse,
  UpdateOfferPayload,
} from "@/types/dashboard";

export function useMerchantOffers() {
  const query = useQuery<MerchantOffer[], Error>({
    queryKey: ["merchant-offers"],
    queryFn: fetchMerchantOffers,
  });

  return {
    ...query,
    offers: query.data ?? [],
    totalOffers: query.data?.length ?? 0,
  };
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation<MerchantOfferResponse, Error, CreateOfferPayload>({
    mutationFn: (payload: CreateOfferPayload) => createMerchantOffer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
    },
  });
}

export function useCreateProductAndOffer() {
  const queryClient = useQueryClient();

  return useMutation<
    MerchantProductCreateResponse,
    Error,
    CreateProductAndOfferPayload
  >({
    mutationFn: (payload: CreateProductAndOfferPayload) =>
      createProductAndOffer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation<
    MerchantOfferResponse,
    Error,
    { offerId: string; payload: UpdateOfferPayload }
  >({
    mutationFn: ({ offerId, payload }) =>
      updateMerchantOffer(offerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation<MerchantOfferDeleteResponse, Error, string>({
    mutationFn: (offerId: string) => deleteMerchantOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-offers"] });
    },
  });
}

export function useMerchantOrders(statusFilter?: string) {
  const query = useQuery<MerchantOrder[], Error>({
    queryKey: ["merchant-orders", statusFilter ?? "all"],
    queryFn: () => fetchMerchantOrders(statusFilter),
  });

  return {
    ...query,
    orders: query.data ?? [],
    totalOrders: query.data?.length ?? 0,
  };
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    MerchantOrder,
    Error,
    { orderId: number; status: string }
  >({
    mutationFn: ({ orderId, status }) =>
      updateMerchantOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
    },
  });
}
