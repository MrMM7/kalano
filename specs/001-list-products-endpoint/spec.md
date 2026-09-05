# Spec: List Products Endpoint

> **Roadmap Reference**: Phase 3, Step 3.1 — List products endpoint
> **Branch**: `feat/product-catalog`
> **Spec**: 001 of 005 in phase
> **Date**: 2026-09-05
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The List Products endpoint provides the core catalog discovery capability for Kalano. It allows buyers and visitors to browse available products with pagination and perform substring searches across product names and descriptions. In accordance with Kalano's marketplace model, each product in the listing displays its cheapest in-stock seller offer so buyers immediately see the best available price. If a product currently has no seller offers or all offers have zero stock, the product is still included in the listing but clearly marked as out of stock with null offer details.

## 2. Dependencies

- Depends on: None (this is the first spec in Phase 3)
- Database schema dependencies: Predefined `products`, `seller_products`, and `users` tables

## 3. Functional Requirements

### 3.1 — Query Parameters & Validation

- [ ] The endpoint must accept a required `limit` query parameter (integer) specifying the maximum number of items to return. Minimum allowed value is 1, maximum allowed value is 128.
- [ ] The endpoint must accept a required `offset` query parameter (integer) specifying the number of items to skip for pagination. Minimum allowed value is 0.
- [ ] The endpoint must accept an optional `q` query parameter (string) for case-insensitive substring search.
- [ ] Requests missing either `limit` or `offset` must be rejected with HTTP status code 422 Unprocessable Entity.
- [ ] Requests with `limit` less than 1 or greater than 128 must be rejected with HTTP status code 422.
- [ ] Requests with `offset` less than 0 must be rejected with HTTP status code 422.

### 3.2 — Search & Filtering

- [ ] When `q` is provided, the query must perform a case-insensitive substring match (ILIKE) across `products.name` and `products.description`.
- [ ] Search terms must be trimmed of leading and trailing whitespace.
- [ ] If `q` is empty or only whitespace, treat it as not provided (return all products within pagination bounds).
- [ ] When `q` matches no products, return an empty `items` array with `total` equal to 0.

### 3.3 — Cheapest In-Stock Seller Offer Calculation

- [ ] For each product matching the query and pagination, find all associated rows in `seller_products` where `stock > 0`.
- [ ] Select the offer with the lowest `price`. If multiple in-stock offers share the lowest price, select the one with the lowest estimated delivery days, breaking further ties by earliest created offer.
- [ ] Join with the `users` table using `seller_products.seller_id` to retrieve the seller's `display_name`.
- [ ] If a product has no offers, or all associated offers have `stock == 0`, the `cheapest_offer` field must be `null`.

### 3.4 — Pagination & Output Metadata

- [ ] Return a paginated response envelope containing `items`, `total`, `limit`, and `offset`.
- [ ] `total` must reflect the total count of products matching the search criteria before applying `limit` and `offset`.
- [ ] `items` must contain the array of products for the requested page slice, ordered deterministically (e.g. by product `created_at` descending).

## 4. Acceptance Criteria

- [ ] AC1: `GET /api/v1/products?limit=10&offset=0` returns HTTP 200 with paginated product items and total count.
- [ ] AC2: Each returned product contains `id`, `name`, `description`, `brand`, `image_url`, and either a populated `cheapest_offer` object or `null`.
- [ ] AC3: If a product has in-stock offers, `cheapest_offer` contains `seller_product_id`, `seller_id`, `seller_name`, `price`, `stock`, and `estimated_delivery_days`.
- [ ] AC4: Out-of-stock products or products with no sellers return `cheapest_offer: null`.
- [ ] AC5: Providing `?q=searchterm` filters products by substring matching on name or description.
- [ ] AC6: Omitting `limit` or `offset` returns HTTP 422 with validation errors.
- [ ] AC7: Automated Pytest test suite verifies all scenarios and passes cleanly.
- [ ] AC8: Any local server launched for testing or verification must have an automatic timeout configured to kill the process after X seconds (maximum 30 seconds).

## 5. API Contract

### `GET /api/v1/products`

**Summary**: List catalog products with cheapest offer

**Description**: Retrieves a paginated list of catalog products. Supports case-insensitive substring searching on product name and description via query parameter `q`. Each product includes its cheapest available in-stock seller offer, or null if out of stock. `limit` and `offset` are required parameters.

**Query Parameters**:
- `limit` (integer, required): Number of records to return (1 to 100).
- `offset` (integer, required): Number of records to skip (0 or greater).
- `q` (string, optional): Search keyword to match against product name or description.

**Success Response** (`200 OK`):
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Wireless Noise-Cancelling Headphones",
      "description": "High-fidelity audio with adaptive active noise cancellation.",
      "brand": "SoundWave",
      "image_url": "https://example.com/images/headphones.jpg",
      "cheapest_offer": {
        "seller_product_id": "7ca85f64-5717-4562-b3fc-2c963f66afa7",
        "seller_id": "9da85f64-5717-4562-b3fc-2c963f66afa8",
        "seller_name": "AudioTech Store",
        "price": 149.99,
        "stock": 25,
        "estimated_delivery_days": 3
      }
    },
    {
      "id": "4ba85f64-5717-4562-b3fc-2c963f66afa9",
      "name": "Mechanical Gaming Keyboard",
      "description": "Tactile mechanical switches with customizable RGB backlighting.",
      "brand": "KeyCraft",
      "image_url": null,
      "cheapest_offer": null
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 422 | `VALIDATION_ERROR` | Missing or invalid query parameter (`limit` or `offset` out of bounds or missing) |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected backend or database error |

## 6. UI/UX Requirements

_This spec is backend-only. User interface consumers are covered in Spec 003 and Spec 004._

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| `limit` parameter omitted | Return HTTP 422 validation error indicating `limit` is required |
| `offset` parameter omitted | Return HTTP 422 validation error indicating `offset` is required |
| `limit` is 0 or negative | Return HTTP 422 validation error specifying minimum limit of 1 |
| `limit` exceeds 100 | Return HTTP 422 validation error specifying maximum limit of 100 |
| `offset` is negative | Return HTTP 422 validation error specifying minimum offset of 0 |
| `q` contains special characters or whitespace | Trim whitespace; execute ILIKE match safely without injection |
| No products match search query `q` | Return HTTP 200 with empty `items` array `[]` and `total: 0` |
| Product exists but all offers have `stock == 0` | Include product in `items`, with `cheapest_offer` set to `null` |
| Product exists with multiple in-stock offers | Select offer with lowest `price`, break ties by lowest `estimated_delivery_days` |
| Database connection error | Return HTTP 500 with standard error envelope |

## 8. Out of Scope

- ❌ Creating or updating products (covered in Phase 6: Merchant Dashboard)
- ❌ Creating or updating seller offers (covered in Phase 6: Merchant Dashboard)
- ❌ Category or attribute filtering (not in Phase 3 roadmap)
- ❌ Fuzzy search or full-text indexing engines like Elasticsearch or Algolia (Constitution §10 specifies simple ILIKE search)

## 9. Constitution Compliance

- ✅ All business logic and database queries live in FastAPI (§4.1)
- ✅ Auto-generated OpenAPI documentation includes summary, description, and tag `Products` (§4.3)
- ✅ Pydantic models with field-level descriptions and examples (§4.3)
- ✅ Standard error envelope used for API errors (§4.4)
- ✅ All endpoints prefixed with `/api/v1/` (§4.3)
- ✅ Strict naming conventions followed (`products_router.py`, `product_service.py`, `products.py` models) (§7)
- ✅ Pytest tests covering all query variants and validation errors (§14)

## 10. Open Questions

- None. Design parameters (required `limit` and `offset`, ILIKE query `q`, out-of-stock representation) have been confirmed.
