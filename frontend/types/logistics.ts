/**
 * Type definitions for logistics orders and fulfillment state transitions.
 *
 * delivered_types enum:
 * - pending: Order placed, waiting for merchant confirmation or logistics pickup.
 * - confirmed: Merchant confirmed / ready for logistics courier pickup.
 * - shipped: In-transit with logistics courier for customer delivery.
 * - delivered: Completed delivery to customer destination.
 * - cancelled: Cancelled order prior to completion (stock restored to merchant).
 * - returned: Customer returned delivery after receipt.
 */

export type LogisticsDeliveryStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned";

export interface LogisticsOrderItem {
  id: number;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_image_url: string | null;
  seller_id: string;
  seller_name: string;
  buyer_id: string | null;
  buyer_name: string;
  address: string;
  bought_price: number;
  quantity: number;
  subtotal: number;
  delivery_types: string;
  created_at: string;
}

export interface LogisticsStatusUpdateRequest {
  status: string;
}
