import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminDashboardData, type AdminDashboardData, type ActivityLogEntry as Activity } from "@/lib/api/admin-service"; // Updated import
import { Skeleton } from "@/components/ui/skeleton"; // For better loading state
import { Button } from "@/components/ui/button"; // For retry button

// The interfaces Activity and AdminDashboardData are now imported from admin-service.ts
// So, local definitions can be removed if they are identical.
// interface Activity { ... }
// interface DashboardData { ... } // Renamed to AdminDashboardData in service

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminDashboardData(); // Call the actual API service function
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
              <div key={i} className="border-b pb-2 last:border-b-0 last:pb-0">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/4" />
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
    // This case might be redundant if error handles API failures,
    // but good for unexpected null data without error.
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background text-foreground">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin dashboard. Here you can manage manager accounts.</p>

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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalSystemUsers}</div>
              <p className="text-xs text-muted-foreground">Total users (including admin)</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Recent actions performed in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length > 0 ? (
              <div className="space-y-4">
                {data.recentActivities.map((activity: Activity) => (
                  <div key={activity.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}