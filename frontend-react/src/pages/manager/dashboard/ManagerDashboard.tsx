import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Car, Eye, Plus, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function ManagerDashboard() {
  // Mock data - remplacez par vos vraies données
  const stats = {
    totalCars: 25,
    availableCars: 18,
    rentedCars: 5,
    maintenanceCars: 2,
    totalClients: 87,
    activeReservations: 12,
    pendingReservations: 3,
    monthlyRevenue: 45780,
  };

  const recentClients = [
    { id: "1", name: "Fatima El Yousfi", email: "fatima@email.com", registeredAt: "2024-01-15" },
    { id: "2", name: "Karim Alaoui", email: "karim@email.com", registeredAt: "2024-01-10" },
    { id: "3", name: "Nadia Tazi", email: "nadia@email.com", registeredAt: "2024-01-08" },
  ];

  const recentReservations = [
    { id: "1", client: "Omar Benjelloun", car: "Toyota Yaris", startDate: "2024-01-20", status: "confirmed" },
    { id: "2", client: "Leila Berrada", car: "Renault Clio", startDate: "2024-01-22", status: "pending" },
    { id: "3", client: "Ahmed Mansouri", car: "Dacia Logan", startDate: "2024-01-25", status: "confirmed" },
  ];

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
            <div className="text-2xl font-bold">{stats.totalCars}</div>
            <div className="text-xs text-muted-foreground">
              {stats.availableCars} available • {stats.rentedCars} rented
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
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
            <div className="text-2xl font-bold">{stats.activeReservations}</div>
            <div className="text-xs text-muted-foreground">
              {stats.pendingReservations} pending approval
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()} MAD</div>
            <div className="text-xs text-muted-foreground">
              +12% from last month
            </div>
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
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(client.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              {recentReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{reservation.client}</p>
                    <p className="text-xs text-muted-foreground">{reservation.car}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={reservation.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
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
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your car rental business efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/manager/cars">
                <Plus className="mr-2 h-4 w-4" />
                Add New Car
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/manager/clients">
                <Plus className="mr-2 h-4 w-4" />
                Add New Client
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/manager/reservations">
                <Calendar className="mr-2 h-4 w-4" />
                New Reservation
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}