import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProductDetailPage from "@/app/products/[id]/page";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useCartModule from "@/lib/hooks/use-cart";
import * as useProductDetailModule from "@/lib/hooks/use-product-detail";
import { ProductDetailResponse } from "@/types/product";
import { UserResponse } from "@/types/auth";
import { toast } from "sonner";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "prod-100" }),
  useRouter: () => ({
    push: mockRouterPush,
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

const mockProductDetail: ProductDetailResponse = {
  id: "prod-100",
  name: "Ultra HD 4K Monitor",
  description: "27-inch IPS panel with 144Hz refresh rate and HDR support.",
  brand: "ViewMaster",
  image_url: "https://example.com/monitor.jpg",
  created_at: "2026-09-01T10:00:00Z",
  cheapest_offer: {
    seller_product_id: "sp-1",
    seller_id: "s-1",
    seller_name: "TechPlanet",
    price: 299.99,
    stock: 12,
    estimated_delivery_days: 2,
  },
  offers: [
    {
      seller_product_id: "sp-1",
      seller_id: "s-1",
      seller_name: "TechPlanet",
      price: 299.99,
      stock: 12,
      estimated_delivery_days: 2,
    },
    {
      seller_product_id: "sp-2",
      seller_id: "s-2",
      seller_name: "ExpressTech",
      price: 319.99,
      stock: 8,
      estimated_delivery_days: 1,
    },
  ],
};

describe("ProductDetail Add to Cart Flow", () => {
  const mockAddToCartMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useProductDetailModule, "useProductDetail").mockReturnValue({
      data: mockProductDetail,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductDetailModule.useProductDetail>);

    vi.spyOn(useCartModule, "useAddToCart").mockReturnValue({
      mutateAsync: mockAddToCartMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCartModule.useAddToCart>);
  });

  it("redirects unauthenticated user to login with redirect param", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ProductDetailPage />);

    const addToCartButton = screen.getByRole("button", {
      name: /Add to cart from TechPlanet/i,
    });
    fireEvent.click(addToCartButton);

    expect(mockRouterPush).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent("/products/prod-100")}`
    );
    expect(mockAddToCartMutate).not.toHaveBeenCalled();
  });

  it("adds default cheapest seller offer to cart when authenticated", async () => {
    mockAddToCartMutate.mockResolvedValue({});
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ProductDetailPage />);

    const addToCartButton = screen.getByRole("button", {
      name: /Add to cart from TechPlanet/i,
    });
    fireEvent.click(addToCartButton);

    expect(mockAddToCartMutate).toHaveBeenCalledWith({
      seller_product_id: "sp-1",
      quantity: 1,
    });
  });

  it("adds alternative selected seller offer to cart when chosen from offers table", async () => {
    mockAddToCartMutate.mockResolvedValue({});
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ProductDetailPage />);

    // Select alternative offer
    const selectExpressBtn = screen.getByRole("button", {
      name: /Select offer from ExpressTech/i,
    });
    fireEvent.click(selectExpressBtn);

    const addToCartButton = screen.getByRole("button", {
      name: /Add to cart from ExpressTech/i,
    });
    fireEvent.click(addToCartButton);

    expect(mockAddToCartMutate).toHaveBeenCalledWith({
      seller_product_id: "sp-2",
      quantity: 1,
    });
  });

  it("disables button and displays loading text while mutation is pending", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useAddToCart").mockReturnValue({
      mutateAsync: mockAddToCartMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useCartModule.useAddToCart>);

    render(<ProductDetailPage />);

    const button = screen.getByRole("button", {
      name: /Add to cart from TechPlanet/i,
    });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Adding to Cart.../i)).toBeInTheDocument();
  });

  it("shows error toast when mutation fails with INSUFFICIENT_STOCK", async () => {
    mockAddToCartMutate.mockRejectedValue({
      error: { code: "INSUFFICIENT_STOCK", message: "Only 12 available" },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockBuyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(<ProductDetailPage />);

    const addToCartButton = screen.getByRole("button", {
      name: /Add to cart from TechPlanet/i,
    });
    fireEvent.click(addToCartButton);

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Cannot add to cart: stock limit reached."
      );
    });
  });
});
