import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Navbar } from "@/components/layout/navbar";
import { NavSearch } from "@/components/layout/nav-search";
import { CartBadge } from "@/components/layout/cart-badge";
import { UserNav } from "@/components/layout/user-nav";
import LoginPage from "@/app/login/page";
import SignupPage from "@/app/signup/page";
import { RoleSelector } from "@/components/role-selector";
import { ShippingAddressForm } from "@/components/checkout/shipping-address-form";
import { SellerOffersTable } from "@/components/seller-offers-table";
import { LogisticsTable } from "@/components/logistics/logistics-table";
import { CartItemRow } from "@/components/cart/cart-item-row";

import * as useAuthModule from "@/lib/hooks/use-auth";
import * as useCartModule from "@/lib/hooks/use-cart";
import { AuthContext } from "@/lib/auth-context";
import type { UserResponse } from "@/types/auth";
import type { CartItem, CartResponse } from "@/types/cart";
import type { SellerOffer } from "@/types/product";
import type { LogisticsOrderItem } from "@/types/logistics";

// --- Navigation Mocks ---
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

// --- Sonner Toast Mock ---
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// --- Test Helper: QueryClient & AuthContext Wrapper ---
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

// --- Helper: Mock Cart Hook ---
function mockCartHook(data?: Partial<CartResponse>) {
  vi.spyOn(useCartModule, "useCart").mockReturnValue({
    data: data as CartResponse | undefined,
  } as unknown as ReturnType<typeof useCartModule.useCart>);
}

describe("Accessibility Test Suite (Spec 003)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockSearchParams = new URLSearchParams();

    // Default: unauthenticated user
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    // Default: empty cart
    mockCartHook({
      id: 1,
      user_id: "guest",
      items: [],
      total_items: 0,
      total_price: 0,
    });
  });

  /* =========================================================================
   * 1. Navigation ARIA & Landmark Roles
   * ========================================================================= */
  describe("1. Navigation ARIA & Landmark Roles", () => {
    it("Navbar contains a <nav> landmark with aria-label='Main Navigation'", () => {
      renderWithProviders(<Navbar />);

      const navLandmark = screen.getByRole("navigation", {
        name: "Main Navigation",
      });
      expect(navLandmark).toBeInTheDocument();
      expect(navLandmark.tagName.toLowerCase()).toBe("nav");
      expect(navLandmark).toHaveAttribute("aria-label", "Main Navigation");
    });

    it("NavSearch has role='search' and input has aria-label='Search products'", () => {
      renderWithProviders(<NavSearch />);

      const searchForm = screen.getByRole("search");
      expect(searchForm).toBeInTheDocument();

      const searchInput = screen.getByLabelText("Search products");
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute("aria-label", "Search products");
      expect(searchInput).toHaveAttribute("type", "search");

      // Verify submit button has non-empty descriptive label
      const submitBtn = screen.getByRole("button", { name: "Submit search" });
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toHaveAttribute("aria-label", "Submit search");
    });

    it("CartBadge provides dynamic aria-label announcing total items", () => {
      // 1. Populated cart with 3 items
      mockCartHook({
        id: 1,
        user_id: "buyer-1",
        total_items: 3,
        total_price: 99.99,
        items: [
          {
            id: 1,
            seller_product_id: "sp-1",
            product_id: "p-1",
            product_name: "Keyboard",
            product_brand: "KeyCo",
            product_image_url: null,
            seller_id: "s-1",
            seller_name: "Seller 1",
            unit_price: 33.33,
            stock: 5,
            estimated_delivery_days: null,
            quantity: 3,
            subtotal: 99.99,
            created_at: "2026-09-01T00:00:00Z",
          },
        ],
      });

      const { unmount } = renderWithProviders(<CartBadge />);
      const linkWithItems = screen.getByRole("link", {
        name: "Shopping Cart with 3 items",
      });
      expect(linkWithItems).toBeInTheDocument();
      expect(linkWithItems).toHaveAttribute(
        "aria-label",
        "Shopping Cart with 3 items"
      );
      expect(screen.getByTestId("cart-badge-count")).toHaveTextContent("3");
      unmount();

      // 2. Empty cart announces 'Shopping Cart'
      mockCartHook({
        id: 1,
        user_id: "buyer-1",
        total_items: 0,
        total_price: 0,
        items: [],
      });

      renderWithProviders(<CartBadge />);
      const emptyLink = screen.getByRole("link", { name: "Shopping Cart" });
      expect(emptyLink).toBeInTheDocument();
      expect(emptyLink).toHaveAttribute("aria-label", "Shopping Cart");
      expect(screen.queryByTestId("cart-badge-count")).not.toBeInTheDocument();
    });

    it("UserNav trigger has aria-label='User profile menu', aria-haspopup='menu', and aria-expanded state", () => {
      const mockBuyer: UserResponse = {
        id: "buyer-001",
        created_at: "2026-09-01T00:00:00Z",
        email: "alice@example.com",
        display_name: "Alice Walker",
        user_role: "buyer",
        address: "123 Main St",
      };

      vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
        user: mockBuyer,
        isLoading: false,
        isAuthenticated: true,
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      renderWithProviders(<UserNav />);

      const trigger = screen.getByRole("button", {
        name: "User profile menu",
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-label", "User profile menu");
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Clicking the trigger expands the menu and sets aria-expanded="true"
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();

      // Menu items have role="menuitem"
      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBeGreaterThanOrEqual(2);

      // Pressing Escape closes the menu and restores aria-expanded="false"
      fireEvent.keyDown(document, { key: "Escape" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 2. Form Label & Control Association
   * ========================================================================= */
  describe("2. Form Label & Control Association", () => {
    it("LoginForm: email and password inputs have matching labels and aria-describedby linkage for errors", async () => {
      renderWithProviders(<LoginPage />);

      // Verify email input & label association
      const emailInput = screen.getByLabelText(/^email$/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("id", "email");

      const emailLabel = document.querySelector('label[for="email"]');
      expect(emailLabel).toBeInTheDocument();
      expect(emailLabel).toHaveTextContent(/email/i);

      // Verify password input & label association
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("id", "password");

      const passwordLabel = document.querySelector('label[for="password"]');
      expect(passwordLabel).toBeInTheDocument();
      expect(passwordLabel).toHaveTextContent(/password/i);

      // Submitting empty form triggers validation errors
      const submitBtn = screen.getByRole("button", { name: /sign in/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
        const emailError = document.getElementById("email-error");
        expect(emailError).toBeInTheDocument();
        expect(emailError).toHaveAttribute("role", "alert");

        expect(passwordInput).toHaveAttribute("aria-invalid", "true");
        expect(passwordInput).toHaveAttribute(
          "aria-describedby",
          "password-error"
        );
        const passwordError = document.getElementById("password-error");
        expect(passwordError).toBeInTheDocument();
        expect(passwordError).toHaveAttribute("role", "alert");
      });
    });

    it("SignupPage: all four input fields are associated with <label htmlFor='...'> and id", async () => {
      renderWithProviders(<SignupPage />);

      const fields = [
        { labelRegex: /display name/i, expectedId: "display_name" },
        { labelRegex: /^email$/i, expectedId: "email" },
        { labelRegex: /^password$/i, expectedId: "password" },
        { labelRegex: /confirm password/i, expectedId: "confirm_password" },
      ];

      for (const field of fields) {
        const input = screen.getByLabelText(field.labelRegex);
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("id", field.expectedId);

        const label = document.querySelector(
          `label[for="${field.expectedId}"]`
        );
        expect(label).toBeInTheDocument();
      }

      // Submitting empty form links aria-describedby and aria-invalid on fields
      const submitBtn = screen.getByRole("button", {
        name: /create account/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const displayNameInput = screen.getByLabelText(/display name/i);
        expect(displayNameInput).toHaveAttribute("aria-invalid", "true");
        expect(displayNameInput).toHaveAttribute(
          "aria-describedby",
          "display_name-error"
        );

        const emailInput = screen.getByLabelText(/^email$/i);
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(emailInput).toHaveAttribute("aria-describedby", "email-error");

        const passwordInput = screen.getByLabelText(/^password$/i);
        expect(passwordInput).toHaveAttribute("aria-invalid", "true");
        expect(passwordInput).toHaveAttribute(
          "aria-describedby",
          "password-error"
        );
      });
    });

    it("RoleSelector: wrapped in <fieldset> with <legend> and roles with role='radio'", () => {
      const handleSelect = vi.fn();
      const { container } = renderWithProviders(
        <RoleSelector selectedRole={null} onRoleSelect={handleSelect} />
      );

      // Verify fieldset and legend wrapping
      const fieldset = container.querySelector("fieldset");
      expect(fieldset).toBeInTheDocument();

      const legend = fieldset?.querySelector("legend");
      expect(legend).toBeInTheDocument();
      expect(legend).toHaveTextContent("Account Type");

      // Verify radiogroup
      const radiogroup = screen.getByRole("radiogroup", {
        name: "Select account type",
      });
      expect(radiogroup).toBeInTheDocument();

      // Verify radio options
      const merchantRadio = screen.getByRole("radio", { name: /merchant/i });
      const buyerRadio = screen.getByRole("radio", { name: /buyer/i });

      expect(merchantRadio).toBeInTheDocument();
      expect(merchantRadio).toHaveAttribute("aria-checked", "false");
      expect(buyerRadio).toBeInTheDocument();
      expect(buyerRadio).toHaveAttribute("aria-checked", "false");

      // Keyboard activation via Enter key
      fireEvent.keyDown(merchantRadio, { key: "Enter" });
      expect(handleSelect).toHaveBeenCalledWith("merchant");

      // Keyboard activation via Space key
      fireEvent.keyDown(buyerRadio, { key: " " });
      expect(handleSelect).toHaveBeenCalledWith("buyer");
    });

    it("ShippingAddressForm: textarea and checkbox are properly associated with <label htmlFor='...'> and id", () => {
      const onAddressChange = vi.fn();
      const onSaveAddressChange = vi.fn();

      renderWithProviders(
        <ShippingAddressForm
          address=""
          onAddressChange={onAddressChange}
          saveAddress={true}
          onSaveAddressChange={onSaveAddressChange}
          error="Please enter a valid address"
        />
      );

      // Textarea label association
      const textarea = screen.getByLabelText(/delivery address/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("id", "shipping-address");
      expect(textarea).toHaveAttribute("aria-invalid", "true");
      expect(textarea).toHaveAttribute("aria-describedby", "address-error");

      const textareaLabel = document.querySelector(
        'label[for="shipping-address"]'
      );
      expect(textareaLabel).toBeInTheDocument();

      // Checkbox label association
      const checkbox = screen.getByLabelText(/save this shipping address/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("id", "save-address");

      const checkboxLabel = document.querySelector('label[for="save-address"]');
      expect(checkboxLabel).toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 3. Data Table Semantics
   * ========================================================================= */
  describe("3. Data Table Semantics", () => {
    const mockSellerOffers: SellerOffer[] = [
      {
        seller_product_id: "sp-101",
        seller_id: "seller-1",
        seller_name: "Apex Electronics",
        price: 199.99,
        stock: 12,
        estimated_delivery_days: 2,
      },
      {
        seller_product_id: "sp-102",
        seller_id: "seller-2",
        seller_name: "Prime Superstore",
        price: 219.0,
        stock: 5,
        estimated_delivery_days: null,
      },
    ];

    it("SellerOffersTable: contains <table>, <thead>, and all header cells have scope='col'", () => {
      const onSelect = vi.fn();
      renderWithProviders(
        <SellerOffersTable
          offers={mockSellerOffers}
          selectedOfferId="sp-101"
          onSelectOffer={onSelect}
        />
      );

      const table = screen.getByRole("table", {
        name: "Seller offers comparison table",
      });
      expect(table).toBeInTheDocument();

      const thead = table.querySelector("thead");
      expect(thead).toBeInTheDocument();

      const thElements = screen.getAllByRole("columnheader");
      expect(thElements.length).toBe(5);
      thElements.forEach((th) => {
        expect(th).toHaveAttribute("scope", "col");
      });

      // Select Offer buttons have descriptive aria-label with merchant name and price
      const selectOfferButton = screen.getByRole("button", {
        name: "Select offer from Prime Superstore for $219.00",
      });
      expect(selectOfferButton).toBeInTheDocument();
      expect(selectOfferButton).toHaveAttribute(
        "aria-label",
        "Select offer from Prime Superstore for $219.00"
      );
    });

    it("LogisticsTable: table headers have scope='col', actions column is labeled, and action buttons have descriptive aria-labels", () => {
      const mockLogisticsOrders: LogisticsOrderItem[] = [
        {
          id: 201,
          product_id: "prod-1",
          product_name: "Ergonomic Chair",
          product_brand: "ComfortPlus",
          product_image_url: null,
          seller_id: "s-1",
          seller_name: "FurnitureHub",
          buyer_id: "b-1",
          buyer_name: "John Doe",
          address: "456 Oak Avenue",
          bought_price: 250.0,
          quantity: 1,
          subtotal: 250.0,
          delivery_types: "pending",
          created_at: "2026-09-06T10:00:00Z",
        },
        {
          id: 202,
          product_id: "prod-2",
          product_name: "Standing Desk",
          product_brand: "DeskPro",
          product_image_url: null,
          seller_id: "s-2",
          seller_name: "WorkstationCo",
          buyer_id: "b-2",
          buyer_name: "Jane Smith",
          address: "789 Pine Road",
          bought_price: 450.0,
          quantity: 1,
          subtotal: 450.0,
          delivery_types: "confirmed",
          created_at: "2026-09-05T12:00:00Z",
        },
        {
          id: 203,
          product_id: "prod-3",
          product_name: "LED Desk Lamp",
          product_brand: "Lumina",
          product_image_url: null,
          seller_id: "s-1",
          seller_name: "FurnitureHub",
          buyer_id: "b-3",
          buyer_name: "Bob Miller",
          address: "101 Elm Street",
          bought_price: 35.0,
          quantity: 2,
          subtotal: 70.0,
          delivery_types: "shipped",
          created_at: "2026-09-04T08:00:00Z",
        },
        {
          id: 204,
          product_id: "prod-4",
          product_name: "Cable Organizer",
          product_brand: "TidyDesk",
          product_image_url: null,
          seller_id: "s-2",
          seller_name: "WorkstationCo",
          buyer_id: "b-4",
          buyer_name: "Sara Connor",
          address: "202 Maple Blvd",
          bought_price: 15.0,
          quantity: 1,
          subtotal: 15.0,
          delivery_types: "delivered",
          created_at: "2026-09-03T15:00:00Z",
        },
      ];

      renderWithProviders(
        <LogisticsTable
          orders={mockLogisticsOrders}
          onStatusUpdate={vi.fn()}
          onRequestCancel={vi.fn()}
          onRequestReturn={vi.fn()}
        />
      );

      const table = screen.getByRole("table", {
        name: "Logistics orders table",
      });
      expect(table).toBeInTheDocument();

      // Verify all headers have scope="col"
      const thElements = screen.getAllByRole("columnheader");
      expect(thElements.length).toBe(7);
      thElements.forEach((th) => {
        expect(th).toHaveAttribute("scope", "col");
      });

      // Actions column header has accessible label
      const actionsTh = thElements[thElements.length - 1];
      expect(actionsTh).toHaveAttribute("aria-label", "Actions");

      // Verify descriptive aria-labels on action buttons for each state:
      // 1. Pending: Confirm Pickup & Cancel
      expect(
        screen.getByRole("button", {
          name: "Confirm pickup for order #201",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel order #201" })
      ).toBeInTheDocument();

      // 2. Confirmed: Mark Shipped & Cancel
      expect(
        screen.getByRole("button", { name: "Mark order #202 shipped" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel order #202" })
      ).toBeInTheDocument();

      // 3. Shipped: End Delivery & Cancel
      expect(
        screen.getByRole("button", { name: "End delivery for order #203" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel order #203" })
      ).toBeInTheDocument();

      // 4. Delivered: Process Return
      expect(
        screen.getByRole("button", { name: "Process return for order #204" })
      ).toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 4. Cart Controls
   * ========================================================================= */
  describe("4. Cart Controls", () => {
    const mockItem: CartItem = {
      id: 55,
      seller_product_id: "sp-55",
      product_id: "prod-55",
      product_name: "Noise-Cancelling Headphones",
      product_brand: "AudioCraft",
      product_image_url: null,
      seller_id: "seller-1",
      seller_name: "Craft Audio Official",
      unit_price: 149.99,
      stock: 5,
      estimated_delivery_days: 2,
      quantity: 2,
      subtotal: 299.98,
      created_at: "2026-09-06T10:00:00Z",
    };

    it("CartItemRow: quantity decrement, increment, and remove buttons have descriptive aria-labels mentioning the product", () => {
      const onUpdateQuantity = vi.fn();
      const onRemove = vi.fn();

      renderWithProviders(
        <CartItemRow
          item={mockItem}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          isUpdating={false}
          isRemoving={false}
        />
      );

      // Decrement button
      const decrementBtn = screen.getByRole("button", {
        name: "Decrease quantity of Noise-Cancelling Headphones",
      });
      expect(decrementBtn).toBeInTheDocument();
      expect(decrementBtn).toHaveAttribute(
        "aria-label",
        "Decrease quantity of Noise-Cancelling Headphones"
      );

      // Increment button
      const incrementBtn = screen.getByRole("button", {
        name: "Increase quantity of Noise-Cancelling Headphones",
      });
      expect(incrementBtn).toBeInTheDocument();
      expect(incrementBtn).toHaveAttribute(
        "aria-label",
        "Increase quantity of Noise-Cancelling Headphones"
      );

      // Remove button
      const removeBtn = screen.getByRole("button", {
        name: "Remove Noise-Cancelling Headphones from cart",
      });
      expect(removeBtn).toBeInTheDocument();
      expect(removeBtn).toHaveAttribute(
        "aria-label",
        "Remove Noise-Cancelling Headphones from cart"
      );

      // Test click interactions
      fireEvent.click(decrementBtn);
      expect(onUpdateQuantity).toHaveBeenCalledWith(1);

      fireEvent.click(incrementBtn);
      expect(onUpdateQuantity).toHaveBeenCalledWith(3);

      fireEvent.click(removeBtn);
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("CartItemRow: decrement button is disabled at minimum quantity (1) and increment is disabled at max stock", () => {
      const { rerender } = renderWithProviders(
        <CartItemRow
          item={{ ...mockItem, quantity: 1 }}
          onUpdateQuantity={vi.fn()}
          onRemove={vi.fn()}
          isUpdating={false}
          isRemoving={false}
        />
      );

      const decrementBtn = screen.getByRole("button", {
        name: "Decrease quantity of Noise-Cancelling Headphones",
      });
      expect(decrementBtn).toBeDisabled();

      // At max stock
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <CartItemRow
            item={{ ...mockItem, quantity: 5, stock: 5 }}
            onUpdateQuantity={vi.fn()}
            onRemove={vi.fn()}
            isUpdating={false}
            isRemoving={false}
          />
        </QueryClientProvider>
      );

      const incrementBtn = screen.getByRole("button", {
        name: "Increase quantity of Noise-Cancelling Headphones",
      });
      expect(incrementBtn).toBeDisabled();
    });
  });
});
