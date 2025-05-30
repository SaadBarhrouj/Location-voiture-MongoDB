import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getFullManagerDashboardData,
  type FullManagerDashboardData,
  type RecentClientInfo,
  type RecentReservationInfo,
} from "@/lib/api/manager-dashboard-service"; // Import the new service and types
import { Calendar, Car, Eye, TrendingUp, Users } from "lucide-react"; // Removed Plus as it's not used here
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Helper to get badge color for reservation status
const getReservationStatusBadgeClass = (status: RecentReservationInfo['status']): string => {
  switch (status) {
    case "confirmed":
    case "active":
      return "bg-green-100 text-green-700 border-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300";
    case "completed":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export default function ManagerDashboard() {
  const [dashboardData, setDashboardData] = useState<FullManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getFullManagerDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error("Error fetching manager dashboard data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" /> <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-16 mb-1" /> <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-1/2 mb-1" /><Skeleton className="h-4 w-3/4" /></CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Dashboard</h1>
        <p className="text-muted-foreground mb-4">{error || "Could not fetch dashboard data."}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const {
    totalCars, availableCars, rentedCars, /* maintenanceCars, */ // Assuming maintenanceCars might not be used directly in current JSX
    totalClients, activeReservations, pendingReservations, monthlyRevenue,
    recentClients, recentReservations
  } = dashboardData;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/manager/cars">
              <Car className="mr-2 h-4 w-4" />
              Manage Cars
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/manager/clients">
              <Users className="mr-2 h-4 w-4" />
              Manage Clients
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCars}</div>
            <div className="text-xs text-muted-foreground">
              {availableCars} available • {rentedCars} rented
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <div className="text-xs text-muted-foreground">
              Registered clients
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReservations}</div>
            <div className="text-xs text-muted-foreground">
              {pendingReservations} pending approval
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyRevenue.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Clients</CardTitle>
                <CardDescription>Latest client registrations</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/manager/clients">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentClients.length > 0 ? (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(client.registeredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent client registrations.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Reservations</CardTitle>
                <CardDescription>Latest booking requests</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/manager/reservations">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentReservations.length > 0 ? (
              <div className="space-y-4">
                {recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{reservation.clientName}</p>
                      <p className="text-xs text-muted-foreground">{reservation.carModel}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`border ${getReservationStatusBadgeClass(reservation.status)}`}
                      >
                        {reservation.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(reservation.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent reservations.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}