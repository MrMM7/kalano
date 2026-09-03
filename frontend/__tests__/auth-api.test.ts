import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { signupSchema } from "@/lib/validators/auth";
import { registerUser } from "@/lib/api/auth";

describe("Auth Validation & API Client", () => {
  describe("signupSchema", () => {
    it("validates valid buyer registration payload successfully", () => {
      const valid = {
        display_name: "Alice Smith",
        email: "alice@example.com",
        password: "password123",
        confirm_password: "password123",
        user_role: "buyer",
      };
      const result = signupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("validates valid merchant registration payload successfully", () => {
      const valid = {
        display_name: "Bob Seller",
        email: "bob@example.com",
        password: "password123",
        confirm_password: "password123",
        user_role: "merchant",
      };
      const result = signupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails when display_name is empty", () => {
      const invalid = {
        display_name: "   ",
        email: "alice@example.com",
        password: "password123",
        confirm_password: "password123",
        user_role: "buyer",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Display name is required");
      }
    });

    it("fails when email is invalid", () => {
      const invalid = {
        display_name: "Alice Smith",
        email: "not-an-email",
        password: "password123",
        confirm_password: "password123",
        user_role: "buyer",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("fails when password is less than 8 characters", () => {
      const invalid = {
        display_name: "Alice Smith",
        email: "alice@example.com",
        password: "short",
        confirm_password: "short",
        user_role: "buyer",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 8 characters"
        );
      }
    });

    it("fails when confirm_password does not match password", () => {
      const invalid = {
        display_name: "Alice Smith",
        email: "alice@example.com",
        password: "password123",
        confirm_password: "password456",
        user_role: "buyer",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchIssue = result.error.issues.find((issue) =>
          issue.path.includes("confirm_password")
        );
        expect(mismatchIssue?.message).toBe("Passwords do not match");
      }
    });

    it("fails when user_role is missing or invalid", () => {
      const invalid = {
        display_name: "Alice Smith",
        email: "alice@example.com",
        password: "password123",
        confirm_password: "password123",
        user_role: "invalid-role",
      };
      const result = signupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("registerUser API client", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns parsed user response on 201 Created", async () => {
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2026-09-04T00:00:00Z",
        email: "test@example.com",
        display_name: "Test User",
        user_role: "buyer",
        address: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const res = await registerUser({
        email: "test@example.com",
        password: "password123",
        display_name: "Test User",
        user_role: "buyer",
      });

      expect(res).toEqual(mockUser);
    });

    it("throws ApiError envelope when server returns 409 Conflict", async () => {
      const errorEnvelope = {
        error: {
          code: "DUPLICATE_EMAIL",
          message: "A user with this email address already exists.",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => errorEnvelope,
      } as Response);

      await expect(
        registerUser({
          email: "duplicate@example.com",
          password: "password123",
          display_name: "Duplicate User",
          user_role: "buyer",
        })
      ).rejects.toEqual(errorEnvelope);
    });

    it("throws UNKNOWN_ERROR fallback when response cannot be parsed as JSON", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Response);

      await expect(
        registerUser({
          email: "test@example.com",
          password: "password123",
          display_name: "Test User",
          user_role: "buyer",
        })
      ).rejects.toEqual({
        error: {
          code: "UNKNOWN_ERROR",
          message: "Request failed with status code 500",
        },
      });
    });
  });
});
