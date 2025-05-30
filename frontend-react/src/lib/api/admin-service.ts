import { apiGet } from "../api-client";
import { formatDistanceToNow, parseISO, format } from 'date-fns';
// Interface for a single activity log item (matches current structure)
export interface ActivityLogEntry {
  id: string; // Or ObjectId if from MongoDB
  message: string;
  time: string; // Or Date if you prefer to format on frontend
  // Add other relevant fields like user_id, action_type if available
}

// Interface for the overall admin dashboard statistics
export interface AdminDashboardStats {
  totalManagers: number;
  totalSystemUsers: number; // This might be total users or specifically admin + managers
  // Add other stats if needed
}

// Combined interface for all dashboard data, similar to what fetchAdminDashboardData provided
export interface AdminDashboardData extends AdminDashboardStats {
  recentActivities: ActivityLogEntry[];
}

export interface RawAuditLog { // If you have another RawAuditLog, you might need to rename one
  id: string; // MongoDB _id typically converted to id string
  timestamp: string; // ISO date string
  action: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  userId?: string;
  userUsername?: string;
  details?: Record<string, any>;
}

// Interface for the paginated response from the audit log API
export interface AuditLogApiResponse {
  logs: RawAuditLog[];
  page: number;
  per_page: number;
  total: number;
  totalPages: number;
}

// Interface for a processed audit log entry for display in the UI
export interface ProcessedAuditLog {
  id: string;
  timestamp: string; // Formatted timestamp
  user: string; // Username or User ID
  action: string;
  target: string; // Combination of entityType and entityId
  status: string;
  details: string; // Stringified details for display
}

const ADMIN_STATS_ENDPOINT = "/admin/stats"; // Example endpoint for stats
const AUDIT_LOG_ENDPOINT = "/audit-logs"; // Example endpoint for activity log



/**
 * Fetches admin dashboard statistics from the backend.
 */
export async function getAdminStats(): Promise<AdminDashboardStats> {
  return apiGet<AdminDashboardStats>(ADMIN_STATS_ENDPOINT);
}

export async function getAuditLogs(
  page: number = 1,
  perPage: number = 20,
  filters: Record<string, string | number | undefined> = {}
): Promise<{ data: ProcessedAuditLog[]; totalPages: number; currentPage: number; totalRecords: number }> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', String(page));
  queryParams.append('per_page', String(perPage));

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      queryParams.append(key, String(value));
    }
  }

  const response = await apiGet<AuditLogApiResponse>(`/audit-logs/?${queryParams.toString()}`);

  const processedLogs = response.logs.map((log) => ({
    id: log.id,
    timestamp: format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
    user: log.userUsername || log.userId || "System",
    action: log.action,
    target: `${log.entityType || "N/A"}${log.entityId ? ` (${log.entityId})` : ""}`,
    status: log.status || "N/A",
    details: log.details ? JSON.stringify(log.details, null, 2) : "No details",
  }));

  return {
    data: processedLogs,
    totalPages: response.totalPages,
    currentPage: response.page,
    totalRecords: response.total,
  };
}

/**
 * Fetches recent activity logs from the backend.
 * @param limit - Optional limit for the number of log entries to fetch.
 */
export async function getRecentActivities(limit: number = 5): Promise<ActivityLogEntry[]> {
  // Assuming your backend /api/admin/audit-log can take a 'limit' query parameter
  return apiGet<ActivityLogEntry[]>(`${AUDIT_LOG_ENDPOINT}?limit=${limit}`);
}

/**
 * Fetches all necessary data for the admin dashboard.
 * This function can make multiple API calls if stats and activities are separate.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Example: If stats and activities are fetched separately
  const [stats, activities] = await Promise.all([
    getAdminStats(),
    getRecentActivities(5) // Fetch 5 recent activities
  ]);

  return {
    ...stats,
    recentActivities: activities,
  };

  // If your backend provides a single endpoint for all dashboard data:
  // return apiGet<AdminDashboardData>("/admin/dashboard-data"); // Adjust endpoint as needed
}