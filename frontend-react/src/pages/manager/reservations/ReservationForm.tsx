import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Car, getCars } from "@/lib/api/car-service";
import { type Client, getClients } from "@/lib/api/client-service";
import {
  type Reservation,
  type ReservationCreateInput,
  type ReservationUpdateInput,
  createReservation,
  updateReservation,
} from "@/lib/api/reservation-service";
import { differenceInDays, isValid } from "date-fns";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  reservation: Reservation | null;
  onSubmitSuccess: (reservation: Reservation) => void;
}

interface ReservationFormData {
  carId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  estimatedTotalCost: string;
  notes: string;
  paymentAmountPaid: string;
  paymentTransactionDate: string;
}

export function ReservationForm({
  open,
  onOpenChange,
  mode,
  reservation,
  onSubmitSuccess,
}: ReservationFormProps) {
  const initialFormData: ReservationFormData = {
    carId: "",
    clientId: "",
    startDate: "",
    endDate: "",
    estimatedTotalCost: "0.00",
    notes: "",
    paymentAmountPaid: "0.00",
    paymentTransactionDate: "",
  };

  const [formData, setFormData] = useState<ReservationFormData>(initialFormData);
  const [cars, setCars] = useState<Car[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchCarsAndClients = async () => {
    if (open) {
      setIsLoadingData(true);
      try {
        const [carsData, clientsData] = await Promise.all([getCars(), getClients()]);
        setCars(carsData.filter(c => c.status === 'available' || (mode === 'edit' && c.id === reservation?.carId)));
        setClients(clientsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load cars or clients.");
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  useEffect(() => {
    fetchCarsAndClients();
  }, [open, mode, reservation?.carId]);

  useEffect(() => {
    if (mode === "edit" && reservation) {
      setFormData({
        carId: reservation.carId,
        clientId: reservation.clientId,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        estimatedTotalCost: reservation.estimatedTotalCost.toFixed(2),
        notes: reservation.notes || "",
        paymentAmountPaid: reservation.paymentDetails?.amountPaid?.toFixed(2) || "0.00",
        paymentTransactionDate: reservation.paymentDetails?.transactionDate || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [mode, reservation, open]);

  // Calculer le coût estimé automatiquement côté client (pour preview)
  useEffect(() => {
    if (formData.carId && formData.startDate && formData.endDate) {
      const selectedCar = cars.find(c => c.id === formData.carId);
      if (selectedCar && selectedCar.dailyRate) {
        try {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          if (isValid(start) && isValid(end) && end >= start) {
            const days = differenceInDays(end, start) + 1;
            const cost = days * selectedCar.dailyRate;
            setFormData(prev => ({ ...prev, estimatedTotalCost: cost.toFixed(2) }));
          } else {
            setFormData(prev => ({ ...prev, estimatedTotalCost: "0.00" }));
          }
        } catch {
          setFormData(prev => ({ ...prev, estimatedTotalCost: "0.00" }));
        }
      }
    }
  }, [formData.carId, formData.startDate, formData.endDate, cars]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof ReservationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.carId) {
      toast.error("Please select a car.");
      return false;
    }
    if (!formData.clientId) {
      toast.error("Please select a client.");
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select start and end dates.");
      return false;
    }
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      toast.error("End date cannot be before start date.");
      return false;
    }

    const estimatedCost = parseFloat(formData.estimatedTotalCost);
    if (isNaN(estimatedCost) || estimatedCost <= 0) {
      toast.error("Estimated total cost must be a positive number.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    const dataToSubmit: ReservationCreateInput | ReservationUpdateInput = {
      carId: formData.carId,
      clientId: formData.clientId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      // Laisser le backend calculer le coût estimé automatiquement
      // estimatedTotalCost: parseFloat(formData.estimatedTotalCost),
      notes: formData.notes || undefined,
      paymentDetails: {
        amountPaid: parseFloat(formData.paymentAmountPaid) || 0,
        transactionDate: formData.paymentTransactionDate || undefined,
      }
    };

    try {
      let result: Reservation;
      if (mode === "add") {
        result = await createReservation(dataToSubmit as ReservationCreateInput);
        toast.success("Reservation created successfully.");
      } else if (reservation) {
        result = await updateReservation(reservation.id, dataToSubmit as ReservationUpdateInput);
        toast.success("Reservation updated successfully.");
      } else {
        throw new Error("Reservation data is missing for update.");
      }
      onSubmitSuccess(result);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} reservation:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Reservation" : "Edit Reservation"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the reservation details. Cost will be calculated automatically."
              : "Update the reservation information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="carId">
              Car <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.carId}
              onValueChange={(value) => handleSelectChange("carId", value)}
              disabled={isLoadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingData ? "Loading cars..." : "Select a car"} />
              </SelectTrigger>
              <SelectContent>
                {cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.make} {car.model} ({car.licensePlate}) - {car.dailyRate.toFixed(2)} MAD/day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientId">
              Client <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => handleSelectChange("clientId", value)}
              disabled={isLoadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingData ? "Loading clients..." : "Select a client"} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} ({client.CIN})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedTotalCost">Estimated Total Cost (MAD)</Label>
            <Input
              id="estimatedTotalCost"
              value={formData.estimatedTotalCost}
              readOnly
              className="bg-gray-100"
                          />
                      </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmountPaid">Amount Paid (MAD)</Label>
              <Input
                id="paymentAmountPaid"
                type="number"
                value={formData.paymentAmountPaid}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTransactionDate">Payment Date</Label>
              <Input
                id="paymentTransactionDate"
                type="date"
                value={formData.paymentTransactionDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes for the reservation..."
              rows={3}
              className="placeholder:text-muted-foreground/60"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingData}>
              {isLoading ? (mode === "add" ? "Creating..." : "Saving...") : (mode === "add" ? "Create Reservation" : "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
