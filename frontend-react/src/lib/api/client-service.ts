import { apiDelete, apiGet, apiPost, apiPut } from "../api-client"

export interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  CIN: string
  email?: string
  driverLicenseNumber?: string
  notes?: string
  registeredAt: string
  registeredBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface ClientCreateInput {
  firstName: string
  lastName: string
  phone: string
  CIN: string
  email?: string
  driverLicenseNumber?: string
  notes?: string
}

export interface ClientUpdateInput extends Partial<ClientCreateInput> {
  id: string
}

// Get all clients
export async function getClients(): Promise<Client[]> {
  return apiGet<Client[]>("/clients")
}

// Get a single client by ID
export async function getClient(id: string): Promise<Client> {
  return apiGet<Client>(`/clients/${id}`)
}

// Create a new client
export async function createClient(client: ClientCreateInput): Promise<Client> {
  return apiPost<Client>("/clients", client)
}

// Update an existing client
export async function updateClient(id: string, client: Partial<ClientCreateInput>): Promise<Client> {
  return apiPut<Client>(`/clients/${id}`, client)
}

// Delete a client
export async function deleteClient(id: string): Promise<void> {
  return apiDelete<void>(`/clients/${id}`)
}

// For demo purposes, we'll simulate the API calls with mock data
const initialClients: Client[] = [
  {
    id: "1",
    firstName: "Fatima",
    lastName: "El Yousfi",
    phone: "+212661234567",
    CIN: "AB123456",
    email: "fatima.elyousfi@email.com",
    driverLicenseNumber: "DL789012",
    notes: "Client fidèle depuis 2020",
    registeredAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    firstName: "Karim",
    lastName: "Alaoui",
    phone: "+212662345678",
    CIN: "CD234567",
    email: "karim.alaoui@email.com",
    driverLicenseNumber: "DL890123",
    registeredAt: "2024-02-20T14:15:00Z",
  },
  {
    id: "3",
    firstName: "Nadia",
    lastName: "Tazi",
    phone: "+212663456789",
    CIN: "EF345678",
    email: "nadia.tazi@email.com",
    notes: "Préfère les voitures automatiques",
    registeredAt: "2024-03-10T09:45:00Z",
  },
  {
    id: "4",
    firstName: "Omar",
    lastName: "Benjelloun",
    phone: "+212664567890",
    CIN: "GH456789",
    driverLicenseNumber: "DL901234",
    registeredAt: "2024-04-05T16:20:00Z",
  },
  {
    id: "5",
    firstName: "Leila",
    lastName: "Berrada",
    phone: "+212665678901",
    CIN: "IJ567890",
    email: "leila.berrada@email.com",
    driverLicenseNumber: "DL012345",
    notes: "Cliente d'entreprise",
    registeredAt: "2024-04-28T11:10:00Z",
  },
]

// Mock implementation
let mockClients = [...initialClients]

export async function simulateGetClients(): Promise<Client[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockClients]
}

export async function simulateGetClient(id: string): Promise<Client> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const client = mockClients.find((c) => c.id === id)
  if (!client) throw new Error("Client not found")
  return { ...client }
}

export async function simulateCreateClient(client: ClientCreateInput): Promise<Client> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const newClient: Client = {
    id: Date.now().toString(),
    ...client,
    registeredAt: new Date().toISOString(),
  }
  mockClients.push(newClient)
  return { ...newClient }
}

export async function simulateUpdateClient(id: string, client: Partial<ClientCreateInput>): Promise<Client> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockClients.findIndex((c) => c.id === id)
  if (index === -1) throw new Error("Client not found")

  mockClients[index] = { 
    ...mockClients[index], 
    ...client,
    updatedAt: new Date().toISOString(),
  }
  return { ...mockClients[index] }
}

export async function simulateDeleteClient(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  mockClients = mockClients.filter((c) => c.id !== id)
}
