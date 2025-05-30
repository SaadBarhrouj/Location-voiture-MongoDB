import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  getReservations,
  updateReservation,
} from "@/lib/api/reservation-service";
import { cn } from "@/lib/utils";
import { differenceInDays, format, isPast, isValid, parseISO, startOfToday } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
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

  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [unavailablePeriodsForSelectedCar, setUnavailablePeriodsForSelectedCar] = useState<{ from: Date; to: Date }[]>([]);
  const [isLoadingCarAvailability, setIsLoadingCarAvailability] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>();

  const fetchBaseData = async () => {
    if (open) {
      setIsLoadingData(true);
      try {
        const [carsData, clientsData] = await Promise.all([
          getCars(),
          getClients(),
        ]);

        setCars(carsData.filter(c => c.status === 'available' || (mode === 'edit' && c.id === reservation?.carId) || c.status === 'rented'));
        setClients(clientsData);

      } catch (error) {
        console.error("Error loading base data:", error);
        toast.error("Failed to load cars or clients.");
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  const fetchReservationAvailabilities = async () => {
    if (open && (mode === 'add' || mode === 'edit')) {
      setIsLoadingCarAvailability(true);
      try {
        const reservationsData = await getReservations();
        setAllReservations(reservationsData);
      } catch (error) {
        console.error("Error loading reservation availabilities:", error);
        toast.error("Failed to load reservation availabilities.");
      } finally {
        setIsLoadingCarAvailability(false);
      }
    }
  };

  useEffect(() => {
    fetchBaseData();
    fetchReservationAvailabilities();
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
      if (reservation.startDate && reservation.endDate) {
        const from = parseISO(reservation.startDate);
        const to = parseISO(reservation.endDate);
        if (isValid(from) && isValid(to)) {
          setSelectedDateRange({ from, to });
        }
      }
    } else {
      setFormData(initialFormData);
      setSelectedDateRange(undefined);
    }
  }, [mode, reservation, open]);

  useEffect(() => {
    if (formData.carId && allReservations.length > 0) {
      const carReservations = allReservations.filter(
        (res) => res.carId === formData.carId && 
                 res.id !== reservation?.id &&
                 ["confirmed", "active"].includes(res.status)
      );

      const periods = carReservations.reduce((acc, res) => {
        const start = parseISO(res.startDate);
        const end = parseISO(res.endDate);
        if (isValid(start) && isValid(end)) {
          acc.push({ from: start, to: end });
        }
        return acc;
      }, [] as { from: Date; to: Date }[]);

      setUnavailablePeriodsForSelectedCar(periods);

      if (mode === 'add') {
        setSelectedDateRange(undefined);
        setFormData(prev => ({ ...prev, startDate: "", endDate: "" }));
      }

    } else if (!formData.carId) {
      setUnavailablePeriodsForSelectedCar([]);
      if (mode === 'add') {
        setSelectedDateRange(undefined);
      }
    }
  }, [formData.carId, allReservations, mode, reservation?.id]);

  useEffect(() => {
    if (formData.carId && formData.startDate && formData.endDate) {
      const selectedCar = cars.find(c => c.id === formData.carId);
      if (selectedCar && selectedCar.dailyRate) {
        try {
          const start = parseISO(formData.startDate);
          const end = parseISO(formData.endDate);
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
    } else {
      setFormData(prev => ({ ...prev, estimatedTotalCost: "0.00" }));
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

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range || !range.from) {
      setSelectedDateRange(range);
      setFormData(prev => ({
        ...prev,
        startDate: range?.from ? format(range.from, "yyyy-MM-dd") : "",
        endDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
      }));
      return;
    }

    if (range.to && mode === 'add') {
      const hasDisabledDayInRange = unavailablePeriodsForSelectedCar.some(period => {
        const periodStart = period.from;
        const periodEnd = period.to;
        
        return (
          (periodStart >= range.from! && periodStart <= range.to!) ||
          (periodEnd >= range.from! && periodEnd <= range.to!) ||
          (periodStart <= range.from! && periodEnd >= range.to!)
        );
      });

      if (hasDisabledDayInRange) {
        toast.error("The selected date range includes unavailable dates. Please select a different period.");
        return;
      }
    }

    setSelectedDateRange(range);
    setFormData(prev => ({
      ...prev,
      startDate: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      endDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
    }));
  };

  const disabledDays = useMemo(() => {
    let daysToDisable: (Date | { from: Date; to: Date } | { before?: Date } | ((date: Date) => boolean))[] = [
      (date: Date) => {
        const today = startOfToday();
        return date < today;
      }
    ];
    if (mode === 'add') {
      daysToDisable = [...daysToDisable, ...unavailablePeriodsForSelectedCar];
    }
    return daysToDisable;
  }, [unavailablePeriodsForSelectedCar, mode]);

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

    const start = parseISO(formData.startDate);
    const end = parseISO(formData.endDate);

    if (!isValid(start) || !isValid(end)) {
      toast.error("Invalid date format.");
      return false;
    }

    if (end < start) {
      toast.error("End date cannot be before start date.");
      return false;
    }

    if (isPast(start) && !selectedDateRange?.from?.toDateString() === new Date().toDateString() && start.toDateString() !== startOfToday().toDateString()) {
      if (start < startOfToday()) {
        toast.error("Start date cannot be in the past.");
        return false;
      }
    }

    const estimatedCost = parseFloat(formData.estimatedTotalCost);
    if (isNaN(estimatedCost) || (estimatedCost <= 0 && (formData.startDate !== formData.endDate || differenceInDays(end, start) > 0))) {
      if (differenceInDays(end, start) + 1 > 0 && estimatedCost <= 0) {
        toast.error("Estimated total cost must be a positive number for the selected duration.");
        return false;
      }
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
      notes: formData.notes || undefined,
      paymentDetails: {
        amountPaid: parseFloat(formData.paymentAmountPaid) || 0,
        transactionDate: formData.paymentTransactionDate || undefined,
      }
    };
    if (mode === 'edit') {
      (dataToSubmit as ReservationUpdateInput).estimatedTotalCost = parseFloat(formData.estimatedTotalCost);
    }

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
    } catch (error: any) {
      console.error(`Error ${mode === "add" ? "creating" : "updating"} reservation:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${mode === "add" ? "create" : "update"} reservation.`;
      toast.error(errorMessage);
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
              ? "Fill in the reservation details. Select a car to see its availability."
              : "Update the reservation information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
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

            <Label htmlFor="carId">
              Car <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.carId}
              onValueChange={(value) => handleSelectChange("carId", value)}
              disabled={isLoadingData || (mode === 'edit' && isLoading)}
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

          {(mode === 'add' || mode === 'edit') && formData.carId && (
            <div className="space-y-2 rounded-md border p-4 my-2 bg-background reservation-calendar">
              <Label className="font-semibold text-foreground">
                {mode === 'add' ? 'Select Rental Period' : 'View Car Availability'}
              </Label>
              {isLoadingCarAvailability ? (
                <p className="text-sm text-muted-foreground">Loading availability...</p>
              ) : (
                <Calendar
                  mode="range"
                  selected={selectedDateRange}
                  onSelect={mode === 'add' ? handleDateSelect : undefined}
                  disabled={mode === 'add' ? disabledDays : undefined}
                  numberOfMonths={2}
                  className="p-0 [&_td]:p-0"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "flex items-center gap-1",
                    nav_button: cn(
                      buttonVariants({ variant: "outline" }),
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                    ),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative",
                      "[&[aria-disabled='true'][data-past='true']]:bg-muted [&[aria-disabled='true'][data-past='true']]:text-muted-foreground [&[aria-disabled='true'][data-past='true']]:opacity-60 [&[aria-disabled='true'][data-past='true']]:cursor-not-allowed",
                      "[&[aria-disabled='true']:not([data-past='true'])]:bg-destructive/10 [&[aria-disabled='true']:not([data-past='true'])]:text-destructive [&[aria-disabled='true']:not([data-past='true'])]:line-through [&[aria-disabled='true']:not([data-past='true'])]:opacity-75 [&[aria-disabled='true']:not([data-past='true'])]:border [&[aria-disabled='true']:not([data-past='true'])]:border-destructive/20"
                    ),
                    day_disabled: "",
                    day_today: cn(
                      "bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300",
                      "hover:bg-blue-200"
                    ),
                    day_selected: "cal-day-selected",
                    day_range_start: "cal-day-range-start",
                    day_range_middle: "cal-day-range-middle",
                    day_range_end: "cal-day-range-end",
                    day_outside: cn(
                      "text-muted-foreground/30 opacity-30 cursor-not-allowed",
                      "hover:text-muted-foreground/40"
                    ),
                  }}
                  modifiers={{
                    past: (date: Date) => date < startOfToday(),
                    reserved: unavailablePeriodsForSelectedCar,
                  }}
                  modifiersStyles={{
                    past: {
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      opacity: 0.6,
                    },
                    reserved: {
                      backgroundColor: 'hsl(var(--destructive) / 0.1)',
                      color: 'hsl(var(--destructive))',
                      textDecoration: 'line-through',
                      border: '1px solid hsl(var(--destructive) / 0.2)',
                    },
                  }}
                />
              )}
            </div>
          )}

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
                readOnly={mode === 'add'}
                className={mode === 'add' ? "bg-muted cursor-not-allowed" : ""}
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
                readOnly={mode === 'add'}
                className={mode === 'add' ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedTotalCost">Estimated Total Cost (MAD)</Label>
            <Input
              id="estimatedTotalCost"
              value={formData.estimatedTotalCost}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmountPaid">Amount Paid (MAD)</Label>
              <Input
                id="paymentAmountPaid"
                name="paymentAmountPaid"
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
                name="paymentTransactionDate"
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
              name="notes"
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
            <Button type="submit" disabled={isLoading || isLoadingData || (mode === 'add' && isLoadingCarAvailability)}>
              {isLoading ? (mode === "add" ? "Creating..." : "Saving...") : (mode === "add" ? "Create Reservation" : "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
