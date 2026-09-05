import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CartPage from "@/app/cart/page";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useCartModule from "@/lib/hooks/use-cart";
import { CartResponse } from "@/types/cart";
import { UserResponse } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockBuyerUser: UserResponse = {
  id: "buyer-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "buyer@example.com",
  display_name: "Buyer Alice",
  user_role: "buyer",
  address: "123 Main St",
};

const mockMerchantUser: UserResponse = {
  id: "seller-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "merchant@example.com",
  display_name: "Seller Bob",
  user_role: "merchant",
  address: null,
};

const mockCartData: CartResponse = {
  id: 1,
  user_id: "buyer-123",
  total_items: 3,
  total_price: 249.97,
  items: [
    {
      id: 10,
      seller_product_id: "sp-1",
      product_id: "prod-1",
      product_name: "Wireless Headphones",
      product_brand: "AudioTech",
      product_image_url: "https://example.com/headphones.jpg",
      seller_id: "s-1",
      seller_name: "BestAudio",
      unit_price: 99.99,
      stock: 2,
      estimated_delivery_days: 3,
      quantity: 2,
      subtotal: 199.98,
      created_at: "2026-09-05T12:00:00Z",
    },
    {
      id: 11,
      seller_product_id: "sp-2",
      product_id: "prod-2",
      product_name: "USB-C Fast Charger",
      product_brand: "PowerPlus",
      product_image_url: null,
      seller_id: "s-2",
      seller_name: "ChargeStore",
      unit_price: 49.99,
      stock: 10,
      estimated_delivery_days: 2,
      quantity: 1,
      subtotal: 49.99,
      created_at: "2026-09-05T12:30:00Z",
    },
  ],
};

describe("CartPage", () => {
  const mockMutateUpdate = vi.fn();
  const mockMutateDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useUpdateCartItem").mockReturnValue({
      mutateAsync: mockMutateUpdate,
    } as unknown as ReturnType<typeof useCartModule.useUpdateCartItem>);

    vi.spyOn(useCartModule, "useDeleteCartItem").mockReturnValue({
      mutateAsync: mockMutateDelete,
    } as unknown as ReturnType<typeof useCartModule.useDeleteCartItem>);
  });

  it("renders loading skeleton while fetching cart data", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);
    expect(screen.getByTestId("cart-skeleton")).toBeInTheDocument();
  });

  it("renders empty cart state when cart has no items", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: {
        id: 1,
        user_id: "buyer-123",
        items: [],
        total_items: 0,
        total_price: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);

    expect(screen.getByTestId("cart-empty-state")).toBeInTheDocument();
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse Products/i })
    ).toHaveAttribute("href", "/products");
  });

  it("renders non-buyer alert banner when logged in as merchant", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockMerchantUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: {
        id: 1,
        user_id: "seller-123",
        items: [],
        total_items: 0,
        total_price: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);

    expect(screen.getByTestId("non-buyer-banner")).toBeInTheDocument();
    expect(
      screen.getByText(/Carts are reserved for Buyer accounts/i)
    ).toBeInTheDocument();
  });

  it("renders cart item rows, subtotal, and order summary when items exist", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);

    expect(screen.getByTestId("cart-item-list")).toBeInTheDocument();
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText(/BestAudio/)).toBeInTheDocument();
    expect(screen.getByText("USB-C Fast Charger")).toBeInTheDocument();
    expect(screen.getByText(/ChargeStore/)).toBeInTheDocument();

    expect(screen.getByTestId("cart-summary-total")).toHaveTextContent(
      "$249.97"
    );
    expect(
      screen.getByRole("link", { name: /Proceed to Checkout/i })
    ).toHaveAttribute("href", "/checkout");
  });

  it("disables increment button when item is at maximum stock limit", () => {
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);

    // Item 10 has quantity 2 and stock 2 -> max stock indicator and disabled plus
    expect(screen.getByTestId("max-stock-indicator-10")).toBeInTheDocument();

    const increaseBtn = screen.getByRole("button", {
      name: "Increase quantity of Wireless Headphones",
    });
    expect(increaseBtn).toBeDisabled();
  });

  it("calls update mutation when quantity increment or decrement is clicked", async () => {
    mockMutateUpdate.mockResolvedValue({});
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);

    // Item 11 has quantity 1 and stock 10
    const increaseBtn = screen.getByRole("button", {
      name: "Increase quantity of USB-C Fast Charger",
    });
    expect(increaseBtn).not.toBeDisabled();

    fireEvent.click(increaseBtn);
    expect(mockMutateUpdate).toHaveBeenCalledWith({
      itemId: 11,
      data: { quantity: 2 },
    });

    // Item 10 has quantity 2, so decrement is enabled
    const decreaseBtn = screen.getByRole("button", {
      name: "Decrease quantity of Wireless Headphones",
    });
    expect(decreaseBtn).not.toBeDisabled();

    fireEvent.click(decreaseBtn);
    expect(mockMutateUpdate).toHaveBeenCalledWith({
      itemId: 10,
      data: { quantity: 1 },
    });
  });

  it("calls delete mutation when remove button is clicked", async () => {
    mockMutateDelete.mockResolvedValue({});
    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    render(<CartPage />);

    const removeBtn = screen.getByRole("button", {
      name: "Remove Wireless Headphones from cart",
    });

    fireEvent.click(removeBtn);
    expect(mockMutateDelete).toHaveBeenCalledWith(10);
  });
});
