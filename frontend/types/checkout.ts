export interface CheckoutPayload {
  address: string;
  save_address?: boolean;
}

export interface CheckoutOrderItem {
  id: number;
  product_id: string;
  product_name: string;
  seller_id: string;
  seller_name: string;
  bought_price: number;
  quantity: number;
  subtotal: number;
  delivery_types: string;
  address: string;
  created_at: string;
}

export interface CheckoutResponse {
  order_ids: number[];
  orders: CheckoutOrderItem[];
  total_items: number;
  total_price: number;
  message: string;
}
