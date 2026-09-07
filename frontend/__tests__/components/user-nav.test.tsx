import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { UserNav } from "@/components/layout/user-nav";
import * as useAuthModule from "@/lib/hooks/use-auth";
import type { UserResponse } from "@/types/auth";

describe("UserNav", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLogout.mockReset();
  });

  it("renders loading skeleton when isLoading is true", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    const { container } = render(<UserNav />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("Log In")).not.toBeInTheDocument();
  });

  it("renders Log In and Sign Up buttons when unauthenticated", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(<UserNav />);

    const loginLink = screen.getByRole("link", { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");

    const signupLink = screen.getByRole("link", { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("renders trigger and buyer menu items when authenticated as buyer", () => {
    const buyerUser: UserResponse = {
      id: "buyer-123",
      created_at: "2026-09-01T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Alice Walker",
      user_role: "buyer",
      address: "123 Main St",
    };

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: buyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(<UserNav />);

    const trigger = screen.getByRole("button", {
      name: /user (profile )?menu/i,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByText("Alice Walker")).toBeInTheDocument();
    expect(screen.getByText("AW")).toBeInTheDocument();

    // Open dropdown menu
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();

    // Header displays display_name, email, and role badge
    expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();

    // Role-specific links for buyer
    const ordersLink = screen.getByRole("menuitem", { name: /my orders/i });
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute("href", "/orders");

    const cartLink = screen.getByRole("menuitem", { name: /my cart/i });
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute("href", "/cart");

    // Logout button
    const logoutButton = screen.getByRole("menuitem", { name: /log out/i });
    expect(logoutButton).toBeInTheDocument();

    // Clicking logout invokes logout()
    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders merchant role badge and navigation links when logged in as merchant", () => {
    const merchantUser: UserResponse = {
      id: "merchant-456",
      created_at: "2026-09-01T00:00:00Z",
      email: "merchant@example.com",
      display_name: "Bob Seller",
      user_role: "merchant",
      address: null,
    };

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: merchantUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(<UserNav />);

    const trigger = screen.getByRole("button", {
      name: /user (profile )?menu/i,
    });
    fireEvent.click(trigger);

    expect(screen.getByText("Merchant")).toBeInTheDocument();

    const dashboardLink = screen.getByRole("menuitem", {
      name: /seller dashboard/i,
    });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    const catalogLink = screen.getByRole("menuitem", { name: /catalog/i });
    expect(catalogLink).toBeInTheDocument();
    expect(catalogLink).toHaveAttribute("href", "/products");

    expect(
      screen.queryByRole("menuitem", { name: /my orders/i })
    ).not.toBeInTheDocument();
  });

  it("renders logistics role badge and navigation links when logged in as logistics", () => {
    const logisticsUser: UserResponse = {
      id: "logistics-789",
      created_at: "2026-09-01T00:00:00Z",
      email: "driver@example.com",
      display_name: "Charlie Driver",
      user_role: "logistics",
      address: null,
    };

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: logisticsUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(<UserNav />);

    const trigger = screen.getByRole("button", {
      name: /user (profile )?menu/i,
    });
    fireEvent.click(trigger);

    expect(screen.getByText("Logistics")).toBeInTheDocument();

    const logisticsLink = screen.getByRole("menuitem", {
      name: /logistics dashboard/i,
    });
    expect(logisticsLink).toBeInTheDocument();
    expect(logisticsLink).toHaveAttribute("href", "/logistics");

    expect(
      screen.queryByRole("menuitem", { name: /seller dashboard/i })
    ).not.toBeInTheDocument();
  });

  it("closes dropdown when Escape key is pressed", () => {
    const buyerUser: UserResponse = {
      id: "buyer-123",
      created_at: "2026-09-01T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Alice Walker",
      user_role: "buyer",
      address: null,
    };

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: buyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(<UserNav />);

    const trigger = screen.getByRole("button", {
      name: /user (profile )?menu/i,
    });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    const buyerUser: UserResponse = {
      id: "buyer-123",
      created_at: "2026-09-01T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Alice Walker",
      user_role: "buyer",
      address: null,
    };

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: buyerUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    render(
      <div>
        <span data-testid="outside-element">Outside</span>
        <UserNav />
      </div>
    );

    const trigger = screen.getByRole("button", {
      name: /user (profile )?menu/i,
    });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside-element"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
