// Base API client for making HTTP requests to the backend

/**
 * Base URL for API requests
 * In a real application, this would be an environment variable
 */
const API_BASE_URL = "http://127.0.0.1:5000/api"

/**
 * Generic function to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

/**
 * Generic GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  })

  return handleResponse<T>(response)
}

/**
 * Generic POST request
 */
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify(data),
  })

  return handleResponse<T>(response)
}

/**
 * Generic PUT request
 */
export async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify(data),
  })

  return handleResponse<T>(response)
}

/**
 * Generic DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  })

  return handleResponse<T>(response)
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    credentials: "include", // Include cookies for authentication
    body: formData,
  })

  return handleResponse<T>(response)
}
