# Spec: Merchant Create Product and Offer Endpoint

> **Roadmap Reference**: Phase 6, Step 6.3 — Merchant: create new product + offer
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 003 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Merchant Create Product and Offer Endpoint allows an authenticated merchant to introduce a completely new product into the Kalano catalog while simultaneously establishing their initial seller offer for it. When a merchant wishes to list an item not yet available on the platform, this endpoint handles multipart form submission of the product's metadata (name, description, brand), optional image file upload to Supabase Storage, and the merchant's commercial terms (price, inventory stock, delivery estimate).

## 2. Dependencies

- Depends on: `specs/001-merchant-list-offers-endpoint/` (provides base dashboard router and models) and `specs/002-merchant-add-offer-endpoint/`.

## 3. Functional Requirements

### 3.1 — Authorization & Role Verification
- [ ] Endpoint requires authentication via `get_current_user`.
- [ ] Endpoint verifies caller has the `merchant` role. Non-merchants receive HTTP 403 Forbidden with error code `FORBIDDEN`.
- [ ] Unauthenticated callers receive HTTP 401 Unauthorized.

### 3.2 — Multipart Request Handling & Validation
- [ ] Request accepted as `multipart/form-data`.
- [ ] Required text fields:
  - `name`: Non-empty string (product title).
  - `description`: Non-empty string (product details).
  - `brand`: Non-empty string (manufacturer / brand).
  - `price`: Numeric float strictly greater than 0.
  - `stock`: Integer greater than or equal to 0.
- [ ] Optional fields:
  - `estimated_delivery_days`: Integer greater than or equal to 1, or omitted/null.
  - `image`: Optional uploaded image binary file (e.g. image/jpeg, image/png, image/webp).
- [ ] Invalidation (e.g. negative price or empty name) returns HTTP 422 Unprocessable Entity.

### 3.3 — Image Storage Integration
- [ ] If an `image` file is provided:
  - Read file bytes and generate a sanitized, unique filename (using UUID prefix) in the `products` storage bucket.
  - Upload file bytes to the Supabase Storage bucket named `products`.
  - Retrieve the resulting public URL and store it as `image_url` on the product record.
- [ ] If no image is provided, `image_url` defaults to null.

### 3.4 — Database Persistence
- [ ] Insert a new row into the `products` table containing `id` (UUID), `name`, `description`, `brand`, `image_url`, and `created_at`.
- [ ] Insert a new row into the `seller_products` table linking `product_id` to the created product ID, `seller_id` to the authenticated merchant ID, `price`, `stock`, `estimated_delivery_days`, and `created_at`.
- [ ] Both operations succeed together. Return HTTP 201 Created containing both product information and offer information.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated merchant can upload a product with an image and offer terms, receiving HTTP 201 with created product and offer records.
- [ ] AC2: Authenticated merchant can create a product without an image, resulting in `image_url: null` with HTTP 201.
- [ ] AC3: Submitting invalid field values (empty name, price <= 0, stock < 0) returns HTTP 422.
- [ ] AC4: Non-merchant users receive HTTP 403 Forbidden.
- [ ] AC5: Unauthenticated users receive HTTP 401 Unauthorized.
- [ ] AC6: The created product immediately appears in the general catalog (`GET /api/v1/products`) and in the merchant's offers (`GET /api/v1/dashboard/offers`).

## 5. API Contract

### `POST /api/v1/dashboard/products`

**Summary**: Create new product and initial seller offer

**Description**: Accepts multipart form data to create a new catalog product, optionally uploads an image to Supabase Storage, and attaches an initial seller offer owned by the authenticated merchant.

**Request Content-Type**: `multipart/form-data`

**Form Fields**:
- `name`: string (required) — Product title
- `description`: string (required) — Full product description
- `brand`: string (required) — Brand or manufacturer name
- `price`: float (required, > 0) — Seller unit price in USD
- `stock`: integer (required, >= 0) — Available inventory count
- `estimated_delivery_days`: integer (optional, >= 1) — Transit time in calendar days
- `image`: file (optional) — Product photo (JPEG, PNG, WEBP)

**Success Response** (`201 Created`):
```json
{
  "product": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Organic Roasted Coffee Beans",
    "description": "Medium roast whole bean arabica coffee.",
    "brand": "Highland Roasters",
    "image_url": "https://supabase-storage-url/products/sample.jpg",
    "created_at": "2026-09-06T12:00:00Z"
  },
  "offer": {
    "id": "8fa85f64-5717-4562-b3fc-2c963f66afa9",
    "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "seller_id": "9da85f64-5717-4562-b3fc-2c963f66afa8",
    "price": 18.5,
    "stock": 40,
    "estimated_delivery_days": 2,
    "created_at": "2026-09-06T12:00:00Z"
  }
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | `IMAGE_UPLOAD_FAILED` | Failed to upload image to Supabase Storage |
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN` | User does not have the merchant role |
| 422 | — | Missing or invalid form fields |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

## 6. UI/UX Requirements

- Frontend flow is specified in Spec 006 (`specs/006-seller-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| No image uploaded in multipart form | Proceed successfully with `image_url: null` |
| Image upload service fails / storage unavailable | Return HTTP 400 with code `IMAGE_UPLOAD_FAILED` and descriptive message |
| Unsupported file extension or mime type | Reject with HTTP 422 validation error |
| Non-merchant user attempts creation | Return HTTP 403 `FORBIDDEN` |
| Negative price or stock value | Reject with HTTP 422 validation error |

## 8. Out of Scope

- ❌ Bulk product uploads via CSV/spreadsheets.
- ❌ Multiple image galleries per product (single primary image supported).
- ❌ Modifying catalog product details after creation (handled separately if needed).

## 9. Constitution Compliance

- ✅ All business logic and Supabase Storage interactions run in FastAPI, never in Next.js (§4.1, §11).
- ✅ Product images stored in Supabase Storage buckets (§11).
- ✅ Standard error envelope used on failure (§4.4).
- ✅ Role-based check enforces `user_role == "merchant"` (§2).
- ✅ Pytest tests cover success with/without image, storage failure, and role access (§14).

## 10. Open Questions

- None. Multipart approach confirmed during clarifying questions.
