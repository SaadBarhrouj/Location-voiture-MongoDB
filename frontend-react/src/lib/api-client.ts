// Base API client for making HTTP requests to the backend

import { toast } from "sonner"

export const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api"

/**
 * Generic function to handle API requests
 */
async function apiClient<T>(
  endpoint: string,
  method: string,
  body?: any,
  customHeaders?: HeadersInit
): Promise<T> {
  const config: RequestInit = {
    method: method,
    credentials: 'include', // Pour les cookies de session
    headers: {
      ...customHeaders,
    },
  }

  // Si le corps n'est pas FormData, on assume JSON
  if (body && !(body instanceof FormData)) {
    config.body = JSON.stringify(body)
    if (!(config.headers && (config.headers as Record<string, string>)['Content-Type'])) {
       (config.headers as Record<string, string>)['Content-Type'] = 'application/json'
    }
  } else if (body instanceof FormData) {
    config.body = body
    // Ne PAS définir Content-Type ici, le navigateur le fera pour FormData
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (response.status === 204) {
    return Promise.resolve(null as T)
  }

  const data = await response.json()

  if (!response.ok) {
    console.error("API Error:", data)
    const message = data.message || `An error occurred: ${response.statusText}`
    toast.error(message)
    return Promise.reject(new Error(message))
  }

  return data as T
}

/**
 * Generic GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, "GET")
}

/**
 * Generic POST request
 */
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  return apiClient<T>(endpoint, "POST", data)
}

/**
 * Generic PUT request
 */
export async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  return apiClient<T>(endpoint, "PUT", data)
}

/**
 * Generic DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, "DELETE")
}

/**
 * Upload file with multipart/form-data
 */
export async function apiUploadFile<T>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>,
): Promise<T> {
  const formData = new FormData()
  formData.append("file", file)

  // Add any additional data to the form
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value)
    })
  }

  return apiClient<T>(endpoint, "POST", formData)
}
