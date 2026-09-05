import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/product-card";
import { ProductListItem } from "@/types/product";

const mockInStockProduct: ProductListItem = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  name: "Wireless Noise-Cancelling Headphones",
  description: "High-fidelity audio with active noise cancellation.",
  brand: "SoundWave",
  image_url: "https://example.com/headphones.jpg",
  cheapest_offer: {
    seller_product_id: "7ca85f64-5717-4562-b3fc-2c963f66afa7",
    seller_id: "9da85f64-5717-4562-b3fc-2c963f66afa8",
    seller_name: "AudioTech Store",
    price: 149.99,
    stock: 15,
    estimated_delivery_days: 2,
  },
};

const mockOutOfStockProduct: ProductListItem = {
  id: "4fa85f64-5717-4562-b3fc-2c963f66afa7",
  name: "Vintage Mechanical Keyboard",
  description: "Tactile mechanical keyboard with retro keycaps.",
  brand: "KeyCrafters",
  image_url: null,
  cheapest_offer: null,
};

describe("ProductCard", () => {
  it("renders product name, brand, image, and lowest price", () => {
    render(<ProductCard product={mockInStockProduct} />);

    expect(
      screen.getByText("Wireless Noise-Cancelling Headphones")
    ).toBeInTheDocument();
    expect(screen.getByText("SoundWave")).toBeInTheDocument();
    expect(screen.getByText("$149.99")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();

    const image = screen.getByRole("img", {
      name: "Wireless Noise-Cancelling Headphones",
    });
    expect(image).toHaveAttribute("src", "https://example.com/headphones.jpg");

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/products/3fa85f64-5717-4562-b3fc-2c963f66afa6"
    );
  });

  it("renders Out of Stock badge and placeholder icon when no offer exists", () => {
    render(<ProductCard product={mockOutOfStockProduct} />);

    expect(screen.getByText("Vintage Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText("KeyCrafters")).toBeInTheDocument();
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    expect(screen.queryByText("From")).not.toBeInTheDocument();
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });
});
