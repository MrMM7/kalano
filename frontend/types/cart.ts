export interface CartItem {
  id: number;
  seller_product_id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_image_url: string | null;
  seller_id: string;
  seller_name: string;
  unit_price: number;
  stock: number;
  estimated_delivery_days: number | null;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface CartResponse {
  id: number | null;
  user_id: string;
  items: CartItem[];
  total_items: number;
  total_price: number;
}

export interface CartItemCreateInput {
  seller_product_id: string;
  quantity: number;
}

export interface CartItemUpdateInput {
  quantity: number;
}

export interface CartItemResponse {
  id: number;
  cart_id: number;
  seller_product_id: string;
  quantity: number;
  created_at: string;
}

export interface CartItemDeleteResponse {
  message: string;
}
