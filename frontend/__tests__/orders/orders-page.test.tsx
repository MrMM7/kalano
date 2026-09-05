import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import OrderHistoryPage from "@/app/orders/page";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useOrdersModule from "@/lib/hooks/use-orders";
import { OrderItem, DeliveryStatus } from "@/types/order";
import { UserResponse } from "@/types/auth";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderCard } from "@/components/orders/order-card";
import React from "react";

const mockBuyerUser: UserResponse = {
  id: "buyer-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "buyer@example.com",
  display_name: "Buyer Alice",
  user_role: "buyer",
  address: "742 Evergreen Terrace, Springfield, OR 97477",
};

const mockMerchantUser: UserResponse = {
  id: "merchant-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "merchant@example.com",
  display_name: "Seller Sam",
  user_role: "merchant",
  address: null,
};

const mockOrdersList: OrderItem[] = [
  {
    id: 105,
    product_id: "prod-1",
    product_name: "Ergonomic Mechanical Keyboard",
    product_brand: "KeyTech",
    product_image_url: "https://example.com/keyboard.jpg",
    seller_id: "seller-1",
    seller_name: "KeyTech Official",
    bought_price: 129.99,
    quantity: 1,
    subtotal: 129.99,
    delivery_types: "pending",
    address: "123 Main St, Suite 400, Cityville, CA 94105",
    created_at: "2026-09-05T21:00:00Z",
  },
  {
    id: 104,
    product_id: "prod-2",
    product_name: "Noise-Cancelling Headphones",
    product_brand: "SoundWave",
    product_image_url: null,
    seller_id: "seller-2",
    seller_name: "AudioZone",
    bought_price: 89.5,
    quantity: 2,
    subtotal: 179.0,
    delivery_types: "delivered",
    address: "742 Evergreen Terrace, Springfield, OR 97477",
    created_at: "2026-09-03T14:30:00Z",
  },
];

describe("OrderHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while order history is loading", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useOrdersModule, "useOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrdersModule.useOrders>);

    render(<OrderHistoryPage />);
    expect(screen.getByTestId("orders-skeleton")).toBeInTheDocument();
  });

  it("renders empty state when order list has 0 items", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useOrdersModule, "useOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrdersModule.useOrders>);

    render(<OrderHistoryPage />);
    expect(screen.getByTestId("orders-empty-state")).toBeInTheDocument();
    expect(
      screen.getByText("You haven't placed any orders yet")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Explore Products/i })
    ).toHaveAttribute("href", "/products");
  });

  it("renders list of orders with product names, seller names, subtotals, and addresses", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useOrdersModule, "useOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 2,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrdersModule.useOrders>);

    render(<OrderHistoryPage />);

    expect(screen.getByTestId("orders-list")).toBeInTheDocument();
    expect(screen.getByText("Order #105")).toBeInTheDocument();
    expect(screen.getByText("Ergonomic Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText(/Sold by: KeyTech Official/i)).toBeInTheDocument();
    expect(screen.getByText("$129.99")).toBeInTheDocument();
    expect(
      screen.getByText(/Shipping to: 123 Main St, Suite 400, Cityville, CA 94105/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Order #104")).toBeInTheDocument();
    expect(screen.getByText("Noise-Cancelling Headphones")).toBeInTheDocument();
    expect(screen.getByText(/Sold by: AudioZone/i)).toBeInTheDocument();
    expect(screen.getByText("$179.00")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Shipping to: 742 Evergreen Terrace, Springfield, OR 97477/i
      )
    ).toBeInTheDocument();
  });

  it("displays error state and invokes refetch on clicking Retry", () => {
    const mockRefetch = vi.fn();
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useOrdersModule, "useOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: true,
      error: new Error("Network connection lost"),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useOrdersModule.useOrders>);

    render(<OrderHistoryPage />);

    expect(screen.getByTestId("orders-error-state")).toBeInTheDocument();
    expect(screen.getByText("Network connection lost")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders non-buyer role banner when user is a merchant", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockMerchantUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useOrdersModule, "useOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOrdersModule.useOrders>);

    render(<OrderHistoryPage />);

    expect(screen.getByTestId("non-buyer-banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Go to Merchant Dashboard/i })
    ).toHaveAttribute("href", "/dashboard");
  });
});

describe("OrderStatusBadge", () => {
  const testCases: { status: DeliveryStatus; expectedLabel: string }[] = [
    { status: "pending", expectedLabel: "Order Placed" },
    { status: "confirmed", expectedLabel: "Ready for Pickup" },
    { status: "shipped", expectedLabel: "In Transit" },
    { status: "delivered", expectedLabel: "Delivered" },
    { status: "cancelled", expectedLabel: "Cancelled" },
    { status: "returned", expectedLabel: "Returned" },
  ];

  testCases.forEach(({ status, expectedLabel }) => {
    it(`renders correct label "${expectedLabel}" for status "${status}"`, () => {
      render(<OrderStatusBadge status={status} />);
      const badge = screen.getByTestId("order-status-badge");
      expect(badge).toHaveTextContent(expectedLabel);
      expect(badge).toHaveAttribute("data-status", status);
    });
  });

  it("handles unknown status gracefully", () => {
    render(<OrderStatusBadge status="processing" />);
    const badge = screen.getByTestId("order-status-badge");
    expect(badge).toHaveTextContent("Processing");
  });
});

describe("OrderCard", () => {
  it("renders product image when present and links to product page", () => {
    render(<OrderCard order={mockOrdersList[0]} />);
    const link = screen.getByRole("link", {
      name: "Ergonomic Mechanical Keyboard",
    });
    expect(link).toHaveAttribute("href", "/products/prod-1");
  });

  it("handles missing product image by rendering fallback package icon", () => {
    render(<OrderCard order={mockOrdersList[1]} />);
    const link = screen.getByRole("link", {
      name: "Noise-Cancelling Headphones",
    });
    expect(link).toHaveAttribute("href", "/products/prod-2");
  });
});
