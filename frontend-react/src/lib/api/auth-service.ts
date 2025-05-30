import { apiGet, apiPost } from "../api-client";

export interface LoginCredentials {
  username: string;
  password: string;
}

// L'interface User correspond à la structure de l'utilisateur retournée par le backend
export interface User {
  id: string;
  username: string;
  role: "admin" | "manager";
  fullName: string;
  isActive?: boolean; // Le backend retourne isActive
}

export interface LoginResponse {
  user: User;
}

export interface AuthStatusResponse {
  user: User | null;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", credentials);
}

export async function logout(): Promise<void> {
  try {
    await apiPost<void>("/auth/logout", {});
  } catch (error) {
    console.warn("Backend logout failed, proceeding with frontend logout:", error);
    throw error;
  }
}

export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const response = await apiGet<AuthStatusResponse>("/auth/status");
    return response;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return { user: null };
  }
}
