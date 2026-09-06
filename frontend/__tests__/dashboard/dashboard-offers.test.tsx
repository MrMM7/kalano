import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "@/app/dashboard/page";
import { MyOffersTab } from "@/components/dashboard/my-offers-tab";
import { EditOfferDialog } from "@/components/dashboard/edit-offer-dialog";
import { DeleteOfferDialog } from "@/components/dashboard/delete-offer-dialog";
import * as useDashboardModule from "@/lib/hooks/use-dashboard";
import * as useAuthModule from "@/lib/hooks/use-auth";
import { MerchantOffer } from "@/types/dashboard";
import { UserResponse } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
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

const mockBuyerUser: UserResponse = {
  id: "buyer-uuid-1",
  created_at: "2026-09-01T00:00:00Z",
  email: "buyer@kalano.com",
  display_name: "Alice Buyer",
  user_role: "buyer",
  address: "123 Main St",
};

const mockOffersList: MerchantOffer[] = [
  {
    id: "offer-1",
    product_id: "prod-1",
    product_name: "Wireless Mechanical Keyboard",
    product_brand: "KeyTech",
    product_description: "RGB wireless keyboard",
    product_image_url: "https://example.com/keyboard.jpg",
    price: 129.99,
    stock: 12,
    estimated_delivery_days: 3,
    created_at: "2026-09-01T12:00:00Z",
  },
  {
    id: "offer-2",
    product_id: "prod-2",
    product_name: "Gaming Mouse Pad",
    product_brand: "GlidePro",
    product_description: "Smooth gaming mouse pad",
    product_image_url: null,
    price: 19.5,
    stock: 3,
    estimated_delivery_days: 1,
    created_at: "2026-09-02T12:00:00Z",
  },
  {
    id: "offer-3",
    product_id: "prod-3",
    product_name: "USB-C Fast Charger 65W",
    product_brand: "ChargeFast",
    product_description: "GaN 65W charger",
    product_image_url: null,
    price: 34.0,
    stock: 0,
    estimated_delivery_days: null,
    created_at: "2026-09-03T12:00:00Z",
  },
];

describe("Dashboard Offers Tab and Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton while offers are loading", () => {
    vi.spyOn(useDashboardModule, "useMerchantOffers").mockReturnValue({
      offers: [],
      totalOffers: 0,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOffers>);

    renderWithClient(<MyOffersTab />);
    expect(screen.getByTestId("offers-loading")).toBeInTheDocument();
  });

  it("renders error state when fetching offers fails", () => {
    vi.spyOn(useDashboardModule, "useMerchantOffers").mockReturnValue({
      offers: [],
      totalOffers: 0,
      isLoading: false,
      isError: true,
      error: new Error("Network failure"),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOffers>);

    renderWithClient(<MyOffersTab />);
    expect(screen.getByTestId("offers-error-state")).toBeInTheDocument();
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  it("renders empty state when merchant has zero offers", () => {
    const onNavigate = vi.fn();
    vi.spyOn(useDashboardModule, "useMerchantOffers").mockReturnValue({
      offers: [],
      totalOffers: 0,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOffers>);

    renderWithClient(<MyOffersTab onNavigateToAddOffer={onNavigate} />);
    expect(screen.getByTestId("empty-offers-state")).toBeInTheDocument();
    expect(screen.getByText("No Active Product Offers")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", {
      name: /Add Your First Offer/i,
    });
    fireEvent.click(addBtn);
    expect(onNavigate).toHaveBeenCalled();
  });

  it("renders list of offers with correct prices, stock status badges, and delivery days", () => {
    vi.spyOn(useDashboardModule, "useMerchantOffers").mockReturnValue({
      offers: mockOffersList,
      totalOffers: 3,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardModule.useMerchantOffers>);

    renderWithClient(<MyOffersTab />);

    expect(screen.getByTestId("offers-table")).toBeInTheDocument();
    expect(
      screen.getByText("Wireless Mechanical Keyboard")
    ).toBeInTheDocument();
    expect(screen.getByText("Gaming Mouse Pad")).toBeInTheDocument();
    expect(screen.getByText("USB-C Fast Charger 65W")).toBeInTheDocument();

    expect(screen.getByText("$129.99")).toBeInTheDocument();
    expect(screen.getByText("$19.50")).toBeInTheDocument();
    expect(screen.getByText("$34.00")).toBeInTheDocument();

    // Stock badges
    expect(screen.getByText("In Stock (12)")).toBeInTheDocument();
    expect(screen.getByText("Low Stock (3)")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();

    // Delivery days
    expect(screen.getByText("3 days")).toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeInTheDocument();
    expect(screen.getByText("Not specified")).toBeInTheDocument();
  });

  it("opens edit dialog and calls update mutation on save", async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    vi.spyOn(useDashboardModule, "useUpdateOffer").mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDashboardModule.useUpdateOffer>);

    const onClose = vi.fn();
    renderWithClient(
      <EditOfferDialog
        offer={mockOffersList[0]}
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Price \(\$\)/i)
    ).toHaveValue(129.99);
    expect(screen.getByLabelText(/Available Stock/i)).toHaveValue(12);
    expect(
      screen.getByLabelText(/Estimated Delivery Days/i)
    ).toHaveValue(3);

    // Update price and submit
    fireEvent.change(screen.getByLabelText(/Price \(\$\)/i), {
      target: { value: "119.99" },
    });
    fireEvent.change(screen.getByLabelText(/Available Stock/i), {
      target: { value: "15" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        offerId: "offer-1",
        payload: {
          price: 119.99,
          stock: 15,
          estimated_delivery_days: 3,
        },
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("opens delete dialog and calls delete mutation on confirm", async () => {
    const mockDeleteMutateAsync = vi.fn().mockResolvedValue({});
    vi.spyOn(useDashboardModule, "useDeleteOffer").mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDashboardModule.useDeleteOffer>);

    const onClose = vi.fn();
    renderWithClient(
      <DeleteOfferDialog
        offer={mockOffersList[0]}
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to remove your offer/i)
    ).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /^Delete Offer$/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith("offer-1");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("displays Access Restricted when non-merchant user visits dashboard page", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    renderWithClient(<DashboardPage />);
    expect(
      screen.getByTestId("access-restricted-banner")
    ).toBeInTheDocument();
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(
      screen.getByText(/This area is reserved for merchant accounts/i)
    ).toBeInTheDocument();
  });
});
