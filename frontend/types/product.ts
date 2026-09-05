export interface CheapestOffer {
  seller_product_id: string;
  seller_id: string;
  seller_name: string;
  price: number;
  stock: number;
  estimated_delivery_days: number | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  image_url: string | null;
  cheapest_offer: CheapestOffer | null;
}

export interface ProductsListResponse {
  items: ProductListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetProductsParams {
  limit: number;
  offset: number;
  q?: string;
}

export interface SellerOffer {
  seller_product_id: string;
  seller_id: string;
  seller_name: string;
  price: number;
  stock: number;
  estimated_delivery_days: number | null;
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  description: string;
  brand: string;
  image_url: string | null;
  created_at?: string | null;
  cheapest_offer: CheapestOffer | null;
  offers: SellerOffer[];
}
