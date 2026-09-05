import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addToCart,
  deleteCartItem,
  getCart,
  updateCartItemQuantity,
} from "@/lib/api/cart";
import {
  CartItemCreateInput,
  CartItemDeleteResponse,
  CartItemResponse,
  CartItemUpdateInput,
  CartResponse,
} from "@/types/cart";

export function useCart() {
  return useQuery<CartResponse, Error>({
    queryKey: ["cart"],
    queryFn: getCart,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation<CartItemResponse, Error, CartItemCreateInput>({
    mutationFn: (data: CartItemCreateInput) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation<
    CartItemResponse,
    Error,
    { itemId: number; data: CartItemUpdateInput }
  >({
    mutationFn: ({ itemId, data }) => updateCartItemQuantity(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useDeleteCartItem() {
  const queryClient = useQueryClient();

  return useMutation<CartItemDeleteResponse, Error, number>({
    mutationFn: (itemId: number) => deleteCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
