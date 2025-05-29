import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { API_URL } from "@/lib/api-client";
import {
  type Car,
  deleteCar,
  getCars,
} from "@/lib/api/car-service";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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

  const fetchCars = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCars();
      setCars(data);
    } catch (err) {
      console.error("Error fetching cars:", err);
      setError("Failed to load cars.");
      toast.error("Failed to load cars.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

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
      header: "VIN",
      accessorKey: "vin" as keyof Car,
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
            <span className="capitalize">{car.color}</span>
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
    toast.info("Deleting car...");

    try {
      await deleteCar(currentCar.id);
      toast.success("Car deleted successfully.");
    } catch (err) {
      console.error("Error deleting car:", err);
      toast.error("Failed to delete car.");
      setCars(originalCars);
    } finally {
      setCurrentCar(null);
    }
  };

  const handleFormSubmit = (updatedOrNewCar: Car) => {
    if (formMode === "add") {
      setCars((prevCars) => [...prevCars, updatedOrNewCar]);
    } else {
      setCars((prevCars) =>
        prevCars.map((c) => (c.id === updatedOrNewCar.id ? updatedOrNewCar : c))
      );
    }
    setIsFormOpen(false);
  };

  const handleDeleteCar = (car: Car) => {
    setCurrentCar(car);
    setIsDeleteDialogOpen(true);
  };

  if (error && !isLoading) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Cars</h1>
        <Button onClick={handleAddCar}>
          <Plus className="mr-2 h-4 w-4" />
          Add Car
        </Button>
      </div>

      <DataTable
        data={cars}
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
