import { CarDetails } from "./CarDetails";
import { CarForm } from "./CarForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  type Car,
  getCars,
  simulateGetCars, // Utiliser la vraie fonction API
  deleteCar, // Utiliser la vraie fonction API
} from "@/lib/api/car-service"; // Mettre à jour l'import
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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
    // Renommer pour la clarté
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCars(); // Utiliser la vraie fonction API
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
      header: "Make",
      accessorKey: "make" as keyof Car, // Ajoutez "as keyof Car"
    },
    {
      header: "Model",
      accessorKey: "model" as keyof Car, // Ajoutez "as keyof Car"
    },
    {
      header: "Year",
      accessorKey: "year" as keyof Car, // Ajoutez "as keyof Car"
    },
    {
      header: "License Plate",
      accessorKey: "licensePlate" as keyof Car, // Ajoutez "as keyof Car"
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Car,
      cell: (car: Car) => { // Accepter 'car: Car' directement
        // Vérifier si 'car' et 'car.status' sont valides
        if (!car || typeof car.status === 'undefined') {
          console.error("Invalid car data for Status cell:", car);
          return <span className="text-red-500">Error</span>;
        }
        const statusColors: Record<string, string> = {
          available: "bg-green-100 text-green-800",
          rented: "bg-blue-100 text-blue-800",
          maintenance: "bg-yellow-100 text-yellow-800",
        };
        return (
          <Badge
            className={statusColors[car.status] || "bg-gray-100 text-gray-800"}
            variant="outline"
          >
            {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: "Daily Rate",
      accessorKey: "dailyRate" as keyof Car,
      cell: (car: Car) => { // Accepter 'car: Car' directement
        // Vérifier si 'car' et 'car.dailyRate' sont valides
        if (!car || typeof car.dailyRate !== 'number') {
           console.error("Invalid car data for Daily Rate cell:", car);
           return <span className="text-red-500">Error</span>;
        }
        // Utiliser 'car' directement
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

    // Optionnel: Mettre isLoading à true ici si vous voulez un indicateur sur le bouton de confirmation
    // setIsLoading(true); // Décommenter si nécessaire

    const originalCars = [...cars]; // Sauvegarder l'état actuel pour rollback
    // Optimistic UI update: Remove car from list immediately
    setCars(cars.filter((c) => c.id !== currentCar.id));
    toast.info("Deleting car..."); // Donner un feedback immédiat

    try {
      await deleteCar(currentCar.id); // Utiliser la vraie fonction API
      toast.success("Car deleted successfully.");
      // Pas besoin de refetch ici si l'update optimiste suffit
      // fetchCars(); // Ou refetch pour être sûr que la liste est synchronisée
    } catch (err) {
      console.error("Error deleting car:", err);
      toast.error("Failed to delete car.");
      setCars(originalCars); // Rollback en cas d'erreur
    } finally {
      // setIsLoading(false); // Décommenter si isLoading a été mis à true
      setCurrentCar(null); // Réinitialiser la voiture courante
    }
  };

  // Gère la mise à jour de la liste après ajout/modification via CarForm
  const handleFormSubmit = (updatedOrNewCar: Car) => {
    if (formMode === "add") {
      setCars([...cars, updatedOrNewCar]); // Ajouter la nouvelle voiture à la liste
    } else {
      // Mettre à jour la voiture existante dans la liste
      setCars(
        cars.map((c) => (c.id === updatedOrNewCar.id ? updatedOrNewCar : c))
      );
    }
    setIsFormOpen(false); // Fermer le formulaire
    // Pas besoin de fetchCars() ici car on met à jour l'état localement
  };

  const handleDeleteCar = (car: Car) => {
    setCurrentCar(car);
    setIsDeleteDialogOpen(true); // Ouvrir le dialogue
  };

  if (error && !isLoading) {
    // Afficher l'erreur seulement si le chargement est terminé
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

      {/* Le formulaire est maintenant contrôlé par son propre état interne + props */}
      <CarForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        car={currentCar}
        onSubmitSuccess={handleFormSubmit} // Passer la fonction de callback
      />

      {/* Les détails sont affichés via ce composant */}
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
        onConfirm={confirmDelete} // Appelle la fonction confirmDelete
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
