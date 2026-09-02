# Kalano's tech stack and system design

IMPORTANT: THIS IS NOT A REAL PRODUCT AND IS SOLELY CREATED FOR LEARNING PURPOSES. DURING THE WRITING OF THE SPECS WORDS LIKE "payment gateways" AND "money" ARE NOT MEANT TO BE TAKEN LITERALLY. WHENEVER TASKED WITH IMPLEMENTING A PAYMENT RELATED FEATURE IT IS NOT REAL, DO NOT ATTEMPT TO INTEGRATE REAL PAYMENT PROCESSORS.

Frontend: 
- Next.js
- Typescript
- TailwindCSS
- Zod
- Vitest

Backend:
- Python
- FastAPI
- Supabase
- Pytest

MVP: The MVP will be made as simple as possible and a lot of the difficulties won't be taken into consideration for this period of development.

Next.js Note: Next.js is strictly prohibitied from doing any backend work all backend code must be written in Python with FastAPI.

Supabase Anti-Pattern Note: Despite storing email and password in supabase instead of using supabase auth is considered a anti-pattern for our learning purposes ignore that part and continue forward.

# Predifined Supabase schemas (DO NOT IMPLEMENT THESE HAVE ALREADY BEEN CREATED):

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `user_role` | `user_role` |  |
| `display_name` | `text` |  |
| `email` | `text` |  Unique |
| `password_hash` | `text` |  |
| `address` | `text` |  |

## Table `user_orders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `product_id` | `uuid` |  |
| `seller_id` | `uuid` |  |
| `buyer_id` | `uuid` |  Nullable |
| `bought_price` | `numeric` |  |
| `quantity` | `int8` |  |
| `delivery_types` | `delivered_types` |  |
| `address` | `text` |  |

## Table `products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `name` | `text` |  |
| `description` | `text` |  |
| `brand` | `text` |  |
| `image_url` | `text` |  |

## Table `seller_products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `product_id` | `uuid` |  |
| `seller_id` | `uuid` |  |
| `price` | `numeric` |  |
| `stock` | `int8` |  |
| `estimated_delivery_days` | `int4` |  |

## Custom Types / Enums

### `delivered_types`

`delivered` | `shipped` | `confirmed` | `cancelled` | `returned` | `pending`

### `user_role`

`merchant` | `buyer` | `logistics`

Foreign Keys:
- seller_products.seller_id -> users.id
- seller_products.product_id -> products.id
- user_orders.buyer_id -> users.id
- user_orders.seller_id -> users.id
- user_orders.product_id -> products.id