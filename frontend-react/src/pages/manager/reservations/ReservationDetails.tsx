import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { API_URL } from "@/lib/api-client";
import { type Reservation } from "@/lib/api/reservation-service";
import { format } from "date-fns";
import { Calendar, Car, Clock, DollarSign, FileText, User } from "lucide-react";
import { formatStatus, getStatusColor } from "./ReservationsPage";

interface ReservationDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
}

export function ReservationDetails({
  open,
  onOpenChange,
  reservation,
}: ReservationDetailsProps) {
  if (!reservation) return null;

  const formatDate = (dateString?: string | null, includeTime = false) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), includeTime ? "PPpp" : "PP");
    } catch {
      return dateString;
    }
  };

  const DetailRow = ({ 
    icon: Icon, 
    label, 
    value 
  }: { 
    icon: any, 
    label: string, 
    value: string | React.ReactNode 
  }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );

  const car = reservation.carDetails;
  const client = reservation.clientDetails;
  const payment = reservation.paymentDetails;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservation Details</DialogTitle>
          <DialogDescription>
            Complete information for reservation {reservation.reservationNumber}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Header avec statut */}
          <div className="flex justify-between items-center pb-4 border-b">
            <h3 className="text-lg font-semibold">
              Reservation {reservation.reservationNumber}
            </h3>
            <Badge variant="outline" className={`${getStatusColor(reservation.status)} text-base px-3 py-1`}>
              {formatStatus(reservation.status)}
            </Badge>
          </div>

          {/* Section Voiture */}
          {car && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Car Information
              </h4>
              {car.imageUrl && (
                <div className="mb-3">
                  <img 
                    src={`${API_URL}${car.imageUrl}`} 
                    alt={`${car.make} ${car.model}`} 
                    className="rounded-md max-h-40 object-contain mx-auto" 
                  />
                </div>
              )}
              <DetailRow
                icon={Car}
                label="Make & Model"
                value={`${car.make} ${car.model}`}
              />
              <DetailRow
                icon={Car}
                label="License Plate"
                value={car.licensePlate}
              />
              {car.vin && (
                <DetailRow
                  icon={Car}
                  label="VIN"
                  value={car.vin}
                />
              )}
            </div>
          )}

          {/* Section Client */}
          {client && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Client Information
              </h4>
              <DetailRow
                icon={User}
                label="Name"
                value={`${client.firstName} ${client.lastName}`}
              />
              {client.phone && (
                <DetailRow
                  icon={User}
                  label="Phone"
                  value={client.phone}
                />
              )}
              {client.email && (
                <DetailRow
                  icon={User}
                  label="Email"
                  value={client.email}
                />
              )}
            </div>
          )}

          {/* Section Dates */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Rental Period
            </h4>
            <DetailRow
              icon={Calendar}
              label="Start Date"
              value={formatDate(reservation.startDate)}
            />
            <DetailRow
              icon={Calendar}
              label="End Date"
              value={formatDate(reservation.endDate)}
            />
            {reservation.actualPickupDate && (
              <DetailRow
                icon={Clock}
                label="Actual Pickup"
                value={formatDate(reservation.actualPickupDate, true)}
              />
            )}
            {reservation.actualReturnDate && (
              <DetailRow
                icon={Clock}
                label="Actual Return"
                value={formatDate(reservation.actualReturnDate, true)}
              />
            )}
          </div>

          {/* Section Coûts */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Cost Information
            </h4>
            <DetailRow
              icon={DollarSign}
              label="Estimated Cost"
              value={`${reservation.estimatedTotalCost.toFixed(2)} MAD`}
            />
            {reservation.finalTotalCost !== null && reservation.finalTotalCost !== undefined && (
              <DetailRow
                icon={DollarSign}
                label="Final Cost"
                value={`${reservation.finalTotalCost.toFixed(2)} MAD`}
              />
            )}
          </div>

          {/* Section Paiement */}
          {payment && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Payment Details
              </h4>
              <DetailRow
                icon={DollarSign}
                label="Amount Paid"
                value={`${payment.amountPaid.toFixed(2)} MAD`}
              />
              <DetailRow
                icon={DollarSign}
                label="Remaining Balance"
                value={`${payment.remainingBalance.toFixed(2)} MAD`}
              />
              {payment.transactionDate && (
                <DetailRow
                  icon={Calendar}
                  label="Payment Date"
                  value={formatDate(payment.transactionDate)}
                />
              )}
            </div>
          )}

          {/* Section Notes */}
          {reservation.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Notes
              </h4>
              <DetailRow
                icon={FileText}
                label="Additional Notes"
                value={
                  <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                    {reservation.notes}
                  </div>
                }
              />
            </div>
          )}

          {/* Section Audit */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Audit Information
            </h4>
            <DetailRow
              icon={Calendar}
              label="Reserved On"
              value={formatDate(reservation.reservationDate, true)}
            />
            <DetailRow
              icon={Calendar}
              label="Last Modified"
              value={formatDate(reservation.lastModifiedAt, true)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
