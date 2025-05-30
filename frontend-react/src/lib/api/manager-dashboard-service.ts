import { apiGet } from "../api-client";

// --- Interfaces for Dashboard Data ---

export interface ManagerDashboardStats {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  maintenanceCars: number;
  totalClients: number;
  activeReservations: number;
  pendingReservations: number;
  monthlyRevenue: number;
}

export interface RecentClientInfo {
  id: string;
  name: string; // e.g., "FirstName LastName"
  email?: string;
  registeredAt: string; // ISO date string
}

export interface RecentReservationInfo {
  id: string;
  clientName: string; // Name of the client
  carModel: string;   // e.g., "Toyota Yaris"
  startDate: string;  // ISO date string
  status: "pending" | "confirmed" | "cancelled" | "completed" | "active"; // Match your reservation statuses
}

export interface FullManagerDashboardData extends ManagerDashboardStats {
  recentClients: RecentClientInfo[];
  recentReservations: RecentReservationInfo[];
}

// --- API Service Functions ---

const MANAGER_DASHBOARD_BASE = "/manager/dashboard"; // Define a base path for these endpoints

/**
 * Fetches all statistics for the manager dashboard.
 */
export async function getManagerDashboardStats(): Promise<ManagerDashboardStats> {
  // Replace with your actual API endpoint if different
  return apiGet<ManagerDashboardStats>(`${MANAGER_DASHBOARD_BASE}/stats`);
}

/**
 * Fetches a list of recent clients for the dashboard.
 * @param limit - Number of recent clients to fetch.
 */
export async function getRecentClientsForDashboard(limit: number = 3): Promise<RecentClientInfo[]> {
  // Replace with your actual API endpoint if different
  return apiGet<RecentClientInfo[]>(`${MANAGER_DASHBOARD_BASE}/recent-clients?limit=${limit}`);
}

/**
 * Fetches a list of recent reservations for the dashboard.
 * @param limit - Number of recent reservations to fetch.
 */
export async function getRecentReservationsForDashboard(limit: number = 3): Promise<RecentReservationInfo[]> {
  // Replace with your actual API endpoint if different
  return apiGet<RecentReservationInfo[]>(`${MANAGER_DASHBOARD_BASE}/recent-reservations?limit=${limit}`);
}

/**
 * Fetches all data for the manager dashboard in one go.
 */
export async function getFullManagerDashboardData(): Promise<FullManagerDashboardData> {
  // This is an example of fetching all data, adjust if your backend provides a single endpoint
  // or if you prefer to keep them separate.
  // For now, let's assume we call the individual functions.
  const [stats, recentClients, recentReservations] = await Promise.all([
    getManagerDashboardStats(),
    getRecentClientsForDashboard(3),
    getRecentReservationsForDashboard(3)
  ]);

  return {
    ...stats,
    recentClients,
    recentReservations,
  };
}