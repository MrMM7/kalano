import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NavSearch } from "@/components/layout/nav-search";

const pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe("NavSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders with search input and submit button", () => {
    render(<NavSearch placeholder="Search tech items..." />);

    const input = screen.getByPlaceholderText("Search tech items...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-label", "Search products");
    expect(
      screen.getByRole("button", { name: "Submit search" })
    ).toBeInTheDocument();
  });

  it("prefills input when q search parameter is present", () => {
    mockSearchParams = new URLSearchParams("q=laptop");
    render(<NavSearch />);

    const input = screen.getByLabelText("Search products") as HTMLInputElement;
    expect(input.value).toBe("laptop");
  });

  it("navigates to /products?q={encoded} on form submission", () => {
    render(<NavSearch />);

    const input = screen.getByLabelText("Search products");
    fireEvent.change(input, { target: { value: "wireless mouse & keyboard" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith(
      "/products?q=wireless%20mouse%20%26%20keyboard"
    );
  });

  it("does not navigate when empty or whitespace-only search is submitted", () => {
    render(<NavSearch />);

    const input = screen.getByLabelText("Search products");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).not.toHaveBeenCalled();
  });
});
