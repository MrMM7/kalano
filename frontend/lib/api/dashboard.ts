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

export async function fetchMerchantOffers(): Promise<MerchantOffer[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/offers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return handleResponse<MerchantOffer[]>(res);
}

export async function createMerchantOffer(
  payload: CreateOfferPayload
): Promise<MerchantOfferResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<MerchantOfferResponse>(res);
}

export async function createProductAndOffer(
  payload: CreateProductAndOfferPayload
): Promise<MerchantProductCreateResponse> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("brand", payload.brand);
  formData.append("price", payload.price.toString());
  formData.append("stock", payload.stock.toString());
  if (payload.estimated_delivery_days != null) {
    formData.append(
      "estimated_delivery_days",
      payload.estimated_delivery_days.toString()
    );
  }
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/dashboard/products`, {
    method: "POST",
    // Note: Do not set Content-Type header so the browser sets multipart/form-data with boundary
    credentials: "include",
    body: formData,
  });
  return handleResponse<MerchantProductCreateResponse>(res);
}

export async function updateMerchantOffer(
  offerId: string,
  payload: UpdateOfferPayload
): Promise<MerchantOfferResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/dashboard/offers/${offerId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<MerchantOfferResponse>(res);
}

export async function deleteMerchantOffer(
  offerId: string
): Promise<MerchantOfferDeleteResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/dashboard/offers/${offerId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );
  return handleResponse<MerchantOfferDeleteResponse>(res);
}

export async function fetchMerchantOrders(
  statusFilter?: string
): Promise<MerchantOrder[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/dashboard/orders`);
  if (statusFilter && statusFilter !== "all") {
    url.searchParams.set("status", statusFilter);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return handleResponse<MerchantOrder[]>(res);
}

export async function updateMerchantOrderStatus(
  orderId: number,
  newStatus: string
): Promise<MerchantOrder> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/dashboard/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    }
  );
  return handleResponse<MerchantOrder>(res);
}
