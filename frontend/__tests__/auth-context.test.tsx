import "@testing-library/jest-dom/vitest";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/lib/auth-context";
import { useAuth } from "@/lib/hooks/use-auth";
import * as authApi from "@/lib/api/auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("AuthContext and useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when useAuth is called outside AuthProvider", () => {
    // Suppress expected React console.error for boundary throw
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("hydrates user profile on mount when fetchCurrentUser succeeds", async () => {
    const mockUser = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      created_at: "2026-09-04T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Jane Buyer",
      user_role: "buyer",
      address: null,
    };

    vi.spyOn(authApi, "fetchCurrentUser").mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("sets user to null and isLoading to false when fetchCurrentUser fails", async () => {
    vi.spyOn(authApi, "fetchCurrentUser").mockRejectedValue(
      new Error("Not authenticated")
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("logout calls logoutUser API, resets user state, and pushes to '/'", async () => {
    const mockUser = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      created_at: "2026-09-04T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Jane Buyer",
      user_role: "buyer",
      address: null,
    };

    vi.spyOn(authApi, "fetchCurrentUser").mockResolvedValue(mockUser);
    const logoutSpy = vi
      .spyOn(authApi, "logoutUser")
      .mockResolvedValue({ message: "Logged out successfully" });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutSpy).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("refreshUser manually re-fetches user profile", async () => {
    const userV1 = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      created_at: "2026-09-04T00:00:00Z",
      email: "buyer@example.com",
      display_name: "Jane Buyer",
      user_role: "buyer",
      address: null,
    };

    const userV2 = {
      ...userV1,
      display_name: "Jane Updated",
    };

    const fetchSpy = vi
      .spyOn(authApi, "fetchCurrentUser")
      .mockResolvedValueOnce(userV1)
      .mockResolvedValueOnce(userV2);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.display_name).toBe("Jane Buyer");
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.current.user?.display_name).toBe("Jane Updated");
  });
});
