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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

interface FormData {
  status: ReservationStatus | "";
  finalTotalCost: string;
  additionalCharges: string;
  amountPaid: string;
  transactionDate: string;
  remainingBalance: string;
  completionNotes: string;
  actualReturnTime: string;
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
  const [formData, setFormData] = useState<FormData>({
    status: "",
    finalTotalCost: "",
    additionalCharges: "0.00",
    amountPaid: "",
    transactionDate: "",
    remainingBalance: "",
    completionNotes: "",
    actualReturnTime: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reservation) {
      const now = new Date();
      const currentDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setFormData({
        status: reservation.status,
        finalTotalCost: reservation.finalTotalCost?.toFixed(2) || reservation.estimatedTotalCost.toFixed(2),
        additionalCharges: "0.00",
        amountPaid: reservation.paymentDetails?.amountPaid?.toFixed(2) || "0.00",
        transactionDate: reservation.paymentDetails?.transactionDate || "",
        remainingBalance: reservation.paymentDetails?.remainingBalance?.toFixed(2) || "0.00",
        completionNotes: reservation.notes || "",
        actualReturnTime: currentDateTime,
      });
    } else {
      setFormData({
        status: "",
        finalTotalCost: "",
        additionalCharges: "0.00",
        amountPaid: "",
        transactionDate: "",
        remainingBalance: "",
        completionNotes: "",
        actualReturnTime: "",
      });
    }
  }, [reservation, open]);

  // Recalculer le coût final et le solde restant automatiquement
  useEffect(() => {
    if (reservation && formData.status === "completed") {
      const baseAmount = reservation.estimatedTotalCost;
      const additional = parseFloat(formData.additionalCharges) || 0;
      const totalFinal = baseAmount + additional;
      
      const paid = parseFloat(formData.amountPaid) || 0;
      const remaining = totalFinal - paid;
      
      setFormData(prev => ({ 
        ...prev, 
        finalTotalCost: totalFinal.toFixed(2),
        remainingBalance: remaining.toFixed(2)
      }));
    }
  }, [formData.additionalCharges, formData.amountPaid, reservation]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.status) {
      toast.error("Please select a status.");
      return false;
    }

    if (formData.status === "completed") {
      const finalCost = parseFloat(formData.finalTotalCost);
      if (isNaN(finalCost) || finalCost < 0) {
        toast.error("Final cost must be a valid non-negative number.");
        return false;
      }

      if (!formData.actualReturnTime) {
        toast.error("Please specify the actual return date and time.");
        return false;
      }

      const additionalCharges = parseFloat(formData.additionalCharges);
      if (isNaN(additionalCharges) || additionalCharges < 0) {
        toast.error("Additional charges must be a valid non-negative number.");
        return false;
      }

      const amountPaid = parseFloat(formData.amountPaid);
      if (isNaN(amountPaid) || amountPaid < 0) {
        toast.error("Amount paid must be a valid non-negative number.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation || !validateForm()) return;

    setIsLoading(true);

    const statusUpdateData: ReservationStatusUpdateInput = {
      status: formData.status as ReservationStatus,
    };

    if (formData.status === "completed") {
      statusUpdateData.finalTotalCost = parseFloat(formData.finalTotalCost);
    }

    try {
      const updatedReservation = await updateReservationStatus(reservation.id, statusUpdateData);
      toast.success(`Reservation status updated to ${formatStatus(formData.status as ReservationStatus)}.`);
      onSubmitSuccess(updatedReservation);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating reservation status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) return null;

  const isCompleted = formData.status === "completed";
  const hasAdditionalCharges = parseFloat(formData.additionalCharges) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Reservation Status</DialogTitle>
          <DialogDescription>
            For reservation <span className="font-mono text-sm">{reservation.reservationNumber}</span>.
            Current status: <span className="font-semibold">{formatStatus(reservation.status)}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">
              New Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
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

          {/* Completion Details - Only show when status is completed */}
          {isCompleted && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Completion Details</h4>
                
                {/* Return Date & Time */}
                <div className="space-y-2">
                  <Label htmlFor="actualReturnTime">
                    Actual Return Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="actualReturnTime"
                    type="datetime-local"
                    value={formData.actualReturnTime}
                    onChange={(e) => handleInputChange("actualReturnTime", e.target.value)}
                    required
                  />
                </div>

                {/* Cost Section */}
                <div className="space-y-3">
                  <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Cost Details
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="additionalCharges">Additional Charges (MAD)</Label>
                      <Input
                        id="additionalCharges"
                        type="number"
                        value={formData.additionalCharges}
                        onChange={(e) => handleInputChange("additionalCharges", e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Fuel, damage, extra days, etc.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="finalTotalCost">
                        Final Total Cost (MAD) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="finalTotalCost"
                        type="number"
                        value={formData.finalTotalCost}
                        onChange={(e) => handleInputChange("finalTotalCost", e.target.value)}
                        step="0.01"
                        min="0"
                        required
                        className="font-semibold"
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">
                        Base: {reservation.estimatedTotalCost.toFixed(2)} MAD
                        {hasAdditionalCharges && " + additional charges"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <Separator />
                <div className="space-y-3">
                  <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Payment Information
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amountPaid">Total Amount Paid (MAD)</Label>
                      <Input
                        id="amountPaid"
                        type="number"
                        value={formData.amountPaid}
                        onChange={(e) => handleInputChange("amountPaid", e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="remainingBalance">Remaining Balance (MAD)</Label>
                      <Input
                        id="remainingBalance"
                        type="number"
                        value={formData.remainingBalance}
                        readOnly
                        className="bg-gray-100 font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">Last Payment Date</Label>
                    <Input
                      id="transactionDate"
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => handleInputChange("transactionDate", e.target.value)}
                    />
                  </div>
                </div>

                {/* Completion Notes */}
                <div className="space-y-2">
                  <Label htmlFor="completionNotes">Completion Notes</Label>
                  <Textarea
                    id="completionNotes"
                    value={formData.completionNotes}
                    onChange={(e) => handleInputChange("completionNotes", e.target.value)}
                    placeholder="Vehicle condition, any issues, customer feedback, etc..."
                    rows={3}
                    className="placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            </>
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
