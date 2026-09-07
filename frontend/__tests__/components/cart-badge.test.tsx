import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CartBadge } from "@/components/layout/cart-badge";
import * as useCartModule from "@/lib/hooks/use-cart";
import { CartItem, CartResponse } from "@/types/cart";

describe("CartBadge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders cart link with default aria-label and no badge when cart is empty", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: {
        id: 1,
        user_id: "user-1",
        items: [],
        total_items: 0,
        total_price: 0,
      } as CartResponse,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartBadge />);

    const link = screen.getByRole("link", { name: "Shopping Cart" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/cart");
    expect(screen.queryByTestId("cart-badge-count")).not.toBeInTheDocument();
  });

  it("renders cart link with default aria-label when data is undefined (loading/unauthenticated)", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartBadge />);

    const link = screen.getByRole("link", { name: "Shopping Cart" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/cart");
    expect(screen.queryByTestId("cart-badge-count")).not.toBeInTheDocument();
  });

  it("displays badge with item count and accessible label when items exist", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: {
        id: 1,
        user_id: "user-1",
        items: [
          {
            id: 1,
            seller_product_id: "sp-1",
            product_id: "p-1",
            product_name: "Item",
            product_brand: "Brand",
            product_image_url: null,
            seller_id: "s-1",
            seller_name: "Seller",
            unit_price: 10,
            stock: 5,
            estimated_delivery_days: null,
            quantity: 3,
            subtotal: 30,
            created_at: "2026-09-01T00:00:00Z",
          },
        ],
        total_items: 3,
        total_price: 30,
      } as CartResponse,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartBadge />);

    const link = screen.getByRole("link", {
      name: "Shopping Cart with 3 items",
    });
    expect(link).toBeInTheDocument();
    const badge = screen.getByTestId("cart-badge-count");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("3");
  });

  it("caps display count at 99+ when total items exceed 99", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: {
        id: 1,
        user_id: "user-1",
        items: [],
        total_items: 120,
        total_price: 1200,
      } as CartResponse,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartBadge />);

    const link = screen.getByRole("link", {
      name: "Shopping Cart with 120 items",
    });
    expect(link).toBeInTheDocument();
    const badge = screen.getByTestId("cart-badge-count");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("99+");
  });

  it("sums item quantities if total_items is undefined", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: {
        id: 1,
        user_id: "user-1",
        items: [{ quantity: 2 } as CartItem, { quantity: 4 } as CartItem],
        total_items: undefined as unknown as number,
        total_price: 60,
      } as CartResponse,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartBadge />);

    const link = screen.getByRole("link", {
      name: "Shopping Cart with 6 items",
    });
    expect(link).toBeInTheDocument();
    const badge = screen.getByTestId("cart-badge-count");
    expect(badge).toHaveTextContent("6");
  });
});
