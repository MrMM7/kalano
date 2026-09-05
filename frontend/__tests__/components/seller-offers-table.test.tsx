import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SellerOffersTable } from "@/components/seller-offers-table";
import { SellerOffer } from "@/types/product";

const mockOffers: SellerOffer[] = [
  {
    seller_product_id: "offer-1",
    seller_id: "seller-1",
    seller_name: "Apex Electronics",
    price: 199.99,
    stock: 10,
    estimated_delivery_days: 2,
  },
  {
    seller_product_id: "offer-2",
    seller_id: "seller-2",
    seller_name: "Prime Superstore",
    price: 219.0,
    stock: 5,
    estimated_delivery_days: null,
  },
  {
    seller_product_id: "offer-3",
    seller_id: "seller-3",
    seller_name: "Budget Mart",
    price: 189.5,
    stock: 0,
    estimated_delivery_days: 5,
  },
];

describe("SellerOffersTable", () => {
  it("renders all seller rows with price, delivery days, and stock status", () => {
    const onSelectMock = vi.fn();
    render(
      <SellerOffersTable
        offers={mockOffers}
        selectedOfferId="offer-1"
        onSelectOffer={onSelectMock}
      />
    );

    expect(screen.getByText("Apex Electronics")).toBeInTheDocument();
    expect(screen.getByText("$199.99")).toBeInTheDocument();
    expect(screen.getByText("2 days")).toBeInTheDocument();
    expect(screen.getByText("10 available")).toBeInTheDocument();

    expect(screen.getByText("Prime Superstore")).toBeInTheDocument();
    expect(screen.getByText("Standard delivery")).toBeInTheDocument();

    expect(screen.getByText("Budget Mart")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("handles offer selection when clicking Select Offer button", () => {
    const onSelectMock = vi.fn();
    render(
      <SellerOffersTable
        offers={mockOffers}
        selectedOfferId="offer-1"
        onSelectOffer={onSelectMock}
      />
    );

    const selectButtons = screen.getAllByRole("button");
    // Offer 1 is Selected (disabled)
    expect(selectButtons[0]).toHaveTextContent("Selected");
    expect(selectButtons[0]).toBeDisabled();

    // Offer 2 is Select Offer (enabled)
    expect(selectButtons[1]).toHaveTextContent("Select Offer");
    expect(selectButtons[1]).not.toBeDisabled();
    fireEvent.click(selectButtons[1]);
    expect(onSelectMock).toHaveBeenCalledWith("offer-2");

    // Offer 3 is out of stock (disabled)
    expect(selectButtons[2]).toBeDisabled();
  });
});
