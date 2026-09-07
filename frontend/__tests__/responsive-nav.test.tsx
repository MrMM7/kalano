import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileNav } from "@/components/layout/mobile-nav";
import * as useAuthModule from "@/lib/hooks/use-auth";
import { AuthContext } from "@/lib/auth-context";
import type { UserResponse } from "@/types/auth";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/",
}));

function renderWithProviders(
  ui: React.ReactElement,
  authContextOverride?: Partial<
    React.ComponentProps<typeof AuthContext.Provider>["value"]
  >
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    logout: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(undefined),
    ...authContextOverride,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("MobileNav Responsive Navigation (Spec 004)", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockLogout.mockReset();
    mockSearchParams = new URLSearchParams();

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });
  });

  describe("Drawer Toggle & Accessibility", () => {
    it("renders hamburger trigger button with accessible attributes", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveAttribute(
        "aria-controls",
        "mobile-navigation-drawer"
      );
    });

    it("opens drawer dialog upon clicking hamburger button and sets aria-expanded='true'", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      const dialog = screen.getByRole("dialog", {
        name: "Mobile Navigation",
      });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("closes drawer when clicking close button", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      const closeBtn = screen.getByRole("button", {
        name: "Close navigation menu",
      });
      expect(closeBtn).toBeInTheDocument();

      fireEvent.click(closeBtn);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByRole("dialog", { name: "Mobile Navigation" })
      ).not.toBeInTheDocument();
    });

    it("closes drawer when pressing Escape key", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      expect(
        screen.getByRole("dialog", { name: "Mobile Navigation" })
      ).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByRole("dialog", { name: "Mobile Navigation" })
      ).not.toBeInTheDocument();
    });
  });

  describe("Navigation Links & Search in Drawer", () => {
    it("renders Home and Catalog links and closes drawer on link click", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      const homeLink = screen.getByRole("link", { name: /^home$/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");

      const catalogLink = screen.getByRole("link", { name: /^catalog$/i });
      expect(catalogLink).toBeInTheDocument();
      expect(catalogLink).toHaveAttribute("href", "/products");

      // Clicking a link closes the drawer
      fireEvent.click(catalogLink);
      expect(
        screen.queryByRole("dialog", { name: "Mobile Navigation" })
      ).not.toBeInTheDocument();
    });

    it("renders search bar and closes drawer when search is submitted", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      const searchInput = screen.getByLabelText("Search products");
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(searchInput, {
        target: { value: "mechanical keyboard" },
      });
      fireEvent.submit(screen.getByRole("search"));

      expect(mockPush).toHaveBeenCalledWith(
        "/products?q=mechanical%20keyboard"
      );
      expect(
        screen.queryByRole("dialog", { name: "Mobile Navigation" })
      ).not.toBeInTheDocument();
    });
  });

  describe("Authentication States in MobileNav", () => {
    it("shows Log In and Sign Up buttons when unauthenticated", () => {
      renderWithProviders(<MobileNav />);

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      const loginLink = screen.getByRole("link", { name: /log in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");

      const signupLink = screen.getByRole("link", { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute("href", "/signup");

      expect(
        screen.queryByRole("button", { name: /log out/i })
      ).not.toBeInTheDocument();
    });

    it("shows buyer details, My Orders, My Cart, and Log Out button when authenticated as buyer", async () => {
      const buyerUser: UserResponse = {
        id: "buyer-123",
        created_at: "2026-09-01T00:00:00Z",
        email: "buyer@example.com",
        display_name: "Sarah Connor",
        user_role: "buyer",
        address: "123 Tech Lane",
      };

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: buyerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        refreshUser: vi.fn(),
      });

      renderWithProviders(<MobileNav />, { user: buyerUser });

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
      expect(screen.getByText("Buyer")).toBeInTheDocument();

      const ordersLink = screen.getByRole("link", { name: /my orders/i });
      expect(ordersLink).toBeInTheDocument();
      expect(ordersLink).toHaveAttribute("href", "/orders");

      const cartLink = screen.getByRole("link", { name: /my cart/i });
      expect(cartLink).toBeInTheDocument();
      expect(cartLink).toHaveAttribute("href", "/cart");

      const logoutBtn = screen.getByRole("button", { name: /log out/i });
      expect(logoutBtn).toBeInTheDocument();

      fireEvent.click(logoutBtn);
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("shows merchant Seller Dashboard link when authenticated as merchant", () => {
      const merchantUser: UserResponse = {
        id: "merchant-123",
        created_at: "2026-09-01T00:00:00Z",
        email: "merchant@example.com",
        display_name: "Apex Electronics",
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

      renderWithProviders(<MobileNav />, { user: merchantUser });

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      expect(screen.getByText("Apex Electronics")).toBeInTheDocument();
      expect(screen.getByText("Merchant")).toBeInTheDocument();

      const dashboardLink = screen.getByRole("link", {
        name: /seller dashboard/i,
      });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });

    it("shows logistics Logistics Dashboard link when authenticated as logistics", () => {
      const logisticsUser: UserResponse = {
        id: "logistics-123",
        created_at: "2026-09-01T00:00:00Z",
        email: "dispatch@kalano.internal",
        display_name: "Dispatch Center",
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

      renderWithProviders(<MobileNav />, { user: logisticsUser });

      const trigger = screen.getByRole("button", {
        name: "Open navigation menu",
      });
      fireEvent.click(trigger);

      expect(screen.getByText("Dispatch Center")).toBeInTheDocument();
      expect(screen.getByText("Logistics")).toBeInTheDocument();

      const logisticsLink = screen.getByRole("link", {
        name: /logistics dashboard/i,
      });
      expect(logisticsLink).toBeInTheDocument();
      expect(logisticsLink).toHaveAttribute("href", "/logistics");
    });
  });
});
