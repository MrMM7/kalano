export interface MerchantOffer {
  id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_description: string;
  product_image_url: string | null;
  price: number;
  stock: number;
  estimated_delivery_days: number | null;
  created_at: string | null;
}

export interface CreateOfferPayload {
  product_id: string;
  price: number;
  stock: number;
  estimated_delivery_days?: number | null;
}

export interface UpdateOfferPayload {
  price?: number;
  stock?: number;
  estimated_delivery_days?: number | null;
}

export interface MerchantOfferResponse {
  id: string;
  product_id: string;
  seller_id: string;
  price: number;
  stock: number;
  estimated_delivery_days: number | null;
  created_at: string | null;
}

export interface MerchantOfferDeleteResponse {
  message: string;
  id: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  brand: string;
  image_url: string | null;
  created_at: string | null;
}

export interface MerchantProductCreateResponse {
  product: ProductRecord;
  offer: MerchantOfferResponse;
}

export type MerchantOrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned";

export interface MerchantOrder {
  id: number;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_image_url: string | null;
  bought_price: number;
  quantity: number;
  total_price: number;
  status: MerchantOrderStatus | string;
  address: string;
  buyer_name: string | null;
  created_at: string | null;
}

export interface CreateProductAndOfferPayload {
  name: string;
  description: string;
  brand: string;
  price: number;
  stock: number;
  estimated_delivery_days?: number | null;
  image?: File | null;
}
