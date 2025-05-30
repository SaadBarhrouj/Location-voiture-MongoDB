import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Users, LogIn, UserPlus, Car, AlertCircle, CheckCircle, Edit3, Trash2, FileText, BarChart3 } from "lucide-react"; // Added more icons
import { Link } from "react-router-dom";
import { getAdminDashboardData, type AdminDashboardData, type ActivityLogEntry as Activity } from "@/lib/api/admin-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Helper function to get an icon based on activity action
const getActivityIcon = (action?: string, status?: string): React.ReactNode => {
  const iconClass = "h-4 w-4 mr-3 flex-shrink-0"; // Increased margin for better spacing

  if (status === 'failure' || action?.includes('error')) return <AlertCircle className={`${iconClass} text-red-500`} />;
  
  switch (action) {
    case 'login_success': return <LogIn className={`${iconClass} text-green-500`} />;
    case 'create_manager':
    case 'create_user': // Assuming you might have a create_user action
      return <UserPlus className={`${iconClass} text-blue-500`} />;
    case 'update_manager':
    case 'update_user':
    case 'update_car':
    case 'update_reservation_status':
      return <Edit3 className={`${iconClass} text-yellow-600`} />;
    case 'delete_manager':
    case 'delete_car':
      return <Trash2 className={`${iconClass} text-red-600`} />;
    case 'create_car': return <Car className={`${iconClass} text-indigo-500`} />;
    case 'create_reservation': return <FileText className={`${iconClass} text-purple-500`} />;
    case 'get_admin_stats': return <BarChart3 className={`${iconClass} text-sky-500`} />;
    default:
      if (status === 'success') return <CheckCircle className={`${iconClass} text-green-500`} />;
      return <FileText className={`${iconClass} text-gray-400`} />;
  }
};

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminDashboardData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(errorMessage);
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Loading dashboard data...</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-6" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-6" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start border-b pb-3 last:border-b-0 last:pb-0 pt-1">
                <Skeleton className="h-5 w-5 mr-3 rounded-full" />
                <div className="flex-grow">
                  <Skeleton className="h-5 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-red-600 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        <p className="mb-4">{error}</p>
        <Button onClick={loadDashboardData}>Try Again</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">No data available.</p>
        <Button onClick={loadDashboardData} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background text-foreground">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin dashboard. Here you can manage the system.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/admin/managers" className="no-underline hover:opacity-90 transition-opacity">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalManagers}</div>
                <p className="text-xs text-muted-foreground">Active manager accounts</p>
              </CardContent>
            </Card>
          </Link>

          <Card> {/* This card is not a link */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalSystemUsers}</div>
              <p className="text-xs text-muted-foreground">Total users (including admin & managers)</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions performed in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length > 0 ? (
              <div className="space-y-1">
                {data.recentActivities.map((activity: Activity) => (
                  <div key={activity.id} className="flex items-start border-b py-3 last:border-b-0 last:pb-0 first:pt-0">
                    {getActivityIcon(activity.action, activity.status)}
                    <div className="flex-grow">
                      <p className="text-sm font-medium leading-snug">{activity.message}</p>
                      <p className="text-xs text-muted-foreground pt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}