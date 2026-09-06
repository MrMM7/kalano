# Spec: Merchant List Offers Endpoint

> **Roadmap Reference**: Phase 6, Step 6.1 — Merchant: list my offers endpoint
> **Branch**: `feat/merchant-dashboard`
> **Spec**: 001 of 006 in phase
> **Date**: 2026-09-06
> **Status**: Draft
>
> **CRITICAL CONTENT RULE**: DO NOT write implementation code or logic blocks in this document.
> Everything must be written in **pure text** (natural language, tables, bullet points). Only mock code
> shapes (e.g. JSON request/response bodies) are allowed, but **mock logic is strictly prohibited**
> (no function bodies, control flow, loops, or algorithms). Custom enums MUST be explained in pure text.

---

## 1. Overview

The Merchant List Offers Endpoint allows an authenticated merchant to retrieve all product listings that they currently sell on the Kalano marketplace. This endpoint queries the `seller_products` database table filtered by the merchant's authenticated user ID and joins with the `products` table to provide complete product details (title, brand, image URL, and description). It establishes the foundation for the merchant dashboard's inventory and offer management view.

## 2. Dependencies

- Depends on: None (this is the first spec in Phase 6). It utilizes existing authentication dependencies (`get_current_user`), database client providers (`get_supabase_client`), and the predefined `seller_products` and `products` tables.

## 3. Functional Requirements

### 3.1 — Authentication & Authorization
- [ ] The endpoint must require user authentication via `get_current_user`.
- [ ] The endpoint must verify that the authenticated user possesses the `merchant` role.
- [ ] If an unauthenticated request is received, the endpoint must return HTTP 401 Unauthorized with error code `MISSING_TOKEN` or `INVALID_TOKEN`.
- [ ] If an authenticated user does not have the `merchant` role (e.g., has `buyer` or `logistics` role), the endpoint must return HTTP 403 Forbidden with error code `FORBIDDEN`.

### 3.2 — Data Retrieval & Joining
- [ ] The endpoint must query `seller_products` where `seller_id` matches the current merchant's user ID.
- [ ] The endpoint must join or fetch associated `products` records using `product_id` to include:
  - Product ID
  - Product name
  - Product brand
  - Product description
  - Product image URL
- [ ] The endpoint must include offer-specific attributes:
  - Seller product offer ID
  - Price (numeric float)
  - Stock count (integer)
  - Estimated delivery days (integer or null)
  - Creation timestamp
- [ ] Results must be ordered by creation timestamp descending (newest offers first).
- [ ] When a merchant has no registered offers, the endpoint must return an empty list with HTTP 200 OK.

## 4. Acceptance Criteria

- [ ] AC1: Authenticated merchant calling `GET /api/v1/dashboard/offers` receives HTTP 200 with an array of their offers containing product name, brand, image URL, price, stock, and delivery days.
- [ ] AC2: Calling the endpoint without a token or with an invalid token returns HTTP 401.
- [ ] AC3: Calling the endpoint with a buyer account token returns HTTP 403 Forbidden with the standard error envelope.
- [ ] AC4: A merchant with zero offers receives an empty array (`[]`) with HTTP 200.
- [ ] AC5: The endpoint returns only offers belonging to the authenticated merchant, never leaking offers belonging to other sellers.

## 5. API Contract

### `GET /api/v1/dashboard/offers`

**Summary**: Retrieve merchant product offers

**Description**: Returns all product listings and inventory offers created by the authenticated merchant, joined with catalog product information. Only accessible by users with the merchant role.

**Request Headers**:
- `Cookie: kalano_token=<jwt>` OR `Authorization: Bearer <jwt>`

**Success Response** (`200 OK`):
```json
[
  {
    "id": "7ca85f64-5717-4562-b3fc-2c963f66afa7",
    "product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "product_name": "Wireless Noise-Cancelling Headphones",
    "product_brand": "SoundWave",
    "product_description": "High-fidelity audio with adaptive active noise cancellation.",
    "product_image_url": "https://example.com/images/headphones.jpg",
    "price": 149.99,
    "stock": 25,
    "estimated_delivery_days": 3,
    "created_at": "2026-09-01T12:00:00Z"
  }
]
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 401 | `MISSING_TOKEN` / `INVALID_TOKEN` | Authentication credentials missing or invalid |
| 403 | `FORBIDDEN` | User does not have the merchant role |
| 500 | `INTERNAL_SERVER_ERROR` | Database or unexpected server error |

## 6. UI/UX Requirements

- This is a backend API endpoint spec. Frontend consumption is specified in Spec 006 (`specs/006-seller-dashboard-frontend/`).

## 7. Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Merchant has zero active offers | Return HTTP 200 with an empty list `[]` |
| Associated catalog product record has missing or null image URL | Return `null` for `product_image_url` without throwing errors |
| Buyer or logistics user attempts to view offers | Reject immediately with HTTP 403 `FORBIDDEN` |
| Supabase database connection error | Return HTTP 500 with standard error envelope |

## 8. Out of Scope

- ❌ Creating new offers or modifying existing offers (handled in Specs 002, 003, and 004).
- ❌ Paginated query slicing (MVP lists all merchant offers directly).
- ❌ Frontend UI components (handled in Spec 006).

## 9. Constitution Compliance

- ✅ All business logic and queries reside in FastAPI (`backend/app/`), never in Next.js (§4.1).
- ✅ Endpoint uses `/api/v1/` prefix and is tagged under `Dashboard` with summary, description, and response schemas (§4.3).
- ✅ Errors adhere to standard error JSON envelope with `error.code` and `error.message` (§4.4).
- ✅ Role-based check verifies `user_role == "merchant"` (§2).
- ✅ Endpoints tested with pytest covering success, unauthorized, forbidden, and empty states (§14).

## 10. Open Questions

- None. All requirements and scope decisions have been resolved.
