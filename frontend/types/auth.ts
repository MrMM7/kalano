export type UserRole = "buyer" | "merchant" | "logistics";

export interface UserRegisterPayload {
  email: string;
  password: string;
  display_name: string;
  user_role: "buyer" | "merchant";
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  created_at: string;
  email: string;
  display_name: string;
  user_role: string;
  address: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
