import { apiDelete, apiGet, apiPost, apiPut } from "../api-client"

export interface Car {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  vin: string
  color?: string
  status: "available" | "rented" | "maintenance" | "out_of_service"
  dailyRate: number
  description?: string
  imageUrl?: string
  addedAt?: string
  addedBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface CarCreateInput {
  make: string
  model: string
  year: number
  licensePlate: string
  vin: string
  color?: string
  status: "available" | "rented" | "maintenance" | "out_of_service"
  dailyRate: number
  description?: string
  imageFile?: File | null
}

export interface CarUpdateInput extends Partial<Omit<CarCreateInput, 'imageFile'>> {
  id: string
  imageFile?: File | null
  imageUrl?: string | null
}

// Get all cars
export async function getCars(): Promise<Car[]> {
  return apiGet<Car[]>("/cars")
}

// Get a single car by ID
export async function getCar(id: string): Promise<Car> {
  return apiGet<Car>(`/cars/${id}`)
}

// Create a new car - Modifié pour utiliser FormData
export async function createCar(formData: FormData): Promise<Car> {
  return apiPost<Car>("/cars", formData)
}

// Update an existing car - Modifié pour utiliser FormData
export async function updateCar(id: string, formData: FormData): Promise<Car> {
  return apiPut<Car>(`/cars/${id}`, formData)
}

// Delete a car
export async function deleteCar(id: string): Promise<void> {
  return apiDelete<void>(`/cars/${id}`)
}