import { apiDelete, apiGet, apiPost, apiPut, apiUploadFile } from "../api-client"

export interface Car {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  status: "available" | "rented" | "maintenance"
  dailyRate: number
  description?: string
  imageUrl?: string
  added_by?: string
  added_at?: string
}

export interface CarCreateInput {
  make: string
  model: string
  year: number
  licensePlate: string
  status: "available" | "rented" | "maintenance"
  dailyRate: number
  description?: string
}

export interface CarUpdateInput extends Partial<CarCreateInput> {
  id: string
}

// Get all cars
export async function getCars(): Promise<Car[]> {
  return apiGet<Car[]>("/cars")
}

// Get a single car by ID
export async function getCar(id: string): Promise<Car> {
  return apiGet<Car>(`/cars/${id}`)
}

// Create a new car
export async function createCar(car: CarCreateInput): Promise<Car> {
  return apiPost<Car>("/cars", car)
}

// Update an existing car
export async function updateCar(car: CarUpdateInput): Promise<Car> {
  return apiPut<Car>(`/cars/${car.id}`, car)
}

// Delete a car
export async function deleteCar(id: string): Promise<void> {
  return apiDelete<void>(`/cars/${id}`)
}

// Upload car image
export async function uploadCarImage(carId: string, file: File): Promise<{ imageUrl: string }> {
  return apiUploadFile<{ imageUrl: string }>(`/cars/${carId}/image`, file)
}

// For demo purposes, we'll simulate the API calls with mock data
const initialCars: Car[] = [
  {
    id: "1",
    make: "Toyota",
    model: "Yaris",
    year: 2023,
    licensePlate: "WW-123-AB",
    status: "available",
    dailyRate: 250.0,
    description: "Compact car, fuel efficient",
    imageUrl: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "2",
    make: "Renault",
    model: "Clio",
    year: 2022,
    licensePlate: "WW-456-CD",
    status: "rented",
    dailyRate: 220.0,
    description: "Small hatchback, perfect for city driving",
    imageUrl: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "3",
    make: "Dacia",
    model: "Logan",
    year: 2021,
    licensePlate: "WW-789-EF",
    status: "available",
    dailyRate: 180.0,
    description: "Affordable sedan with spacious trunk",
    imageUrl: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "4",
    make: "Volkswagen",
    model: "Golf",
    year: 2023,
    licensePlate: "WW-012-GH",
    status: "maintenance",
    dailyRate: 300.0,
    description: "Compact hatchback with premium features",
    imageUrl: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "5",
    make: "Hyundai",
    model: "Tucson",
    year: 2022,
    licensePlate: "WW-345-IJ",
    status: "available",
    dailyRate: 350.0,
    description: "Compact SUV with good fuel economy",
    imageUrl: "/placeholder.svg?height=200&width=300",
  },
]

// Mock implementation
let mockCars = [...initialCars]

export async function simulateGetCars(): Promise<Car[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockCars]
}

export async function simulateGetCar(id: string): Promise<Car> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const car = mockCars.find((c) => c.id === id)
  if (!car) throw new Error("Car not found")
  return { ...car }
}

export async function simulateCreateCar(car: CarCreateInput): Promise<Car> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const newCar: Car = {
    id: Date.now().toString(),
    ...car,
    imageUrl: "/placeholder.svg?height=200&width=300",
  }
  mockCars.push(newCar)
  return { ...newCar }
}

export async function simulateUpdateCar(car: CarUpdateInput): Promise<Car> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockCars.findIndex((c) => c.id === car.id)
  if (index === -1) throw new Error("Car not found")

  mockCars[index] = { ...mockCars[index], ...car }
  return { ...mockCars[index] }
}

export async function simulateDeleteCar(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  mockCars = mockCars.filter((c) => c.id !== id)
}

export async function simulateUploadCarImage(carId: string, file: File): Promise<{ imageUrl: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // In a real implementation, this would upload the file to a server
  // and return the URL of the uploaded image

  // For demo purposes, we'll just return a placeholder URL
  const imageUrl = URL.createObjectURL(file)

  // Update the car with the new image URL
  const index = mockCars.findIndex((c) => c.id === carId)
  if (index !== -1) {
    mockCars[index] = { ...mockCars[index], imageUrl }
  }

  return { imageUrl }
}
