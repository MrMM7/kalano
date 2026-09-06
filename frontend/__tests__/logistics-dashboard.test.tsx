import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LogisticsPage from "@/app/logistics/page";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useLogisticsModule from "@/lib/hooks/use-logistics";
import { LogisticsOrderItem } from "@/types/logistics";
import { UserResponse } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

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

const mockLogisticsUser: UserResponse = {
  id: "logistics-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "logistics@kalano.com",
  display_name: "Logistics Officer Bob",
  user_role: "logistics",
  address: "1 Logistics Way",
};

const mockBuyerUser: UserResponse = {
  id: "buyer-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "buyer@example.com",
  display_name: "Alice Buyer",
  user_role: "buyer",
  address: "123 Main St",
};

const mockMerchantUser: UserResponse = {
  id: "merchant-123",
  created_at: "2026-09-01T00:00:00Z",
  email: "seller@example.com",
  display_name: "Sam Seller",
  user_role: "merchant",
  address: "456 Market St",
};

const mockOrdersList: LogisticsOrderItem[] = [
  {
    id: 101,
    product_id: "prod-1",
    product_name: "Mechanical Keyboard",
    product_brand: "KeyTech",
    product_image_url: "https://example.com/keyboard.jpg",
    seller_id: "seller-1",
    seller_name: "KeyTech Official",
    buyer_id: "buyer-1",
    buyer_name: "Alice Johnson",
    address: "742 Evergreen Terrace, Springfield",
    bought_price: 120.0,
    quantity: 1,
    subtotal: 120.0,
    delivery_types: "pending",
    created_at: "2026-09-06T10:00:00Z",
  },
  {
    id: 102,
    product_id: "prod-2",
    product_name: "Gaming Headset",
    product_brand: "AudioPro",
    product_image_url: null,
    seller_id: "seller-2",
    seller_name: "Audio World",
    buyer_id: "buyer-2",
    buyer_name: "Bob Smith",
    address: "100 Maple St, Metropolis",
    bought_price: 80.0,
    quantity: 2,
    subtotal: 160.0,
    delivery_types: "shipped",
    created_at: "2026-09-05T14:00:00Z",
  },
  {
    id: 103,
    product_id: "prod-3",
    product_name: "Smart Watch",
    product_brand: "TimeTech",
    product_image_url: null,
    seller_id: "seller-3",
    seller_name: "Gadget Hub",
    buyer_id: "buyer-3",
    buyer_name: "Charlie Brown",
    address: "50 Pine Ave, Gotham",
    bought_price: 250.0,
    quantity: 1,
    subtotal: 250.0,
    delivery_types: "delivered",
    created_at: "2026-09-04T09:00:00Z",
  },
];

describe("LogisticsPage", () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(
      useLogisticsModule,
      "useUpdateLogisticsOrderStatus"
    ).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<
      typeof useLogisticsModule.useUpdateLogisticsOrderStatus
    >);
  });

  it("renders loading skeleton while auth is loading", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);
    expect(screen.getByTestId("logistics-page-skeleton")).toBeInTheDocument();
  });

  it("renders Access Denied banner when user is a buyer", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);
    expect(screen.getByTestId("access-denied-banner")).toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("renders Access Denied banner when user is a merchant", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockMerchantUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: [],
      totalOrders: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);
    expect(screen.getByTestId("access-denied-banner")).toBeInTheDocument();
  });

  it("renders full dashboard with metrics and orders table for logistics user", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockLogisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);

    // Header operator info
    expect(screen.getByText("Logistics Officer Bob")).toBeInTheDocument();
    expect(screen.getByText("Logistics Hub")).toBeInTheDocument();

    // Metrics
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("Pending Pickup")).toBeInTheDocument();
    expect(screen.getByText("In Transit")).toBeInTheDocument();

    // Orders table
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Gaming Headset")).toBeInTheDocument();
    expect(screen.getByText("Smart Watch")).toBeInTheDocument();

    // Customer shipping addresses
    expect(
      screen.getByText("742 Evergreen Terrace, Springfield")
    ).toBeInTheDocument();
  });

  it("filters orders by status tab", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockLogisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);

    // Click "Pending" tab button
    const pendingTab = screen.getByRole("tab", { name: /Pending/i });
    fireEvent.click(pendingTab);

    // Mechanical Keyboard is pending, so it should remain
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    // Gaming Headset is shipped, so it should be filtered out
    expect(screen.queryByText("Gaming Headset")).not.toBeInTheDocument();
  });

  it("filters orders in real-time by search query", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockLogisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "Charlie" } });

    expect(screen.getByText("Smart Watch")).toBeInTheDocument();
    expect(screen.queryByText("Mechanical Keyboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Gaming Headset")).not.toBeInTheDocument();
  });

  it("triggers status mutation when 'End Delivery' button is clicked", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockLogisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);

    // Find "End Delivery" button for shipped order (#102)
    const endDeliveryBtn = screen.getByRole("button", {
      name: /End Delivery/i,
    });
    expect(endDeliveryBtn).toBeInTheDocument();

    fireEvent.click(endDeliveryBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 102,
        status: "delivered",
      });
    });
  });

  it("triggers status mutation when 'Confirm Pickup' is clicked", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockLogisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);

    const confirmPickupBtn = screen.getByRole("button", {
      name: /Confirm Pickup/i,
    });
    expect(confirmPickupBtn).toBeInTheDocument();

    fireEvent.click(confirmPickupBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 101,
        status: "confirmed",
      });
    });
  });

  it("opens confirmation dialog and confirms order cancellation", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockLogisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useLogisticsModule, "useLogisticsOrders").mockReturnValue({
      orders: mockOrdersList,
      totalOrders: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useLogisticsModule.useLogisticsOrders>);

    renderWithClient(<LogisticsPage />);

    // Find cancel buttons (e.g. for pending order #101)
    const cancelButtons = screen.getAllByRole("button", {
      name: /cancel order #101/i,
    });
    expect(cancelButtons.length).toBeGreaterThan(0);

    fireEvent.click(cancelButtons[0]);

    // Modal dialog should appear
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Cancel Order Fulfillment/i)).toBeInTheDocument();

    // Click confirm in the modal
    const confirmCancelBtn = screen.getByRole("button", {
      name: /^Cancel Order$/i,
    });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 101,
        status: "cancelled",
      });
    });
  });
});
