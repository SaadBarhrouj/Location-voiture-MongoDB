import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type Reservation,
  type ReservationStatus,
  deleteReservation,
  getReservations,
} from "@/lib/api/reservation-service";
import { format } from "date-fns";
import { Edit, Edit3, Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ReservationDetails } from "./ReservationDetails";
import { ReservationForm } from "./ReservationForm";
import { ReservationStatusUpdateDialog } from "./ReservationStatusUpdateDialog";

// Helper pour les couleurs de statut
export const getStatusColor = (status: ReservationStatus): string => {
  switch (status) {
    case "pending_confirmation": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "confirmed": return "bg-blue-100 text-blue-800 border-blue-300";
    case "active": return "bg-green-100 text-green-800 border-green-300";
    case "completed": return "bg-purple-100 text-purple-800 border-purple-300";
    case "cancelled_by_client":
    case "cancelled_by_agency":
    case "no_show":
      return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export const formatStatus = (status: ReservationStatus): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      toast.error("Failed to fetch reservations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PP");
    } catch {
      return dateString;
    }
  };

  const handleAddReservation = () => {
    setFormMode("add");
    setCurrentReservation(null);
    setIsFormOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setFormMode("edit");
    setCurrentReservation(reservation);
    setIsFormOpen(true);
  };

  const handleViewDetails = (reservation: Reservation) => {
    setCurrentReservation(reservation);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = (reservation: Reservation) => {
    setCurrentReservation(reservation);
    setIsStatusUpdateOpen(true);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    setCurrentReservation(reservation);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentReservation) return;

    const originalReservations = [...reservations];
    setReservations(reservations.filter((r) => r.id !== currentReservation.id));
    toast.info("Deleting reservation...");

    try {
      await deleteReservation(currentReservation.id);
      toast.success("Reservation deleted successfully.");
    } catch (err) {
      console.error("Error deleting reservation:", err);
      toast.error("Failed to delete reservation.");
      setReservations(originalReservations);
    } finally {
      setCurrentReservation(null);
    }
  };

  const handleFormSubmitSuccess = (updatedReservation: Reservation) => {
    if (formMode === "add") {
      setReservations((prev) => [...prev, updatedReservation]);
    } else {
      setReservations((prev) =>
        prev.map((r) => (r.id === updatedReservation.id ? updatedReservation : r))
      );
    }
    setIsFormOpen(false);
  };

  const handleStatusUpdateSuccess = (updatedReservation: Reservation) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === updatedReservation.id ? updatedReservation : r))
    );
    setIsStatusUpdateOpen(false);
  };

  const getRowActions = (reservation: Reservation) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleViewDetails(reservation)}>
          <Eye className="mr-2 h-4 w-4" /> View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditReservation(reservation)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdateStatus(reservation)}>
          <Edit3 className="mr-2 h-4 w-4" /> Update Status
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDeleteReservation(reservation)}
          className="text-red-600 hover:!text-red-600 hover:!bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const columns = [
    {
      header: "N° Res.",
      accessorKey: "reservationNumber" as keyof Reservation,
      cell: (reservation: Reservation) => (
        <span className="font-mono text-xs">{reservation.reservationNumber}</span>
      )
    },
    {
      header: "Car",
      accessorKey: "carDetails" as keyof Reservation,
      cell: (reservation: Reservation) => {
        const car = reservation.carDetails;
        return car ? `${car.make} ${car.model} (${car.licensePlate})` : "N/A";
      },
    },
    {
      header: "Client",
      accessorKey: "clientDetails" as keyof Reservation,
      cell: (reservation: Reservation) => {
        const client = reservation.clientDetails;
        return client ? `${client.firstName} ${client.lastName}` : "N/A";
      },
    },
    {
      header: "Dates",
      cell: (reservation: Reservation) => (
        <div className="text-sm">
          <div>Start: {formatDate(reservation.startDate)}</div>
          <div>End: {formatDate(reservation.endDate)}</div>
        </div>
      ),
    },
    {
      header: "Est. Cost",
      accessorKey: "estimatedTotalCost" as keyof Reservation,
      cell: (reservation: Reservation) => `${reservation.estimatedTotalCost.toFixed(2)} MAD`,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Reservation,
      cell: (reservation: Reservation) => (
        <Badge variant="outline" className={`${getStatusColor(reservation.status)} whitespace-nowrap`}>
          {formatStatus(reservation.status)}
        </Badge>
      ),
    },
    {
      header: "Reserved On",
      accessorKey: "reservationDate" as keyof Reservation,
      cell: (reservation: Reservation) => formatDate(reservation.reservationDate),
    },
    {
      header: "Actions",
      cell: (reservation: Reservation) => getRowActions(reservation),
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
        <Button onClick={handleAddReservation}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reservation
        </Button>
      </div>

      <DataTable
        data={reservations}
        columns={columns}
        isLoading={isLoading}
      />

      <ReservationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        reservation={currentReservation}
        onSubmitSuccess={handleFormSubmitSuccess}
      />

      <ReservationDetails
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        reservation={currentReservation}
      />

      <ReservationStatusUpdateDialog
        open={isStatusUpdateOpen}
        onOpenChange={setIsStatusUpdateOpen}
        reservation={currentReservation}
        onSubmitSuccess={handleStatusUpdateSuccess}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Reservation"
        description={`Are you sure you want to delete reservation ${currentReservation?.reservationNumber}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
