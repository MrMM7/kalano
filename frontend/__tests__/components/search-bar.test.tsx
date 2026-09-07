import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "@/components/search-bar";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("SearchBar", () => {
  it("renders with input and search button", () => {
    render(<SearchBar placeholder="Find tech gear..." />);

    const input = screen.getByPlaceholderText("Find tech gear...");
    expect(input).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("navigates to /products?q={query} on form submission", () => {
    pushMock.mockClear();
    render(<SearchBar />);

    const input = screen.getByLabelText("Search products");
    fireEvent.change(input, { target: { value: "mechanical keyboard" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith(
      "/products?q=mechanical%20keyboard&limit=20&offset=0"
    );
  });

  it("navigates to /products when empty or whitespace-only search is submitted", () => {
    pushMock.mockClear();
    render(<SearchBar />);

    const input = screen.getByLabelText("Search products");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/products");
  });
});
