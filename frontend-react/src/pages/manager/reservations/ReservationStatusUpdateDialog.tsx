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
import {
  type Reservation,
  type ReservationStatus,
  type ReservationStatusUpdateInput,
  updateReservationStatus,
} from "@/lib/api/reservation-service";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatStatus } from "./ReservationsPage";

interface ReservationStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  onSubmitSuccess: (updatedReservation: Reservation) => void;
}

const availableStatuses: ReservationStatus[] = [
  "pending_confirmation",
  "confirmed",
  "active",
  "completed",
  "cancelled_by_client",
  "cancelled_by_agency",
  "no_show",
];

export function ReservationStatusUpdateDialog({
  open,
  onOpenChange,
  reservation,
  onSubmitSuccess,
}: ReservationStatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatus | "">("");
  const [finalCost, setFinalCost] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reservation) {
      setSelectedStatus(reservation.status);
      setFinalCost(
        reservation.finalTotalCost?.toFixed(2) || 
        reservation.estimatedTotalCost.toFixed(2)
      );
    } else {
      setSelectedStatus("");
      setFinalCost("");
    }
  }, [reservation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation || !selectedStatus) {
      toast.error("Please select a status.");
      return;
    }

    setIsLoading(true);

    const statusUpdateData: ReservationStatusUpdateInput = {
      status: selectedStatus,
    };

    if (selectedStatus === "completed") {
      const cost = parseFloat(finalCost);
      if (isNaN(cost) || cost < 0) {
        toast.error("Final cost must be a valid non-negative number for completed reservations.");
        setIsLoading(false);
        return;
      }
      statusUpdateData.finalTotalCost = cost;
    }

    try {
      const updatedReservation = await updateReservationStatus(reservation.id, statusUpdateData);
      toast.success(`Reservation status updated to ${formatStatus(selectedStatus)}.`);
      onSubmitSuccess(updatedReservation);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating reservation status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Reservation Status</DialogTitle>
          <DialogDescription>
            For reservation <span className="font-mono text-sm">{reservation.reservationNumber}</span>.
            Current status: <span className="font-semibold">{formatStatus(reservation.status)}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">
              New Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ReservationStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus === "completed" && (
            <div className="space-y-2">
              <Label htmlFor="finalCost">
                Final Total Cost (MAD) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="finalCost"
                type="number"
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                step="0.01"
                min="0"
                required
                className="placeholder:text-muted-foreground/60"
                placeholder="e.g. 1250.00"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
