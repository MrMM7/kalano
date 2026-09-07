import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Navbar } from "@/components/layout/navbar";
import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useCartModule from "@/lib/hooks/use-cart";
import type { UserResponse } from "@/types/auth";
import type { CartResponse } from "@/types/cart";

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

function mockCartData(data?: Partial<CartResponse>) {
  vi.spyOn(useCartModule, "useCart").mockReturnValue({
    data: data as CartResponse | undefined,
  } as unknown as ReturnType<typeof useCartModule.useCart>);
}

describe("Navbar", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockLogout.mockReset();
    mockSearchParams = new URLSearchParams();

    // Default: unauthenticated user
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    // Default: empty cart
    mockCartData({
      id: 1,
      user_id: "guest",
      items: [],
      total_items: 0,
      total_price: 0,
    });
  });

  describe("Brand & Main Links", () => {
    it("renders brand logo linking to '/' and catalog link to '/products'", () => {
      render(<Navbar />);

      const brandLink = screen.getByRole("link", { name: /kalano/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute("href", "/");
      expect(brandLink).toHaveTextContent("Kalano");

      const catalogLink = screen.getByRole("link", { name: /^catalog$/i });
      expect(catalogLink).toBeInTheDocument();
      expect(catalogLink).toHaveAttribute("href", "/products");
    });

    it("applies custom className and sticky positioning to header", () => {
      const { container } = render(<Navbar className="custom-navbar-class" />);
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("custom-navbar-class");
      expect(header).toHaveClass("sticky");
      expect(header).toHaveClass("top-0");
    });
  });

  describe("Search Bar", () => {
    it("renders persistent search bar form with accessible input and submit button", () => {
      render(<Navbar />);

      const searchForm = screen.getByRole("search");
      expect(searchForm).toBeInTheDocument();

      const searchInput = screen.getByLabelText("Search products");
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute("type", "search");

      const submitButton = screen.getByRole("button", {
        name: "Submit search",
      });
      expect(submitButton).toBeInTheDocument();
    });

    it("submits search query and navigates to /products?q={query}", () => {
      render(<Navbar />);

      const searchInput = screen.getByLabelText("Search products");
      fireEvent.change(searchInput, {
        target: { value: "wireless mechanical keyboard" },
      });
      fireEvent.submit(screen.getByRole("search"));

      expect(mockPush).toHaveBeenCalledWith(
        "/products?q=wireless%20mechanical%20keyboard"
      );
    });

    it("does not trigger navigation on empty or whitespace search submission", () => {
      render(<Navbar />);

      const searchInput = screen.getByLabelText("Search products");
      fireEvent.change(searchInput, { target: { value: "   " } });
      fireEvent.submit(screen.getByRole("search"));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Unauthenticated State", () => {
    it("renders Log In and Sign Up links when user is null", () => {
      render(<Navbar />);

      const loginLink = screen.getByRole("link", { name: /log in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");

      const signupLink = screen.getByRole("link", { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute("href", "/signup");

      expect(
        screen.queryByRole("button", { name: /user (profile )?menu/i })
      ).not.toBeInTheDocument();
    });

    it("renders loading skeleton when auth is loading", () => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: mockLogout,
        refreshUser: vi.fn(),
      });

      const { container } = render(<Navbar />);
      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /log in/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /sign up/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Authenticated State - Buyer", () => {
    const buyerUser: UserResponse = {
      id: "buyer-001",
      created_at: "2026-09-01T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Alice Walker",
      user_role: "buyer",
      address: "123 Main St",
    };

    beforeEach(() => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: buyerUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("renders user dropdown trigger with buyer display name", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Alice Walker");
      expect(
        screen.queryByRole("link", { name: /log in/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /sign up/i })
      ).not.toBeInTheDocument();
    });

    it("shows My Orders and My Cart links when dropdown is opened", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
      expect(screen.getByText("Buyer")).toBeInTheDocument();

      const ordersLink = screen.getByRole("menuitem", { name: /my orders/i });
      expect(ordersLink).toBeInTheDocument();
      expect(ordersLink).toHaveAttribute("href", "/orders");

      const cartLink = screen.getByRole("menuitem", { name: /my cart/i });
      expect(cartLink).toBeInTheDocument();
      expect(cartLink).toHaveAttribute("href", "/cart");

      // Seller and Logistics dashboard links should not be present
      expect(
        screen.queryByRole("menuitem", { name: /seller dashboard/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: /logistics dashboard/i })
      ).not.toBeInTheDocument();
    });

    it("invokes logout handler when Log Out menuitem is clicked", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      fireEvent.click(trigger);

      const logoutItem = screen.getByRole("menuitem", { name: /log out/i });
      expect(logoutItem).toBeInTheDocument();
      fireEvent.click(logoutItem);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("Authenticated State - Merchant", () => {
    const merchantUser: UserResponse = {
      id: "merchant-001",
      created_at: "2026-09-01T00:00:00Z",
      email: "merchant@example.com",
      display_name: "Bob Seller",
      user_role: "merchant",
      address: null,
    };

    beforeEach(() => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: merchantUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("renders user dropdown trigger with merchant display name", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Bob Seller");
    });

    it("shows Seller Dashboard and Catalog links when menu is opened", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("merchant@example.com")).toBeInTheDocument();
      expect(screen.getByText("Merchant")).toBeInTheDocument();

      const dashboardLink = screen.getByRole("menuitem", {
        name: /seller dashboard/i,
      });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");

      const catalogMenuItem = screen.getByRole("menuitem", {
        name: /catalog/i,
      });
      expect(catalogMenuItem).toBeInTheDocument();
      expect(catalogMenuItem).toHaveAttribute("href", "/products");

      // Buyer and Logistics links should not be present
      expect(
        screen.queryByRole("menuitem", { name: /my orders/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: /logistics dashboard/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Authenticated State - Logistics", () => {
    const logisticsUser: UserResponse = {
      id: "logistics-001",
      created_at: "2026-09-01T00:00:00Z",
      email: "logistics@example.com",
      display_name: "Charlie Logistics",
      user_role: "logistics",
      address: null,
    };

    beforeEach(() => {
      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: logisticsUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("renders user dropdown trigger with logistics display name", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Charlie Logistics");
    });

    it("shows Logistics Dashboard link when menu is opened", () => {
      render(<Navbar />);

      const trigger = screen.getByRole("button", {
        name: /user (profile )?menu/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getByText("logistics@example.com")).toBeInTheDocument();
      expect(screen.getByText("Logistics")).toBeInTheDocument();

      const logisticsLink = screen.getByRole("menuitem", {
        name: /logistics dashboard/i,
      });
      expect(logisticsLink).toBeInTheDocument();
      expect(logisticsLink).toHaveAttribute("href", "/logistics");

      // Merchant and Buyer links should not be present
      expect(
        screen.queryByRole("menuitem", { name: /seller dashboard/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: /my orders/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Cart Badge Integration", () => {
    it("displays item count badge when cart data is populated", () => {
      mockCartData({
        id: 1,
        user_id: "user-123",
        items: [
          {
            id: 10,
            seller_product_id: "sp-10",
            product_id: "p-10",
            product_name: "Keyboard",
            product_brand: "TechCo",
            product_image_url: null,
            seller_id: "s-1",
            seller_name: "Seller 1",
            unit_price: 49.99,
            stock: 5,
            estimated_delivery_days: null,
            quantity: 3,
            subtotal: 149.97,
            created_at: "2026-09-01T00:00:00Z",
          },
        ],
        total_items: 3,
        total_price: 149.97,
      });

      render(<Navbar />);

      const cartLink = screen.getByRole("link", {
        name: "Shopping Cart with 3 items",
      });
      expect(cartLink).toBeInTheDocument();
      expect(cartLink).toHaveAttribute("href", "/cart");

      const badge = screen.getByTestId("cart-badge-count");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("3");
    });

    it("does not display count badge when cart is empty", () => {
      mockCartData({
        id: 1,
        user_id: "user-123",
        items: [],
        total_items: 0,
        total_price: 0,
      });

      render(<Navbar />);

      const cartLink = screen.getByRole("link", { name: "Shopping Cart" });
      expect(cartLink).toBeInTheDocument();
      expect(cartLink).toHaveAttribute("href", "/cart");
      expect(screen.queryByTestId("cart-badge-count")).not.toBeInTheDocument();
    });

    it("caps count display at 99+ when total_items exceeds 99", () => {
      mockCartData({
        id: 1,
        user_id: "user-123",
        items: [],
        total_items: 150,
        total_price: 1500,
      });

      render(<Navbar />);

      const badge = screen.getByTestId("cart-badge-count");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("99+");
    });
  });
});
