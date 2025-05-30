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
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Added Popover
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added Select
import {
  type Reservation,
  type ReservationStatus,
  deleteReservation,
  getReservations,
} from "@/lib/api/reservation-service";
import { format, isValid, parseISO } from "date-fns"; // Added isValid, parseISO
import { Edit, Edit3, Eye, Filter, MoreHorizontal, Plus, Trash2, X } from "lucide-react"; // Added Filter, X
import { useEffect, useMemo, useState } from "react"; // Added useMemo
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

const reservationStatusesList: Array<ReservationStatus | "all"> = [
  "all", "pending_confirmation", "confirmed", "active", "completed", "cancelled_by_client", "cancelled_by_agency", "no_show"
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // Filter states
  const [reservationNumberFilter, setReservationNumberFilter] = useState("");
  const [carFilter, setCarFilter] = useState(""); // Search by make, model, license plate
  const [clientFilter, setClientFilter] = useState(""); // Search by name
  const [startDateFilter, setStartDateFilter] = useState(""); // YYYY-MM-DD
  const [endDateFilter, setEndDateFilter] = useState(""); // YYYY-MM-DD
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false);

  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch reservations.";
      setError(errorMessage);
      toast.error(errorMessage);
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
      return format(parseISO(dateString), "PP"); // Use parseISO for consistency
    } catch {
      return dateString;
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const statusMatch = statusFilter === "all" || reservation.status === statusFilter;

      const carDetails = reservation.carDetails;
      const carMatch = carFilter === "" || (carDetails &&
        ( (carDetails.make?.toLowerCase() || "").includes(carFilter.toLowerCase()) ||
          (carDetails.model?.toLowerCase() || "").includes(carFilter.toLowerCase()) ||
          (carDetails.licensePlate?.toLowerCase() || "").includes(carFilter.toLowerCase())
        )
      );

      const clientDetails = reservation.clientDetails;
      const clientMatch = clientFilter === "" || (clientDetails &&
        ( (clientDetails.firstName?.toLowerCase() || "").includes(clientFilter.toLowerCase()) ||
          (clientDetails.lastName?.toLowerCase() || "").includes(clientFilter.toLowerCase())
        )
      );
      
      let startDateMatch = true;
      if (startDateFilter) {
        try {
          const filterDate = parseISO(startDateFilter);
          const reservationStartDate = parseISO(reservation.startDate);
          if (isValid(filterDate) && isValid(reservationStartDate)) {
            // Filter for reservations starting on or after the filter date
            startDateMatch = reservationStartDate >= filterDate;
          } else {
            startDateMatch = true; // Or false if strict, depends on desired behavior for invalid input
          }
        } catch { startDateMatch = true; } // Ignore invalid date filter
      }

      let endDateMatch = true;
      if (endDateFilter) {
        try {
          const filterDate = parseISO(endDateFilter);
          const reservationEndDate = parseISO(reservation.endDate);
          if (isValid(filterDate) && isValid(reservationEndDate)) {
            // Filter for reservations ending on or before the filter date
            endDateMatch = reservationEndDate <= filterDate;
          } else {
            endDateMatch = true;
          }
        } catch { endDateMatch = true; } // Ignore invalid date filter
      }

      return (
        (reservation.reservationNumber?.toLowerCase() || "").includes(reservationNumberFilter.toLowerCase()) &&
        carMatch &&
        clientMatch &&
        statusMatch &&
        startDateMatch &&
        endDateMatch
      );
    });
  }, [reservations, reservationNumberFilter, carFilter, clientFilter, statusFilter, startDateFilter, endDateFilter]);

  const handleClearFilters = () => {
    setReservationNumberFilter("");
    setCarFilter("");
    setClientFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setStatusFilter("all");
    setIsFiltersPopoverOpen(false);
  };

  const activeFilterCount = [
    reservationNumberFilter,
    carFilter,
    clientFilter,
    startDateFilter,
    endDateFilter,
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;


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
    // toast.info("Deleting reservation..."); // Removed for consistency

    try {
      await deleteReservation(currentReservation.id);
      toast.success("Reservation deleted successfully.");
    } catch (err) {
      console.error("Error deleting reservation:", err);
      toast.error("Failed to delete reservation.");
      setReservations(originalReservations);
    } finally {
      setCurrentReservation(null);
      setIsDeleteDialogOpen(false); // Close dialog in finally
    }
  };

  const handleFormSubmitSuccess = (updatedOrNewReservation: Reservation) => {
    // Refetch to ensure data consistency
    fetchReservations();
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
      cell: (item: Reservation) => (
        <span className="font-mono text-xs">{item.reservationNumber}</span>
      )
    },
    {
      header: "Car",
      accessorKey: "carDetails" as keyof Reservation, // carDetails might not be a direct keyof Reservation if it's optional or complex. Consider 'carId' or a display key.
                                                    // If carDetails is an object within Reservation, this accessorKey might be problematic for sorting/filtering if DataTable relies on it.
                                                    // For display purposes with a cell renderer, it's often fine.
      cell: (item: Reservation) => { // MODIFIED HERE
        const car = item.carDetails;
        return car ? `${car.make} ${car.model} (${car.licensePlate})` : "N/A";
      },
    },
    {
      header: "Client",
      accessorKey: "clientDetails" as keyof Reservation, // Similar to carDetails, ensure this is a valid key or handle appropriately.
      cell: (item: Reservation) => { // MODIFIED HERE
        const client = item.clientDetails;
        return client ? `${client.firstName} ${client.lastName}` : "N/A";
      },
    },
    {
      header: "Dates",
      accessorKey: "startDate" as keyof Reservation, // ADDED/MODIFIED: Provide a valid key. 'startDate' or 'id' can work.
      cell: (item: Reservation) => ( // MODIFIED HERE
        <div className="text-sm">
          <div>Start: {formatDate(item.startDate)}</div>
          <div>End: {formatDate(item.endDate)}</div>
        </div>
      ),
    },
    {
      header: "Est. Cost",
      accessorKey: "estimatedTotalCost" as keyof Reservation,
      cell: (item: Reservation) => `${item.estimatedTotalCost.toFixed(2)} MAD`, // MODIFIED HERE
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Reservation,
      cell: (item: Reservation) => ( // MODIFIED HERE
        <Badge variant="outline" className={`${getStatusColor(item.status)} whitespace-nowrap`}>
          {formatStatus(item.status)}
        </Badge>
      ),
    },
    {
      header: "Reserved On",
      accessorKey: "reservationDate" as keyof Reservation,
      cell: (item: Reservation) => formatDate(item.reservationDate), // MODIFIED HERE
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Reservation, // ADDED: Provide a unique key, 'id' is a good choice.
      cell: (item: Reservation) => getRowActions(item), // MODIFIED HERE
    }
  ];
  
  if (error && !isLoading && reservations.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <Button onClick={fetchReservations}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
        <div className="flex items-center gap-2">
          <Popover open={isFiltersPopoverOpen} onOpenChange={setIsFiltersPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px]" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter Reservations</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply filters to narrow down the reservation list.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="reservationNumberFilter" className="text-xs">Res. Number</Label>
                    <Input
                      id="reservationNumberFilter"
                      value={reservationNumberFilter}
                      onChange={(e) => setReservationNumberFilter(e.target.value)}
                      placeholder="Filter by number..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="carFilter" className="text-xs">Car</Label>
                    <Input
                      id="carFilter"
                      value={carFilter}
                      onChange={(e) => setCarFilter(e.target.value)}
                      placeholder="Make, model, plate..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="clientFilter" className="text-xs">Client</Label>
                    <Input
                      id="clientFilter"
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      placeholder="Name..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                   <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="startDateFilter" className="text-xs">Start Date</Label>
                    <Input
                      id="startDateFilter"
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="col-span-2 h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="endDateFilter" className="text-xs">End Date</Label>
                    <Input
                      id="endDateFilter"
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="col-span-2 h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
                    <X className="mr-1 h-3 w-3" /> Clear
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleAddReservation}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reservation
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredReservations} // Use filtered data
        columns={columns}
        // No searchKey needed here as we are handling filtering outside
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