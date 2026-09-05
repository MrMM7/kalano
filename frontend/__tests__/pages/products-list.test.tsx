import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ProductsPage from "@/app/products/page";
import * as useProductsModule from "@/lib/hooks/use-products";
import { ProductsListResponse } from "@/types/product";

const pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => mockSearchParams,
}));

const mockProductsData: ProductsListResponse = {
  items: [
    {
      id: "prod-1",
      name: "Wireless Earbuds",
      description: "True wireless Bluetooth earbuds with charging case.",
      brand: "SoundCore",
      image_url: "https://example.com/earbuds.jpg",
      cheapest_offer: {
        seller_product_id: "off-1",
        seller_id: "sel-1",
        seller_name: "AudioWorld",
        price: 49.99,
        stock: 50,
        estimated_delivery_days: 2,
      },
    },
    {
      id: "prod-2",
      name: "USB-C Fast Charger",
      description: "65W GaN dual port charger.",
      brand: "PowerGen",
      image_url: null,
      cheapest_offer: null,
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

describe("Products Listing Page", () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it("renders catalog page with all products when no query is present", () => {
    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: mockProductsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<ProductsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "All Products" })
    ).toBeInTheDocument();
    expect(screen.getByText("Found 2 products")).toBeInTheDocument();
    expect(screen.getByText("Wireless Earbuds")).toBeInTheDocument();
    expect(screen.getByText("USB-C Fast Charger")).toBeInTheDocument();
  });

  it("displays search query in header when q parameter is in URL", () => {
    mockSearchParams = new URLSearchParams("q=earbuds&limit=20&offset=0");

    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: {
        items: [mockProductsData.items[0]],
        total: 1,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<ProductsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: 'Results for "earbuds"' })
    ).toBeInTheDocument();
    expect(screen.getByText("Found 1 product")).toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(pushMock).toHaveBeenCalledWith("/products");
  });

  it("renders empty state when search query returns 0 results", () => {
    mockSearchParams = new URLSearchParams("q=nonexistent");

    vi.spyOn(useProductsModule, "useProducts").mockReturnValue({
      data: {
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof useProductsModule.useProducts>);

    render(<ProductsPage />);

    expect(
      screen.getByText('No products found matching "nonexistent"')
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /view all products/i })
    ).toBeInTheDocument();
  });
});
