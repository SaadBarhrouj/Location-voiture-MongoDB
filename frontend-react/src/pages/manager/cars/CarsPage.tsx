import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added Select for status filter
import { API_URL } from "@/lib/api-client";
import {
  type Car,
  deleteCar,
  getCars,
} from "@/lib/api/car-service";
import { Filter, Plus, X } from "lucide-react"; // Added Filter and X icons
import { useEffect, useMemo, useState } from "react"; // Added useMemo
import { toast } from "sonner";
import { CarDetails } from "./CarDetails";
import { CarForm } from "./CarForm";

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // State for filters
  const [makeFilter, setMakeFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [licensePlateFilter, setLicensePlateFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Car["status"] | "all">("all"); // 'all' or specific status
  const [colorFilter, setColorFilter] = useState("");
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false);

  const carStatuses: Array<Car["status"] | "all"> = ["all", "available", "rented", "maintenance"];


  const fetchCars = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCars();
      setCars(data);
    } catch (err) {
      console.error("Error fetching cars:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load cars.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const statusMatch = statusFilter === "all" || car.status === statusFilter;
      return (
        car.make.toLowerCase().includes(makeFilter.toLowerCase()) &&
        car.model.toLowerCase().includes(modelFilter.toLowerCase()) &&
        car.licensePlate.toLowerCase().includes(licensePlateFilter.toLowerCase()) &&
        car.vin.toLowerCase().includes(vinFilter.toLowerCase()) &&
        statusMatch &&
        (car.color || "").toLowerCase().includes(colorFilter.toLowerCase())
      );
    });
  }, [cars, makeFilter, modelFilter, licensePlateFilter, vinFilter, statusFilter, colorFilter]);

  const handleClearFilters = () => {
    setMakeFilter("");
    setModelFilter("");
    setLicensePlateFilter("");
    setVinFilter("");
    setStatusFilter("all");
    setColorFilter("");
    setIsFiltersPopoverOpen(false); // Optionally close popover on clear
  };

  const getStatusColor = (status: Car["status"]): string => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 border-green-300";
      case "rented": return "bg-blue-100 text-blue-800 border-blue-300";
      case "maintenance": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "out_of_service": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatCarStatus = (status: Car["status"]): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };



  const activeFilterCount = [
    makeFilter,
    modelFilter,
    licensePlateFilter,
    vinFilter,
    statusFilter !== "all" ? statusFilter : "", // Count status only if not 'all'
    colorFilter,
  ].filter(Boolean).length;

  const columns = [
    {
      header: "Image",
      accessorKey: "imageUrl" as keyof Car,
      cell: (car: Car) => {
        return car.imageUrl ? (
          <img
            src={`${API_URL}${car.imageUrl}`}
            alt={`${car.make} ${car.model}`}
            className="h-10 w-16 object-cover rounded"
          />
        ) : (
          <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Image</div>
        );
      },
    },
    {
      header: "Make",
      accessorKey: "make" as keyof Car,
    },
    {
      header: "Model",
      accessorKey: "model" as keyof Car,
    },
    {
      header: "Year",
      accessorKey: "year" as keyof Car,
    },
    {
      header: "License Plate",
      accessorKey: "licensePlate" as keyof Car,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Car,
      cell: (car: Car) => (
        <Badge variant="outline" className={`${getStatusColor(car.status)} whitespace-nowrap`}>
          {formatCarStatus(car.status)}
        </Badge>
      ),
    },
    {
      header: "Color",
      accessorKey: "color" as keyof Car,
      cell: (car: Car) => {
        if (!car.color) return <span className="text-gray-500">N/A</span>;
        
        const colorMap: Record<string, string> = {
          black: "bg-black",
          white: "bg-white border border-gray-300",
          gray: "bg-gray-500",
          silver: "bg-gray-300",
          red: "bg-red-500",
          blue: "bg-blue-500",
          green: "bg-green-500",
          yellow: "bg-yellow-400",
          orange: "bg-orange-500",
          brown: "bg-amber-800",
          beige: "bg-amber-200",
          gold: "bg-yellow-600",
        };

        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${colorMap[car.color.toLowerCase()] || "bg-gray-300"}`}
            />
            <span>{car.color}</span>
          </div>
        );
      },
    },
    
    {
      header: "Daily Rate",
      accessorKey: "dailyRate" as keyof Car,
      cell: (car: Car) => {
        if (!car || typeof car.dailyRate !== 'number') {
           console.error("Invalid car data for Daily Rate cell:", car);
           return <span className="text-red-500">Error</span>;
        }
        return `${car.dailyRate.toFixed(2)} MAD`;
      },
    },
  ];

  const handleAddCar = () => {
    setFormMode("add");
    setCurrentCar(null);
    setIsFormOpen(true);
  };

  const handleEditCar = (car: Car) => {
    setFormMode("edit");
    setCurrentCar(car);
    setIsFormOpen(true);
  };

  const handleViewCar = (car: Car) => {
    setCurrentCar(car);
    setIsDetailsOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCar) return;

    const originalCars = [...cars];
    setCars(cars.filter((c) => c.id !== currentCar.id));
    // toast.info("Deleting car..."); // Removed for consistency with client delete

    try {
      await deleteCar(currentCar.id);
      toast.success(`Car '${currentCar.make} ${currentCar.model}' deleted successfully.`);
    } catch (err) {
      console.error("Error deleting car:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete car.";
      toast.error(errorMessage);
      setCars(originalCars);
    } finally {
      setCurrentCar(null);
      setIsDeleteDialogOpen(false); // Close dialog in finally
    }
  };

  const handleFormSubmit = (updatedOrNewCar: Car) => {
    // Refetch to ensure data consistency, especially for new IDs or if backend modifies data
    fetchCars();
    setIsFormOpen(false);
  };

  const handleDeleteCar = (car: Car) => {
    setCurrentCar(car);
    setIsDeleteDialogOpen(true);
  };

  if (error && !isLoading && cars.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <Button onClick={fetchCars}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Cars</h1>
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
            <PopoverContent className="w-96" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter Cars</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply filters to narrow down the car list.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="makeFilter" className="text-xs">Make</Label>
                    <Input
                      id="makeFilter"
                      value={makeFilter}
                      onChange={(e) => setMakeFilter(e.target.value)}
                      placeholder="Filter by make..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="modelFilter" className="text-xs">Model</Label>
                    <Input
                      id="modelFilter"
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                      placeholder="Filter by model..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="licensePlateFilter" className="text-xs">License Plate</Label>
                    <Input
                      id="licensePlateFilter"
                      value={licensePlateFilter}
                      onChange={(e) => setLicensePlateFilter(e.target.value)}
                      placeholder="Filter by license plate..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="vinFilter" className="text-xs">VIN</Label>
                    <Input
                      id="vinFilter"
                      value={vinFilter}
                      onChange={(e) => setVinFilter(e.target.value)}
                      placeholder="Filter by VIN..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="colorFilter" className="text-xs">Color</Label>
                    <Input
                      id="colorFilter"
                      value={colorFilter}
                      onChange={(e) => setColorFilter(e.target.value)}
                      placeholder="Filter by color..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
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

          <Button onClick={handleAddCar}>
            <Plus className="mr-2 h-4 w-4" />
            Add Car
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredCars} // Use filtered data
        columns={columns}
        onEdit={handleEditCar}
        onDelete={handleDeleteCar}
        onView={handleViewCar}
      />

      <CarForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        car={currentCar}
        onSubmitSuccess={handleFormSubmit}
      />

      <CarDetails
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        car={currentCar}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Car"
        description={`Are you sure you want to delete the car ${currentCar?.make} ${currentCar?.model}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}