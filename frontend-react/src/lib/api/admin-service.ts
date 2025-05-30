import { apiGet } from "../api-client";
import { formatDistanceToNow, parseISO, format } from 'date-fns';

// Interface for a single activity log item for the dashboard
export interface ActivityLogEntry {
  id: string;
  message: string;
  time: string; // e.g., "2 hours ago", "Yesterday"
  action?: string; // Optional: to help with icons or specific styling
  status?: string; // Optional: for styling based on success/failure
}

// Interface for the overall admin dashboard statistics
export interface AdminDashboardStats {
  totalManagers: number;
  totalSystemUsers: number;
}

// Combined interface for all dashboard data
export interface AdminDashboardData extends AdminDashboardStats {
  recentActivities: ActivityLogEntry[];
}

// Interface for a single raw audit log entry from the backend
export interface RawAuditLog {
  id: string;
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

// Interface for a processed audit log entry for display in the AuditLogsPage
export interface ProcessedAuditLog {
  id: string;
  timestamp: string; // Formatted timestamp
  user: string; // Username or User ID
  action: string;
  target: string; // Combination of entityType and entityId
  status: string;
  details: string; // Stringified details for display
}

const ADMIN_STATS_ENDPOINT = "/admin/stats";
const AUDIT_LOG_ENDPOINT = "/audit-logs";

/**
 * Fetches admin dashboard statistics from the backend.
 */
export async function getAdminStats(): Promise<AdminDashboardStats> {
  return apiGet<AdminDashboardStats>(ADMIN_STATS_ENDPOINT);
}

/**
 * Fetches and processes audit logs for the AuditLogsPage with pagination and filters.
 */
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

  const response = await apiGet<AuditLogApiResponse>(`${AUDIT_LOG_ENDPOINT}/?${queryParams.toString()}`);

  const processedLogs = response.logs.map((log) => ({
    id: log.id,
    timestamp: format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
    user: log.userUsername || log.userId || "System",
    action: log.action,
    target: `${log.entityType || "N/A"}${log.entityId ? ` (${log.entityId.substring(0,8)}...)` : ""}`,
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
 * Generates a human-readable message from a raw audit log for recent activity.
 */
function formatActivityMessage(log: RawAuditLog): string {
  const user = log.userUsername || log.userId || "System";
  const action = log.action.replace(/_/g, ' '); // e.g., "create manager"
  const entity = log.entityType || "";
  const entityIdShort = log.entityId ? `(${log.entityId.substring(0, 8)}...)` : "";

  let message = `${user} ${action}`;

  if (entity && entity !== "system_stats" && entity !== "N/A") {
    message += ` ${entity}`;
    if (log.entityId) {
      message += ` ${entityIdShort}`;
    }
  }

  // Add more specific messages based on action and details
  if (log.action === 'create_manager' && log.details?.username) {
    message = `${user} created manager '${log.details.username}'.`;
  } else if (log.action === 'delete_manager' && log.details?.deleted_username) {
    message = `${user} deleted manager '${log.details.deleted_username}'.`;
  } else if (log.action === 'update_manager' && log.details?.updatedFields && log.entityId) {
    const updatedFields = Object.keys(log.details.updatedFields).join(', ');
    message = `${user} updated manager ${entityIdShort} (fields: ${updatedFields}).`;
  } else if (log.action === 'login_success') {
    message = `User '${user}' logged in successfully.`;
  } else if (log.action === 'login_failure' && log.details?.username) {
    message = `Login attempt failed for '${log.details.username}'.`;
  } else if (log.action === 'create_car' && log.details?.registration_number) {
    message = `${user} added car '${log.details.registration_number}'.`;
  } else if (log.action === 'update_car' && log.entityId) {
    message = `${user} updated car ${entityIdShort}.`;
  } else if (log.action === 'delete_car' && log.details?.registration_number) {
    message = `${user} deleted car '${log.details.registration_number}'.`;
  } else if (log.action === 'create_reservation' && log.details?.client_name) {
    message = `${user} created reservation for '${log.details.client_name}'.`;
  } else if (log.action === 'update_reservation_status' && log.details?.new_status && log.entityId) {
    message = `${user} updated reservation ${entityIdShort} to '${log.details.new_status}'.`;
  } else if (log.action.startsWith('http_error_') && log.details?.path) {
    message = `System ${log.action.includes('500') ? 'error' : 'warning'}: ${action} for path '${log.details.path}'.`;
  } else if (log.action === 'get_admin_stats') {
    // This message will be generated but the log itself will be filtered out by getRecentActivities
    message = `${user} viewed admin dashboard statistics.`;
  }


  if (log.status && log.status !== 'success' && log.status !== 'info') {
    message += ` (Status: ${log.status})`;
  }

  return message.charAt(0).toUpperCase() + message.slice(1); // Capitalize first letter
}

/**
 * Fetches recent activity logs from the backend and formats them for the dashboard,
 * ensuring a specific number of "important" logs are retrieved.
 * @param desiredLimit - The number of important log entries to fetch.
 * @param maxPagesToFetch - Maximum number of pages to iterate through to find important logs.
 * @param logsPerPage - Number of logs to fetch per API call.
 */
export async function getRecentActivities(
  desiredLimit: number = 5,
  maxPagesToFetch: number = 5, // Max 5 pages (e.g., 5*20 = 100 logs) to prevent too many calls
  logsPerPage: number = 20     // Default logs per page from your audit log endpoint
): Promise<ActivityLogEntry[]> {
  const importantActivities: ActivityLogEntry[] = [];
  let currentPage = 1;

  try {
    while (importantActivities.length < desiredLimit && currentPage <= maxPagesToFetch) {
      const response = await apiGet<AuditLogApiResponse>(
        `${AUDIT_LOG_ENDPOINT}/?page=${currentPage}&per_page=${logsPerPage}`
      );

      if (response && response.logs && response.logs.length > 0) {
        const pageActivities = response.logs
          .filter((log: RawAuditLog) => log.action !== 'get_admin_stats') // Filter out unimportant logs
          .map((log: RawAuditLog) => ({
            id: log.id,
            message: formatActivityMessage(log),
            time: formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true }),
            action: log.action,
            status: log.status,
          }));

        for (const activity of pageActivities) {
          if (importantActivities.length < desiredLimit) {
            importantActivities.push(activity);
          } else {
            break; // We have collected enough important activities
          }
        }
      } else {
        // No more logs to fetch from the backend, or an issue with the response
        break;
      }

      if (importantActivities.length >= desiredLimit) {
        break; // Exit if we've met the desired limit
      }
      currentPage++;
    }
    // Ensure we only return up to the desiredLimit, even if we slightly overshot due to batch processing
    return importantActivities.slice(0, desiredLimit);
  } catch (error) {
    console.error("Failed to fetch recent activities:", error);
    return []; // Return empty array on error
  }
}

/**
 * Fetches all necessary data for the admin dashboard.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [stats, activities] = await Promise.all([
    getAdminStats(),
    getRecentActivities(5) // This will now use the new robust fetching logic
  ]);

  return {
    ...stats,
    recentActivities: activities,
  };
}