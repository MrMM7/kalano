import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProductDetailPage from "@/app/products/[id]/page";
import * as useProductDetailModule from "@/lib/hooks/use-product-detail";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useCartModule from "@/lib/hooks/use-cart";
import { ProductDetailResponse } from "@/types/product";

let mockParams = { id: "prod-100" };

vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(useCartModule, "useAddToCart").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCartModule.useAddToCart>);
  });

  it("renders product detail specifications and featured offer on success", () => {
    mockParams = { id: "prod-100" };
    vi.spyOn(useProductDetailModule, "useProductDetail").mockReturnValue({
      data: mockProductDetail,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductDetailModule.useProductDetail>);

    render(<ProductDetailPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Ultra HD 4K Monitor" })
    ).toBeInTheDocument();
    expect(screen.getByText("ViewMaster")).toBeInTheDocument();
    expect(
      screen.getByText(/27-inch IPS panel with 144Hz/i)
    ).toBeInTheDocument();

    const priceElements = screen.getAllByText("$299.99");
    expect(priceElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/Sold by TechPlanet/)).toBeInTheDocument();
  });

  it("updates active offer card when user selects alternative seller offer", () => {
    mockParams = { id: "prod-100" };
    vi.spyOn(useProductDetailModule, "useProductDetail").mockReturnValue({
      data: mockProductDetail,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductDetailModule.useProductDetail>);

    render(<ProductDetailPage />);

    // Initial offer
    expect(screen.getByText(/Sold by TechPlanet/)).toBeInTheDocument();

    // In the offers table, the second offer has a "Select Offer" button
    const selectButton = screen.getByRole("button", {
      name: /Select offer from ExpressTech/i,
    });
    fireEvent.click(selectButton);

    // Price updates to $319.99 and seller changes to ExpressTech
    const priceElements = screen.getAllByText("$319.99");
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Sold by ExpressTech/)).toBeInTheDocument();
  });

  it("renders 404 Product Not Found screen when item does not exist", () => {
    mockParams = { id: "missing-id" };
    vi.spyOn(useProductDetailModule, "useProductDetail").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        error: { code: "RESOURCE_NOT_FOUND", message: "Product not found" },
      } as unknown as Error,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductDetailModule.useProductDetail>);

    render(<ProductDetailPage />);

    expect(screen.getByTestId("product-not-found")).toBeInTheDocument();
    expect(screen.getByText("Product Not Found")).toBeInTheDocument();
  });

  it("renders out of stock banner when product has no in-stock offers", () => {
    mockParams = { id: "prod-100" };
    vi.spyOn(useProductDetailModule, "useProductDetail").mockReturnValue({
      data: {
        ...mockProductDetail,
        cheapest_offer: null,
        offers: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductDetailModule.useProductDetail>);

    render(<ProductDetailPage />);

    expect(
      screen.getByText(/currently unavailable \/ out of stock/i)
    ).toBeInTheDocument();
  });
});
