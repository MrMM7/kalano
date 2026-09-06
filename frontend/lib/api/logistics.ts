import {
  LogisticsOrderItem,
  LogisticsStatusUpdateRequest,
} from "@/types/logistics";
import { ApiError } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
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

/**
 * Fetch all platform orders for logistics fulfillment, with optional status filtering.
 */
export async function fetchLogisticsOrders(
  status?: string
): Promise<LogisticsOrderItem[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/logistics/orders`);
  if (status && status !== "all") {
    url.searchParams.set("status", status);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  return handleResponse<LogisticsOrderItem[]>(res);
}

/**
 * Transition an order's fulfillment delivery status.
 */
export async function updateLogisticsOrderStatus(
  orderId: number,
  status: string
): Promise<LogisticsOrderItem> {
  const payload: LogisticsStatusUpdateRequest = { status };
  const res = await fetch(
    `${API_BASE_URL}/api/v1/logistics/orders/${orderId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  return handleResponse<LogisticsOrderItem>(res);
}
