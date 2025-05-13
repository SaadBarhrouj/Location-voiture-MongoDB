import { apiDelete, apiGet, apiPost, apiPut } from "../api-client"

export interface Manager {
  id: string
  username: string
  fullName: string
  createdAt: string
}

export interface ManagerCreateInput {
  username: string
  fullName: string
  password: string
}

export interface ManagerUpdateInput {
  id: string
  username?: string
  fullName?: string
  password?: string
}

// Get all managers
export async function getManagers(): Promise<Manager[]> {
  return apiGet<Manager[]>("/managers")
}

// Get a single manager by ID
export async function getManager(id: string): Promise<Manager> {
  return apiGet<Manager>(`/managers/${id}`)
}

// Create a new manager
export async function createManager(manager: ManagerCreateInput): Promise<Manager> {
  return apiPost<Manager>("/managers", manager)
}

// Update an existing manager
export async function updateManager(manager: ManagerUpdateInput): Promise<Manager> {
  return apiPut<Manager>(`/managers/${manager.id}`, manager)
}

// Delete a manager
export async function deleteManager(id: string): Promise<void> {
  return apiDelete<void>(`/managers/${id}`)
}

// For demo purposes, we'll simulate the API calls with mock data
const initialManagers: Manager[] = [
  {
    id: "1",
    username: "manager01",
    fullName: "Ahmed Benali",
    createdAt: "2025-04-28",
  },
  {
    id: "2",
    username: "manager02",
    fullName: "Fatima Zahra",
    createdAt: "2025-04-25",
  },
  {
    id: "3",
    username: "manager03",
    fullName: "Karim Alaoui",
    createdAt: "2025-04-20",
  },
  {
    id: "4",
    username: "manager04",
    fullName: "Nadia Tazi",
    createdAt: "2025-04-15",
  },
  {
    id: "5",
    username: "manager05",
    fullName: "Omar Benjelloun",
    createdAt: "2025-04-10",
  },
]

// Mock implementation
let mockManagers = [...initialManagers]

export async function simulateGetManagers(): Promise<Manager[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...mockManagers]
}

export async function simulateGetManager(id: string): Promise<Manager> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const manager = mockManagers.find((m) => m.id === id)
  if (!manager) throw new Error("Manager not found")
  return { ...manager }
}

export async function simulateCreateManager(manager: ManagerCreateInput): Promise<Manager> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const newManager: Manager = {
    id: Date.now().toString(),
    username: manager.username,
    fullName: manager.fullName,
    createdAt: new Date().toISOString().split("T")[0],
  }
  mockManagers.push(newManager)
  return { ...newManager }
}

export async function simulateUpdateManager(manager: ManagerUpdateInput): Promise<Manager> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = mockManagers.findIndex((m) => m.id === manager.id)
  if (index === -1) throw new Error("Manager not found")

  mockManagers[index] = {
    ...mockManagers[index],
    ...(manager.username ? { username: manager.username } : {}),
    ...(manager.fullName ? { fullName: manager.fullName } : {}),
  }

  return { ...mockManagers[index] }
}

export async function simulateDeleteManager(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  mockManagers = mockManagers.filter((m) => m.id !== id)
}
