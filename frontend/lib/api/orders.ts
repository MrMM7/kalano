import { OrderListResponse } from "@/types/order";
import { ApiError } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchBuyerOrders(): Promise<OrderListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders`, {
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
