import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SignupPage from "@/app/signup/page";
import * as authApi from "@/lib/api/auth";
import { toast } from "sonner";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("SignupPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form elements including role selector, inputs, and links", () => {
    renderWithClient(<SignupPage />);

    expect(
      screen.getByRole("heading", { name: /create an account/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Merchant")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("highlights role panel when clicked", () => {
    renderWithClient(<SignupPage />);

    const buyerRadio = screen.getByRole("radio", { name: /buyer/i });
    fireEvent.click(buyerRadio);

    expect(buyerRadio).toHaveAttribute("aria-checked", "true");
  });

  it("displays validation errors when submitting empty form", async () => {
    const registerSpy = vi.spyOn(authApi, "registerUser");
    renderWithClient(<SignupPage />);

    const submitBtn = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please select a role/i)).toBeInTheDocument();
      expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("displays error when passwords do not match", async () => {
    const registerSpy = vi.spyOn(authApi, "registerUser");
    renderWithClient(<SignupPage />);

    fireEvent.click(screen.getByRole("radio", { name: /buyer/i }));
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "mismatchpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("submits valid form successfully, displays toast, and redirects to /login", async () => {
    const registerSpy = vi.spyOn(authApi, "registerUser").mockResolvedValue({
      id: "uuid-123",
      created_at: "2026-09-04T00:00:00Z",
      email: "jane@example.com",
      display_name: "Jane Doe",
      user_role: "buyer",
      address: null,
    });

    renderWithClient(<SignupPage />);

    fireEvent.click(screen.getByRole("radio", { name: /buyer/i }));
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        display_name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        user_role: "buyer",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully!"
      );
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("displays inline API error banner when registration fails", async () => {
    vi.spyOn(authApi, "registerUser").mockRejectedValue({
      error: {
        code: "DUPLICATE_EMAIL",
        message: "A user with this email address already exists.",
      },
    });

    renderWithClient(<SignupPage />);

    fireEvent.click(screen.getByRole("radio", { name: /merchant/i }));
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Merchant User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "duplicate@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText("A user with this email address already exists.")
      ).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
