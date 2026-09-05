export type DeliveryStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface OrderItem {
  id: number;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_image_url: string | null;
  seller_id: string;
  seller_name: string;
  bought_price: number;
  quantity: number;
  subtotal: number;
  delivery_types: DeliveryStatus;
  address: string;
  created_at: string;
}

export interface OrderListResponse {
  orders: OrderItem[];
  total_orders: number;
}
