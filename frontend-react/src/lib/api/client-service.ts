import { apiDelete, apiGet, apiPost, apiPut } from "../api-client"

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  driverLicenseNumber: string
  registeredAt: string
}

export interface ClientCreateInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  driverLicenseNumber: string
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
export async function updateClient(client: ClientUpdateInput): Promise<Client> {
  return apiPut<Client>(`/clients/${client.id}`, client)
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
    email: "fatima.elyousfi@email.com",
    phone: "+212612345678",
    driverLicenseNumber: "G789123",
    registeredAt: "2025-04-28",
  },
  {
    id: "2",
    firstName: "Karim",
    lastName: "Alaoui",
    email: "karim.alaoui@email.com",
    phone: "+212623456789",
    driverLicenseNumber: "G456789",
    registeredAt: "2025-04-25",
  },
  {
    id: "3",
    firstName: "Nadia",
    lastName: "Tazi",
    email: "nadia.tazi@email.com",
    phone: "+212634567890",
    driverLicenseNumber: "G123456",
    registeredAt: "2025-04-20",
  },
  {
    id: "4",
    firstName: "Omar",
    lastName: "Benjelloun",
    email: "omar.benjelloun@email.com",
    phone: "+212645678901",
    driverLicenseNumber: "G654321",
    registeredAt: "2025-04-15",
  },
  {
    id: "5",
    firstName: "Leila",
    lastName: "Berrada",
    email: "leila.berrada@email.com",
    phone: "+212656789012",
    driverLicenseNumber: "G987654",
    registeredAt: "2025-04-10",
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
    registeredAt: new Date().toISOString().split("T")[0],
  }
  mockClients.push(newClient)
  return { ...newClient }
}

export async function simulateUpdateClient(client: ClientUpdateInput): Promise<Client> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockClients.findIndex((c) => c.id === client.id)
  if (index === -1) throw new Error("Client not found")

  mockClients[index] = { ...mockClients[index], ...client }
  return { ...mockClients[index] }
}

export async function simulateDeleteClient(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  mockClients = mockClients.filter((c) => c.id !== id)
}
