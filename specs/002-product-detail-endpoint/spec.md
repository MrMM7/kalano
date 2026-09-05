# Spec: Product Detail Endpoint

> **Roadmap Reference**: Phase 3, Step 3.2 — Product detail endpoint
> **Branch**: `feat/product-catalog`
> **Spec**: 002 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Product Detail endpoint provides complete information for an individual product in the Kalano catalog. It enables buyers to view the comprehensive product specification along with every seller offer available for that product. In Kalano's multi-vendor marketplace, multiple merchants can list the same physical item with differing prices, stock levels, and delivery turnaround times. This endpoint returns the product metadata and all active seller offers sorted in ascending order of price, allowing buyers to either accept the lowest in-stock offer or choose an alternative seller based on delivery speed or preference.

## 2. Dependencies

- Depends on: `specs/001-list-products-endpoint/` (shares the `products.py` router, product models, and service layer)
- Database schema dependencies: Predefined `products`, `seller_products`, and `users` tables

## 3. Functional Requirements

### 3.1 — Path Parameter & Validation

- [ ] The endpoint must accept a required `product_id` path parameter.
- [ ] `product_id` must be validated as a valid UUID string format.
- [ ] If `product_id` is not a valid UUID, return HTTP status code 422 Unprocessable Entity.

### 3.2 — Product Retrieval & Offer Aggregation

- [ ] Fetch the product record from the `products` table matching `id = product_id`.
- [ ] If no product exists with the specified `product_id`, return HTTP status code 404 with the standard error envelope (`code: "RESOURCE_NOT_FOUND"`).
- [ ] Retrieve all seller offers from the `seller_products` table where `product_id = product_id`.
- [ ] Join each seller offer with the `users` table on `seller_products.seller_id = users.id` to include the seller's `display_name`.
- [ ] Sort all returned seller offers by `price` ascending. If prices are identical, sort by `estimated_delivery_days` ascending, followed by offer `id` ascending.
- [ ] Calculate the `cheapest_offer`: the offer with the lowest `price` that has `stock > 0`. If no offers have `stock > 0` (or if no offers exist at all), set `cheapest_offer` to `null`.

### 3.3 — Output Schema

- [ ] Return HTTP status code 200 with an envelope containing:
  - `id`: UUID string of the product.
  - `name`: Product title string.
  - `description`: Detailed description string.
  - `brand`: Brand or manufacturer string.
  - `image_url`: Public image URL string or null.
  - `created_at`: ISO 8601 creation timestamp string.
  - `cheapest_offer`: Object with cheapest in-stock seller offer details, or null if out of stock.
  - `offers`: List of all seller offers for this product, sorted by price ascending.

## 4. Acceptance Criteria

- [ ] AC1: `GET /api/v1/products/{valid_existing_id}` returns HTTP 200 with product metadata and an array of all seller offers.
- [ ] AC2: All items in `offers` array are sorted strictly by `price` in ascending order.
- [ ] AC3: Each offer contains `seller_product_id`, `seller_id`, `seller_name`, `price`, `stock`, and `estimated_delivery_days`.
- [ ] AC4: `cheapest_offer` accurately points to the cheapest offer with `stock > 0`, or `null` if all offers are out of stock or empty.
- [ ] AC5: Querying a non-existent UUID returns HTTP 404 with standard error code `RESOURCE_NOT_FOUND`.
- [ ] AC6: Querying an invalid UUID string format returns HTTP 422.
- [ ] AC7: Pytest test suite verifies all success, empty-offer, out-of-stock, and error scenarios.
- [ ] AC8: Any local server launched for testing or verification must have an automatic timeout configured to kill the process after X seconds (maximum 30 seconds).

## 5. API Contract

### `GET /api/v1/products/{product_id}`

**Summary**: Get product details and all seller offers

**Description**: Retrieves details for a specific catalog product along with all associated seller offers sorted by price ascending. Highlights the cheapest in-stock offer if available.

**Path Parameters**:
- `product_id` (UUID string, required): Unique identifier of the product.

**Success Response** (`200 OK`):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Wireless Noise-Cancelling Headphones",
  "description": "High-fidelity audio with adaptive active noise cancellation and 30-hour battery life.",
  "brand": "SoundWave",
  "image_url": "https://example.com/images/headphones.jpg",
  "created_at": "2026-09-01T12:00:00Z",
  "cheapest_offer": {
    "seller_product_id": "7ca85f64-5717-4562-b3fc-2c963f66afa7",
    "seller_id": "9da85f64-5717-4562-b3fc-2c963f66afa8",
    "seller_name": "AudioTech Store",
    "price": 149.99,
    "stock": 25,
    "estimated_delivery_days": 3
  },
  "offers": [
    {
      "seller_product_id": "7ca85f64-5717-4562-b3fc-2c963f66afa7",
      "seller_id": "9da85f64-5717-4562-b3fc-2c963f66afa8",
      "seller_name": "AudioTech Store",
      "price": 149.99,
      "stock": 25,
      "estimated_delivery_days": 3
    },
    {
      "seller_product_id": "8da85f64-5717-4562-b3fc-2c963f66afa9",
      "seller_id": "1fa85f64-5717-4562-b3fc-2c963f66afb0",
      "seller_name": "FastExpress Electronics",
      "price": 159.00,
      "stock": 10,
      "estimated_delivery_days": 1
    },
    {
      "seller_product_id": "2ba85f64-5717-4562-b3fc-2c963f66afb1",
      "seller_id": "3ca85f64-5717-4562-b3fc-2c963f66afb2",
      "seller_name": "DiscountGadgets",
      "price": 139.99,
      "stock": 0,
      "estimated_delivery_days": 5
    }
  ]
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 404 | `RESOURCE_NOT_FOUND` | Product with the given ID does not exist |
| 422 | `VALIDATION_ERROR` | Provided `product_id` is not a valid UUID |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected backend or database error |

## 6. UI/UX Requirements

_This spec is backend-only. User interface consumers are covered in Spec 005._

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Product ID does not exist in database | Return HTTP 404 with error body `{"error": {"code": "RESOURCE_NOT_FOUND", "message": "Product with ID '<product_id>' was not found."}}` |
| Malformed UUID string passed in path | Return HTTP 422 validation error |
| Product exists but has zero seller offers | Return HTTP 200 with `offers: []` and `cheapest_offer: null` |
| Product has offers but all have `stock == 0` | Return HTTP 200 with all offers listed in `offers` array, but `cheapest_offer: null` |
| Two offers have the identical lowest price | Tie-break using `estimated_delivery_days` ascending |

## 8. Out of Scope

- ❌ Creating or adding new seller offers (handled in Phase 6: Merchant Dashboard)
- ❌ Modifying existing seller offers or stock (handled in Phase 6: Merchant Dashboard)
- ❌ Adding product to cart (handled in Phase 4: Cart)

## 9. Constitution Compliance

- ✅ All business logic and queries reside in FastAPI (§4.1)
- ✅ Auto-generated OpenAPI documentation includes summary, description, and tag `Products` (§4.3)
- ✅ Pydantic models with field-level descriptions and examples (§4.3)
- ✅ Standard error envelope used for 404 and 500 errors (§4.4)
- ✅ All endpoints prefixed with `/api/v1/` (§4.3)
- ✅ Pytest tests covering all response scenarios (§14)

## 10. Open Questions

- None.
