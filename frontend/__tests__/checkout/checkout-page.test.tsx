import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CheckoutPage from "@/app/checkout/page";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useCartModule from "@/lib/hooks/use-cart";
import * as checkoutApiModule from "@/lib/api/checkout";
import { CartResponse } from "@/types/cart";
import { UserResponse } from "@/types/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const mockBuyerWithAddress: UserResponse = {
  id: "buyer-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "buyer@example.com",
  display_name: "Buyer Alice",
  user_role: "buyer",
  address: "742 Evergreen Terrace, Springfield, OR 97477",
};

const mockBuyerWithoutAddress: UserResponse = {
  id: "buyer-456",
  created_at: "2026-09-01T00:00:00Z",
  email: "buyer2@example.com",
  display_name: "Buyer Bob",
  user_role: "buyer",
  address: null,
};

const mockCartData: CartResponse = {
  id: 1,
  user_id: "buyer-123",
  total_items: 2,
  total_price: 199.98,
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
      stock: 5,
      estimated_delivery_days: 3,
      quantity: 2,
      subtotal: 199.98,
      created_at: "2026-09-05T12:00:00Z",
    },
  ],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while cart data is loading", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerWithAddress,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    renderWithProviders(<CheckoutPage />);
    expect(screen.getByTestId("checkout-skeleton")).toBeInTheDocument();
  });

  it("renders empty cart state when cart has 0 items", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerWithAddress,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

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

    renderWithProviders(<CheckoutPage />);
    expect(screen.getByTestId("empty-checkout-state")).toBeInTheDocument();
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue Shopping/i })
    ).toHaveAttribute("href", "/products");
  });

  it("initializes shipping address from user profile", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerWithAddress,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    renderWithProviders(<CheckoutPage />);

    const textarea = screen.getByLabelText(
      /Delivery Destination/i
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("742 Evergreen Terrace, Springfield, OR 97477");
  });

  it("shows validation error if submitting blank or short address", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerWithoutAddress,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    renderWithProviders(<CheckoutPage />);

    const submitBtn = screen.getByRole("button", { name: /Place Order/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please enter a valid shipping address/i)
    ).toBeInTheDocument();
  });

  it("submits checkout API, displays toast, and redirects to /orders on success", async () => {
    const mockRefreshUser = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerWithAddress,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: mockRefreshUser,
    });

    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    const processCheckoutSpy = vi
      .spyOn(checkoutApiModule, "processCheckout")
      .mockResolvedValue({
        order_ids: [101],
        orders: [],
        total_items: 2,
        total_price: 199.98,
        message: "Order placed successfully.",
      });

    renderWithProviders(<CheckoutPage />);

    const checkbox = screen.getByLabelText(/Save this shipping address/i);
    fireEvent.click(checkbox); // check it to true

    const submitBtn = screen.getByRole("button", { name: /Place Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(processCheckoutSpy).toHaveBeenCalledWith({
        address: "742 Evergreen Terrace, Springfield, OR 97477",
        save_address: true,
      });
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Order placed successfully!"
      );
      expect(mockPush).toHaveBeenCalledWith("/orders");
    });
  });

  it("displays server error alert without navigating when checkout fails", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerWithAddress,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useCart").mockReturnValue({
      data: mockCartData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useCartModule.useCart>);

    vi.spyOn(checkoutApiModule, "processCheckout").mockRejectedValue({
      error: {
        code: "INSUFFICIENT_STOCK",
        message:
          "Item 'Wireless Headphones' has only 1 in stock, but 2 requested.",
      },
    });

    renderWithProviders(<CheckoutPage />);

    const submitBtn = screen.getByRole("button", { name: /Place Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("checkout-error-banner")).toBeInTheDocument();
      expect(
        screen.getByText(/Item 'Wireless Headphones' has only 1 in stock/i)
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
