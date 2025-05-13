import { apiDelete, apiGet, apiPost, apiPut } from "../api-client"

export interface Reservation {
  id: string
  carId: string
  carDetails: {
    make: string
    model: string
    licensePlate: string
    imageUrl?: string
  }
  clientId: string
  clientDetails: {
    firstName: string
    lastName: string
    email: string
  }
  startDate: string
  endDate: string
  totalCost: number
  status: "pending" | "accepted" | "refused" | "active" | "completed" | "cancelled"
  reservationDate: string
  decisionDate: string | null
  notes: string
}

export interface ReservationCreateInput {
  carId: string
  clientId: string
  startDate: string
  endDate: string
  totalCost: number
  status: "pending" | "accepted" | "refused" | "active" | "completed" | "cancelled"
  notes?: string
}

export interface ReservationUpdateInput extends Partial<ReservationCreateInput> {
  id: string
}

// Get all reservations
export async function getReservations(): Promise<Reservation[]> {
  return apiGet<Reservation[]>("/reservations")
}

// Get a single reservation by ID
export async function getReservation(id: string): Promise<Reservation> {
  return apiGet<Reservation>(`/reservations/${id}`)
}

// Create a new reservation
export async function createReservation(reservation: ReservationCreateInput): Promise<Reservation> {
  return apiPost<Reservation>("/reservations", reservation)
}

// Update an existing reservation
export async function updateReservation(reservation: ReservationUpdateInput): Promise<Reservation> {
  return apiPut<Reservation>(`/reservations/${reservation.id}`, reservation)
}

// Delete a reservation
export async function deleteReservation(id: string): Promise<void> {
  return apiDelete<void>(`/reservations/${id}`)
}

// Update reservation status
export async function updateReservationStatus(id: string, status: string): Promise<Reservation> {
  return apiPut<Reservation>(`/reservations/${id}/status`, { status })
}

// For demo purposes, we'll simulate the API calls with mock data
const initialReservations: Reservation[] = [
  {
    id: "1",
    carId: "1",
    carDetails: {
      make: "Toyota",
      model: "Yaris",
      licensePlate: "WW-123-AB",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
    clientId: "1",
    clientDetails: { firstName: "Fatima", lastName: "El Yousfi", email: "fatima.elyousfi@email.com" },
    startDate: "2025-05-10",
    endDate: "2025-05-15",
    totalCost: 1250.0,
    status: "pending",
    reservationDate: "2025-04-28",
    decisionDate: null,
    notes: "Client requested baby seat if possible.",
  },
  {
    id: "2",
    carId: "2",
    carDetails: {
      make: "Renault",
      model: "Clio",
      licensePlate: "WW-456-CD",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
    clientId: "2",
    clientDetails: { firstName: "Karim", lastName: "Alaoui", email: "karim.alaoui@email.com" },
    startDate: "2025-05-08",
    endDate: "2025-05-12",
    totalCost: 880.0,
    status: "accepted",
    reservationDate: "2025-04-27",
    decisionDate: "2025-04-28",
    notes: "",
  },
  {
    id: "3",
    carId: "3",
    carDetails: {
      make: "Dacia",
      model: "Logan",
      licensePlate: "WW-789-EF",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
    clientId: "4",
    clientDetails: { firstName: "Omar", lastName: "Benjelloun", email: "omar.benjelloun@email.com" },
    startDate: "2025-05-05",
    endDate: "2025-05-07",
    totalCost: 540.0,
    status: "refused",
    reservationDate: "2025-04-25",
    decisionDate: "2025-04-26",
    notes: "Client has previous late returns.",
  },
  {
    id: "4",
    carId: "5",
    carDetails: {
      make: "Hyundai",
      model: "Tucson",
      licensePlate: "WW-345-IJ",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
    clientId: "3",
    clientDetails: { firstName: "Nadia", lastName: "Tazi", email: "nadia.tazi@email.com" },
    startDate: "2025-05-15",
    endDate: "2025-05-20",
    totalCost: 1750.0,
    status: "pending",
    reservationDate: "2025-04-29",
    decisionDate: null,
    notes: "First-time customer.",
  },
  {
    id: "5",
    carId: "1",
    carDetails: {
      make: "Toyota",
      model: "Yaris",
      licensePlate: "WW-123-AB",
      imageUrl: "/placeholder.svg?height=200&width=300",
    },
    clientId: "5",
    clientDetails: { firstName: "Leila", lastName: "Berrada", email: "leila.berrada@email.com" },
    startDate: "2025-05-25",
    endDate: "2025-05-30",
    totalCost: 1250.0,
    status: "pending",
    reservationDate: "2025-04-30",
    decisionDate: null,
    notes: "",
  },
]

// Mock implementation
let mockReservations = [...initialReservations]

export async function simulateGetReservations(): Promise<Reservation[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockReservations]
}

export async function simulateGetReservation(id: string): Promise<Reservation> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const reservation = mockReservations.find((r) => r.id === id)
  if (!reservation) throw new Error("Reservation not found")
  return { ...reservation }
}

export async function simulateCreateReservation(reservation: ReservationCreateInput): Promise<Reservation> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real implementation, we would fetch car and client details from the server
  // For demo purposes, we'll use mock data
  const carDetails = {
    make: "New Car",
    model: "Model",
    licensePlate: "WW-NEW-XX",
    imageUrl: "/placeholder.svg?height=200&width=300",
  }

  const clientDetails = {
    firstName: "New",
    lastName: "Client",
    email: "new.client@email.com",
  }

  const newReservation: Reservation = {
    id: Date.now().toString(),
    ...reservation,
    carDetails,
    clientDetails,
    reservationDate: new Date().toISOString().split("T")[0],
    decisionDate: null,
    notes: reservation.notes ? reservation.notes : "",
  }

  mockReservations.push(newReservation)
  return { ...newReservation }
}

export async function simulateUpdateReservation(reservation: ReservationUpdateInput): Promise<Reservation> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockReservations.findIndex((r) => r.id === reservation.id)
  if (index === -1) throw new Error("Reservation not found")

  mockReservations[index] = { ...mockReservations[index], ...reservation }
  return { ...mockReservations[index] }
}

export async function simulateDeleteReservation(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  mockReservations = mockReservations.filter((r) => r.id !== id)
}

export async function simulateUpdateReservationStatus(id: string, status: string): Promise<Reservation> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockReservations.findIndex((r) => r.id === id)
  if (index === -1) throw new Error("Reservation not found")

  mockReservations[index] = {
    ...mockReservations[index],
    status: status as any,
    decisionDate: new Date().toISOString().split("T")[0],
  }

  return { ...mockReservations[index] }
}
