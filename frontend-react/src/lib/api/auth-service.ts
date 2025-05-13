import { apiPost } from "../api-client"

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    username: string
    role: "admin" | "manager"
    fullName: string
  }
  token?: string // If using JWT
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", credentials)
}

export async function logout(): Promise<void> {
  return apiPost<void>("/auth/logout", {})
}

// For demo purposes, we'll simulate the API calls
export async function simulateLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock authentication logic
  if (credentials.username === "admin" && credentials.password === "admin123") {
    return {
      user: {
        id: "admin-id",
        username: "admin",
        role: "admin",
        fullName: "System Administrator",
      },
    }
  } else if (credentials.username === "manager" && credentials.password === "manager123") {
    return {
      user: {
        id: "manager-id",
        username: "manager",
        role: "manager",
        fullName: "Car Manager",
      },
    }
  }

  throw new Error("Invalid username or password")
}
