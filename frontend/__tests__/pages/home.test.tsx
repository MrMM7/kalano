import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import * as useProductsModule from "@/lib/hooks/use-products";
import { ProductsListResponse } from "@/types/product";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockProductsResponse: ProductsListResponse = {
  items: [
    {
      id: "prod-1",
      name: "Smart Fitness Watch",
      description: "Waterproof fitness tracker with heart rate monitor.",
      brand: "FitTech",
      image_url: "https://example.com/watch.jpg",
      cheapest_offer: {
        seller_product_id: "offer-1",
        seller_id: "seller-1",
        seller_name: "GearDeals",
        price: 89.99,
        stock: 20,
        estimated_delivery_days: 1,
      },
    },
    {
      id: "prod-2",
      name: "Ergonomic Office Chair",
      description: "Lumbar support mesh chair.",
      brand: "ComfortPlus",
      image_url: null,
      cheapest_offer: null,
    },
  ],
  total: 2,
  limit: 8,
  offset: 0,
};

describe("Home Page (Storefront)", () => {
  it("renders hero section, platform title, and search bar", () => {
    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: mockProductsResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /kalano/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a modern multi-vendor marketplace/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search products, brands, or descriptions...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /featured products/i })
    ).toBeInTheDocument();
  });

  it("renders skeleton loading state while fetching products", () => {
    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: true,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<Home />);

    expect(screen.getByTestId("featured-loading")).toBeInTheDocument();
    const skeletons = screen.getAllByTestId("product-card-skeleton");
    expect(skeletons).toHaveLength(8);
  });

  it("renders error state with retry button when fetch fails", () => {
    const refetchMock = vi.fn();
    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network connection lost"),
      refetch: refetchMock,
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<Home />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Unable to load products")).toBeInTheDocument();
    expect(screen.getByText("Network connection lost")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);
    expect(refetchMock).toHaveBeenCalled();
  });

  it("renders empty state when product catalog has no items", () => {
    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: { items: [], total: 0, limit: 8, offset: 0 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<Home />);

    expect(
      screen.getByText("No products available yet")
    ).toBeInTheDocument();
  });

  it("renders product cards when data is successfully loaded", () => {
    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: mockProductsResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<Home />);

    expect(screen.getByTestId("featured-grid")).toBeInTheDocument();
    expect(screen.getByText("Smart Fitness Watch")).toBeInTheDocument();
    expect(screen.getByText("Ergonomic Office Chair")).toBeInTheDocument();
    expect(screen.getByText("$89.99")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });
});
