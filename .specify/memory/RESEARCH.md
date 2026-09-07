# Kalano UI/UX Research Synthesis & Design System

> **Roadmap Reference**: Phase 9, Step 9.1 — Research & synthesize UI/UX best practices  
> **Target Document**: `.specify/memory/RESEARCH.md`  
> **Status**: Approved Foundation for Step 9.2 Execution  
> **Design Theme**: Modern Clean Marketplace (Slate/Zinc Neutral Palette, Crisp Typography, Subtle Elevation, Smooth Tailwind Transitions)

---

## 1. Executive Summary & Design Principles

Kalano is a multi-vendor e-commerce platform where multiple sellers offer prices and delivery terms for shared catalog items. The platform must balance visual clarity for buyers (discovering products, identifying the best price, seamless checkout) with data density and operational clarity for merchants and logistics staff.

Based on empirical e-commerce research, Kalano adopts five core UX principles:

1. **Clarity Over Clutter**: Generous whitespace, clean visual boundaries, and disciplined typography reduce cognitive strain and decision fatigue.
2. **Predictable Visual Hierarchy**: Important actions (e.g., "Add to Cart", "Place Order", "Mark Shipped") dominate visually over secondary navigation or ancillary details.
3. **Tactile & Responsive Affordances**: Interactive elements (buttons, cards, inputs) provide immediate, subtle physical feedback via smooth CSS transitions (`150ms`–`200ms`) and visible focus states.
4. **Transparent Multi-Vendor Comparison**: Buyers should effortlessly understand why an offer was selected (lowest price, estimated delivery days, seller name) and how to evaluate alternatives.
5. **Zero Dead Ends**: Empty states, errors, and intermediate loading states always offer guidance, reassurance, and actionable next steps.

---

## 2. Cited Authoritative Sources & Empirical Benchmarks

The recommendations in this document synthesize proven heuristics and empirical studies from the world's leading usability research bodies:

- **Nielsen Norman Group (NN/g)**:
  - *E-Commerce Search & Filter UX* (Budiu & Moran): Immediate search feedback, sticky search bars, query persistence, and meaningful empty-search recovery suggestions.
  - *Multi-Vendor Marketplace Usability* (Pernice): Clear separation of product specifications vs. merchant-specific offer terms (price, inventory, fulfillment speed).
  - *Button & Visual Hierarchy Heuristics* (Fessenden): Single primary button per viewport section; secondary actions styled with low-contrast borders or ghost treatments.
- **Baymard Institute**:
  - *Cart & Checkout UX Benchmark* (4,000+ hours of user testing): Order summary persistence, transparent cost itemization (item total vs simulated shipping/tax), single-column address form flow, and immediate visual validation.
  - *Product Listing & Card Design*: Strict alignment of prices, consistent thumbnail aspect ratios, prominent stock badges, and visible seller signals.
- **Refactoring UI (Adam Wathan & Steve Schoger)**:
  - Designing with neutral color palettes (using Slate/Zinc with 10 shades to build depth without color clutter).
  - Spacing scales rooted in 4px/8px multiples (`gap-2`, `gap-4`, `gap-6`, `gap-8`, `gap-12`).
  - Avoiding heavy drop shadows; using delicate border rings (`border-slate-200`) and soft ambient shadows (`shadow-sm`, `shadow-md` on hover).
- **W3C Web Accessibility Initiative (WAI) / WCAG 2.1 AA**:
  - Minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text / graphical UI components.
  - Visible focus indicators (`focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2`).
  - Semantic ARIA roles on status badges, progress bars, and modal dialogs.

---

## 3. Design Tokens & Foundations

### 3.1 Color System (Slate Neutral Theme)

Kalano uses Tailwind's **Slate** palette as its primary neutral foundation, paired with semantic status colors that maintain WCAG AA compliance.

| Token Role | Tailwind Class / Value | Usage |
|------------|------------------------|-------|
| **Page Background** | `bg-slate-50` (`#f8fafc`) | Global canvas background, subtle warmth compared to harsh `#ffffff` |
| **Card / Surface** | `bg-white` (`#ffffff`) | Elevated content cards, tables, modal dialogs, and popovers |
| **Subtle Border** | `border-slate-200` (`#e2e8f0`) | Card outlines, table rows, input boundaries, navbar separator |
| **Hover Border** | `border-slate-300` (`#cbd5e1`) | Interactive card hover, input focus transition |
| **Primary Text** | `text-slate-900` (`#0f172a`) | Page titles, product titles, table headings, prices |
| **Secondary Text** | `text-slate-600` (`#475569`) | Descriptions, subtitles, seller names, form labels |
| **Muted Text** | `text-slate-400` (`#94a3b8`) | Timestamps, placeholder text, breadcrumb separators |
| **Primary Action** | `bg-slate-900 text-white hover:bg-slate-800` | Main CTA buttons ("Add to Cart", "Place Order", "Submit") |
| **Secondary Action**| `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50` | Filters, cancel buttons, secondary options |
| **Success / In-Stock**| `bg-emerald-50 text-emerald-700 border-emerald-200` | In-stock pill, delivered status, completed order badge |
| **Warning / Pending**| `bg-amber-50 text-amber-700 border-amber-200` | Pending order pill, low stock warning |
| **Information / Blue**| `bg-sky-50 text-sky-700 border-sky-200` | Confirmed order status, logistics notifications |
| **Purple / Shipped** | `bg-violet-50 text-violet-700 border-violet-200` | Shipped status pill, transit updates |
| **Destructive / Red**| `bg-rose-50 text-rose-700 border-rose-200` | Cancelled order pill, out of stock, delete offer |

### 3.2 Typography Hierarchy

Kalano leverages the system sans-serif / Inter font stack with deliberate tracking and scale:

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| **Display / Hero** | `text-3xl` to `text-4xl` (30px–36px) | `font-extrabold` (800) | `leading-tight` | `tracking-tight` | Landing hero headline, major dashboard headings |
| **Section Heading**| `text-2xl` (24px) | `font-bold` (700) | `leading-snug` | `tracking-tight` | Page titles, product title on detail page |
| **Card / Group Title**| `text-lg` to `text-xl` (18px–20px) | `font-semibold` (600) | `leading-snug` | `tracking-normal`| Product card title, table card headers |
| **Subheading / Meta**| `text-sm` to `text-base` (14px–16px) | `font-medium` (500) | `leading-normal`| `tracking-normal`| Seller names, navigation items, form labels |
| **Body Text** | `text-sm` (14px) | `font-normal` (400) | `leading-relaxed` | `tracking-normal`| Descriptions, order details, table cells |
| **Caption / Badge** | `text-xs` (12px) | `font-medium` (500) | `leading-none` | `tracking-wide` | Status badges, timestamps, stock quantity indicators |
| **Price Emphasis** | `text-xl` to `text-2xl` (20px–24px) | `font-bold` (700) | `leading-none` | `tracking-tight` | Product card price, checkout subtotal |

### 3.3 Elevation, Shadows & Spacing

- **Baseline Spacing**: Rooted in 4px increments (`p-2`, `p-4`, `p-6`, `p-8`). Containers use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Card Styling**: `bg-white rounded-xl border border-slate-200/80 shadow-sm`.
- **Interactive Card Lift**: `transition-all duration-200 ease-in-out hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5`.
- **Dividers**: Clean 1px rules using `divide-y divide-slate-100` or `border-t border-slate-200`.

### 3.4 Micro-Interactions & Transitions

All interactive micro-interactions adhere to strict performance and usability rules:
- **Button Hover**: `transition-all duration-150 ease-in-out active:scale-[0.98]`.
- **Focus Rings**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2`.
- **List & Table Row Hover**: `transition-colors duration-150 hover:bg-slate-50/75`.
- **Badge Animations**: Subtle soft pulse on active/shipped status badges.

---

## 4. Component Pattern Guidelines

### 4.1 Buttons
- **Primary CTA**: High contrast, solid slate-900 background, crisp white typography, `rounded-lg font-medium shadow-sm hover:bg-slate-800`.
- **Secondary / Action Button**: Clean white surface with slate-300 border, `hover:bg-slate-50 text-slate-700`.
- **Destructive**: Rose background tint with red text or solid red on dangerous confirmation modals.
- **Disabled State**: `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`.

### 4.2 Product Cards (`ProductCard`)
- **Structure**:
  1. Image Container: Fixed aspect ratio (`aspect-square` or `aspect-[4/3]`), light slate background (`bg-slate-100`), overflow hidden with subtle zoom on card hover (`group-hover:scale-105 transition-transform duration-300`).
  2. Brand Chip: Small uppercase brand label (`text-xs font-semibold text-slate-500 uppercase tracking-wider`).
  3. Product Title: Two-line clamp (`line-clamp-2 font-medium text-slate-900 text-sm group-hover:text-slate-700`).
  4. Best Offer Block: Large price display (`text-lg font-bold text-slate-900`), seller attribution (`text-xs text-slate-500`), and stock pill badge (`In Stock` vs `Out of Stock`).

### 4.3 Form Inputs & Validation
- **Label**: Above input field, `text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5`.
- **Input Field**: `rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors`.
- **Inline Error**: Directly beneath the field, `text-xs font-medium text-rose-600 flex items-center gap-1 mt-1`.

### 4.4 Status Badges
Status pills use standard dimensions (`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5`):
- `pending`: `bg-amber-50 text-amber-700 border-amber-200`
- `confirmed`: `bg-sky-50 text-sky-700 border-sky-200`
- `shipped`: `bg-violet-50 text-violet-700 border-violet-200`
- `delivered`: `bg-emerald-50 text-emerald-700 border-emerald-200`
- `cancelled`: `bg-rose-50 text-rose-700 border-rose-200`
- `returned`: `bg-slate-100 text-slate-700 border-slate-300`

### 4.5 Empty States
Every empty state follows the 4-part structure:
1. Centered visual icon container: `w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3`.
2. Clear headline: `text-base font-semibold text-slate-900`.
3. Supportive description: `text-sm text-slate-500 max-w-sm mx-auto mb-5`.
4. Clear primary action button: `e.g. "Browse Products" or "Add New Offer"`.

---

## 5. Page-by-Page Implementation Blueprints

### 5.1 Global Shell & Layout
- **`frontend/app/globals.css`**: Set base body to `bg-slate-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white`. Ensure smooth scrolling and clean font rendering.
- **`frontend/components/layout/navbar.tsx`**:
  - Sticky glassmorphic navbar: `sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80`.
  - Brand Logo: Bold black typography (`Kalano` with modern icon mark).
  - Search Bar: Centered, width-constrained, slate-100 background with active slate-900 ring.
  - Cart Badge: Pill badge displaying total item count with clean transition.
  - Role-based links: Clear active underline or background highlight.
- **`frontend/components/layout/footer.tsx`**:
  - Clean slate-900 dark background or subtle slate-100 light background with clean multi-column layout, copyright, and platform disclaimer.

### 5.2 Landing Page (`/`)
- **Hero Section**:
  - Clean badge header: "Next-Generation Multi-Vendor Commerce".
  - Crisp headline: "Find the best deals from top-rated sellers."
  - Centered search bar with quick category suggestion chips.
- **Catalog Showcase**:
  - 4-column responsive grid (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`).
  - Section header with title and "View all products →" link.

### 5.3 Products Search & Listing (`/products`)
- **Search Header**:
  - Displays active query count: `"Showing results for 'laptop' (8 products found)"`.
  - Filter pills: Clear query button, price sorting indicators.
- **Empty State**:
  - Clean icon, `"No products match your search"`, with a `"Clear search"` button.

### 5.4 Product Detail Page (`/products/[id]`)
- **Layout**:
  - Two-column split: Large high-definition image gallery container on left; product details, price highlight, and buy box on right.
  - Highlighted Best Offer: Highlighted with an emerald `Best Price Offer` badge and estimated delivery date.
  - "Add to Cart" button: Full-width, prominent, with loading spinner and quick feedback toast.
- **Seller Offers Table (`components/seller-offers-table.tsx`)**:
  - Clean card container with table header: Seller, Rating/Delivery, Price, Action.
  - Hover highlight on rows.
  - "Select Offer" or "Add from this seller" button on each row.

### 5.5 Cart Page (`/cart`)
- **Layout**:
  - Clean split: Item list (8 cols) and Order Summary Card (4 cols).
  - Item Rows: Product thumbnail, title, seller name, unit price, quantity stepper `[- 1 +]`, item subtotal, and remove icon button.
  - Summary Card: Sticky card with Subtotal, Estimated Shipping (Simulated Free), Total, and full-width "Proceed to Checkout" button.
- **Empty Cart (`components/cart/cart-empty-state.tsx`)**:
  - Centered cart illustration, friendly copy, and "Start Shopping" button directing to `/products`.

### 5.6 Checkout Page (`/checkout`)
- **Layout**:
  - Two-column layout: Shipping Address form on left; Order Items & Simulated Payment card on right.
  - Form Fields: Full name, Street address, City, Postal Code with inline validation.
  - Simulated Payment Card: Clear visual callout: `"Simulated Checkout — No real money or card required"`.
  - "Place Order" button with confirmation loading state.

### 5.7 Order History Page (`/orders`)
- **Layout**:
  - List of clean order cards with header bar containing Order ID, Order Date, Total Paid, and Delivery Status Badge.
  - Product line items with thumbnail, quantity, seller name, and delivery address.
  - Clean empty state when no orders exist.

### 5.8 Merchant Dashboard (`/dashboard`)
- **Layout**:
  - Modern dashboard header with merchant name and Quick Action button ("+ Add New Product / Offer").
  - Summary Metric Cards: Total Offers, Active Stock, Incoming Orders.
  - Tabbed Interface: "My Offers", "Incoming Orders", "Add Offer".
  - Action buttons: "Mark Ready for Pickup" with immediate visual confirmation.

### 5.9 Logistics Dashboard (`/logistics`)
- **Layout**:
  - Operations banner with live order status count pills.
  - Filter tabs: All, Pending, Confirmed, Shipped, Delivered.
  - Order fulfillment table with recipient address, seller pickup location, status pill, and action buttons (`Confirm Pickup`, `Mark Shipped`, `End Delivery`).

### 5.10 Authentication Pages (`/login`, `/signup`)
- **Layout**:
  - Centered card on subtle gradient or slate-50 canvas.
  - Minimal brand header.
  - Segmented control for role selection (Buyer vs Merchant).
  - Crisp form fields and explicit redirect links.

---

## 6. Traceability Matrix & Action Checklist for Spec 002

| Page / Component | Key Target Enhancements | Traceable Research Heuristic |
|------------------|-------------------------|------------------------------|
| `app/globals.css` | Slate neutral theme, selection colors, antialiasing | Refactoring UI Color & Base Tokens |
| `layout/navbar.tsx` | Glassmorphic sticky blur, active link styling, cart counter | NN/g Navigation & Header Persistence |
| `layout/footer.tsx` | Multi-column layout, contrast & typography hierarchy | Baymard Trust & Information Architecture |
| `components/product-card.tsx` | Hover elevation lift, image zoom, distinct price weight | Baymard Card Hierarchy Benchmark |
| `app/page.tsx` | Hero typography, search bar integration, curated grid | NN/g E-Commerce Discovery Benchmark |
| `app/products/page.tsx` | Query summary chip, responsive grid, empty state | NN/g Search & Recovery Heuristics |
| `app/products/[id]/page.tsx` | Two-column hero, best offer highlight box, CTA feedback | Baymard Buy-Box Usability Standard |
| `components/seller-offers-table.tsx` | Clear table borders, delivery chips, offer comparison | NN/g Multi-Vendor Transparency |
| `app/cart/page.tsx` | Item row spacing, quantity stepper ergonomics, sticky summary | Baymard Cart Optimization Benchmark |
| `app/checkout/page.tsx` | Two-column desktop flow, address form focus, simulation notice | Baymard Checkout Usability Benchmark |
| `app/orders/page.tsx` | Card header metadata, status badge colors, item layout | NN/g Post-Purchase Visibility |
| `app/dashboard/page.tsx` | Metric cards, clean tab navigation, pickup trigger feedback | Operations Dashboard Heuristics |
| `app/logistics/page.tsx` | Metrics summary, status pills, order transition buttons | Operations Dashboard Heuristics |
| `app/login/page.tsx` & `/signup` | Centered card elevation, role selector tabs, inline errors | NN/g Form Usability & Error Recovery |
