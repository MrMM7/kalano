import {
  CartItemCreateInput,
  CartItemDeleteResponse,
  CartItemResponse,
  CartItemUpdateInput,
  CartResponse,
} from "@/types/cart";
import { ApiError } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getCart(): Promise<CartResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cart`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      throw {
        error: {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status code ${res.status}`,
        },
      } as ApiError;
    }
    throw errorBody;
  }

  return res.json();
}

export async function addToCart(
  data: CartItemCreateInput
): Promise<CartItemResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      throw {
        error: {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status code ${res.status}`,
        },
      } as ApiError;
    }
    throw errorBody;
  }

  return res.json();
}

export async function updateCartItemQuantity(
  itemId: number,
  data: CartItemUpdateInput
): Promise<CartItemResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cart/items/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      throw {
        error: {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status code ${res.status}`,
        },
      } as ApiError;
    }
    throw errorBody;
  }

  return res.json();
}

export async function deleteCartItem(
  itemId: number
): Promise<CartItemDeleteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/cart/items/${itemId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      throw {
        error: {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status code ${res.status}`,
        },
      } as ApiError;
    }
    throw errorBody;
  }

  return res.json();
}
