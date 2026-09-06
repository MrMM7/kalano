import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IncomingOrdersTab } from "@/components/dashboard/incoming-orders-tab";
import * as useDashboardModule from "@/lib/hooks/use-dashboard";
import { MerchantOrder } from "@/types/dashboard";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
}

const mockOrdersList: MerchantOrder[] = [
  {
    id: 201,
    product_id: "prod-1",
    product_name: "Wireless Mechanical Keyboard",
    product_brand: "KeyTech",
    product_image_url: "https://example.com/keyboard.jpg",
    bought_price: 129.99,
    quantity: 2,
    total_price: 259.98,
    status: "pending",
    address: "742 Evergreen Terrace, Springfield",
    buyer_name: "Homer Simpson",
    created_at: "2026-09-06T10:00:00Z",
  },
  {
    id: 202,
    product_id: "prod-2",
    product_name: "Gaming Mouse Pad",
    product_brand: "GlidePro",
    product_image_url: null,
    bought_price: 19.5,
    quantity: 1,
    total_price: 19.5,
    status: "confirmed",
    address: "123 Main St, Cityville",
    buyer_name: "Marge Simpson",
    created_at: "2026-09-05T14:30:00Z",
  },
  {
    id: 203,
    product_id: "prod-3",
    product_name: "USB-C Fast Charger 65W",
    product_brand: "ChargeFast",
    product_image_url: null,
    bought_price: 34.0,
    quantity: 1,
    total_price: 34.0,
    status: "delivered",
    address: "456 Elm St, Smalltown",
    buyer_name: "Bart Simpson",
    created_at: "2026-09-04T09:15:00Z",
  },
];

describe("IncomingOrdersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while orders are loading", () => {
    vi.spyOn(useDashboardModule, "useMerchantOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    renderWithClient(<IncomingOrdersTab />);
    expect(screen.getByTestId("orders-loading")).toBeInTheDocument();
  });

  it("renders error state when fetching incoming orders fails", () => {
    vi.spyOn(useDashboardModule, "useMerchantOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: true,
      error: new Error("Server error fetching orders"),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    renderWithClient(<IncomingOrdersTab />);
    expect(screen.getByTestId("orders-error-state")).toBeInTheDocument();
    expect(
      screen.getByText("Server error fetching orders")
    ).toBeInTheDocument();
  });

  it("renders empty state when there are zero orders", () => {
    vi.spyOn(useDashboardModule, "useMerchantOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    renderWithClient(<IncomingOrdersTab />);
    expect(screen.getByTestId("empty-orders-state")).toBeInTheDocument();
    expect(screen.getByText("No Orders Found")).toBeInTheDocument();
  });

  it("renders list of orders with product details, buyer names, total prices, and status badges", () => {
    vi.spyOn(useDashboardModule, "useMerchantOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    renderWithClient(<IncomingOrdersTab />);

    expect(screen.getByTestId("merchant-orders-list")).toBeInTheDocument();

    // Order 201
    expect(screen.getByText("Order #201")).toBeInTheDocument();
    expect(
      screen.getByText("Wireless Mechanical Keyboard")
    ).toBeInTheDocument();
    expect(screen.getByText(/Buyer: Homer Simpson/i)).toBeInTheDocument();
    expect(screen.getByText("$259.98")).toBeInTheDocument();
    expect(
      screen.getByText("742 Evergreen Terrace, Springfield")
    ).toBeInTheDocument();

    // Order 202
    expect(screen.getByText("Order #202")).toBeInTheDocument();
    expect(screen.getByText("Gaming Mouse Pad")).toBeInTheDocument();
    expect(screen.getByText(/Buyer: Marge Simpson/i)).toBeInTheDocument();
    expect(screen.getByText("$19.50")).toBeInTheDocument();

    // Order 203
    expect(screen.getByText("Order #203")).toBeInTheDocument();
    expect(screen.getByText("USB-C Fast Charger 65W")).toBeInTheDocument();
  });

  it("renders Ready for Pickup button ONLY for pending orders", () => {
    vi.spyOn(useDashboardModule, "useMerchantOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    renderWithClient(<IncomingOrdersTab />);

    // Order 201 is pending -> button should exist
    expect(
      screen.getByTestId("ready-for-pickup-button-201")
    ).toBeInTheDocument();

    // Orders 202 (confirmed) and 203 (delivered) -> button should NOT exist
    expect(
      screen.queryByTestId("ready-for-pickup-button-202")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("ready-for-pickup-button-203")
    ).not.toBeInTheDocument();
  });

  it("calls update order status mutation when Ready for Pickup is clicked", async () => {
    const mockUpdateMutateAsync = vi.fn().mockResolvedValue({
      ...mockOrdersList[0],
      status: "confirmed",
    });

    vi.spyOn(useDashboardModule, "useMerchantOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    vi.spyOn(useDashboardModule, "useUpdateOrderStatus").mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDashboardModule.useUpdateOrderStatus>);

    renderWithClient(<IncomingOrdersTab />);

    const pickupBtn = screen.getByTestId("ready-for-pickup-button-201");
    fireEvent.click(pickupBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        orderId: 201,
        status: "confirmed",
      });
    });
  });

  it("allows switching filter pills", () => {
    const useMerchantOrdersSpy = vi.spyOn(
      useDashboardModule,
      "useMerchantOrders"
    ).mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOrders>);

    renderWithClient(<IncomingOrdersTab />);

    const pendingFilter = screen.getByTestId("status-filter-pending");
    fireEvent.click(pendingFilter);

    expect(useMerchantOrdersSpy).toHaveBeenCalledWith("pending");
  });
});
