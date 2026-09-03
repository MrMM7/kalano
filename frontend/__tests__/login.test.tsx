import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/app/login/page";
import * as authApi from "@/lib/api/auth";
import { AuthContext } from "@/lib/auth-context";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

function renderWithClient(
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

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders email input, password input, submit button, and signup link", () => {
    renderWithClient(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /sign in to kalano/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("submitting empty form displays validation errors without calling loginUser", async () => {
    const loginSpy = vi.spyOn(authApi, "loginUser");
    renderWithClient(<LoginPage />);

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("entering an invalid email displays 'Invalid email address'", async () => {
    const loginSpy = vi.spyOn(authApi, "loginUser");
    renderWithClient(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("entering valid credentials calls loginUser, refreshes user, and redirects to /", async () => {
    const mockResponse = {
      access_token: "fake-jwt-token",
      token_type: "bearer",
      user: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2026-09-04T00:00:00Z",
        email: "user@example.com",
        display_name: "Test User",
        user_role: "buyer",
        address: null,
      },
    };

    const loginSpy = vi
      .spyOn(authApi, "loginUser")
      .mockResolvedValue(mockResponse);
    const refreshUserSpy = vi.fn().mockResolvedValue(undefined);

    renderWithClient(<LoginPage />, { refreshUser: refreshUserSpy });

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
      expect(refreshUserSpy).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("redirects to target path specified in redirect query parameter", async () => {
    mockSearchParams = new URLSearchParams({ redirect: "/dashboard" });

    const mockResponse = {
      access_token: "fake-jwt-token",
      token_type: "bearer",
      user: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2026-09-04T00:00:00Z",
        email: "user@example.com",
        display_name: "Test User",
        user_role: "buyer",
        address: null,
      },
    };

    vi.spyOn(authApi, "loginUser").mockResolvedValue(mockResponse);
    const refreshUserSpy = vi.fn().mockResolvedValue(undefined);

    renderWithClient(<LoginPage />, { refreshUser: refreshUserSpy });

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(refreshUserSpy).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays inline API error alert when login fails", async () => {
    vi.spyOn(authApi, "loginUser").mockRejectedValue({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });

    renderWithClient(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "wrongpassword" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Invalid email or password");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
