import {
  ApiError,
  LoginResponse,
  LogoutResponse,
  UserLoginPayload,
  UserRegisterPayload,
  UserResponse,
} from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function registerUser(
  data: UserRegisterPayload
): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      throw {
        error: {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status code ${res.status}`,
        },
      } as ApiError;
    }
    throw errorBody;
  }

  return res.json();
}

export async function loginUser(
  data: UserLoginPayload
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // CRITICAL: instructs browser to include and store httpOnly cookies
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await res.json();
    } catch {
      throw {
        error: {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      } as ApiError;
    }
    throw errorBody;
  }

  return res.json();
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
}

export async function logoutUser(): Promise<LogoutResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    return { message: "Logged out" };
  }

  return res.json();
}
