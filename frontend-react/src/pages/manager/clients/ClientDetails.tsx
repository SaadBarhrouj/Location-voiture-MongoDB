import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { type Client } from "@/lib/api/client-service";
import { format } from "date-fns";
import { Calendar, CreditCard, FileText, Mail, Phone, User } from "lucide-react";

interface ClientDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ClientDetails({ open, onOpenChange, client }: ClientDetailsProps) {
  if (!client) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPPpp");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
          <DialogDescription>
            Complete information for {client.firstName} {client.lastName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Header avec nom */}
          <div className="text-center pb-4 border-b">
            <h3 className="text-lg font-semibold">
              {client.firstName} {client.lastName}
            </h3>
          </div>

          {/* Informations de contact */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h4>
            <DetailRow
              icon={Phone}
              label="Phone Number"
              value={client.phone}
            />
            <DetailRow
              icon={Mail}
              label="Email Address"
              value={client.email || <span className="text-muted-foreground">Not provided</span>}
            />
          </div>

          {/* Informations d'identification */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Identification
            </h4>
            <DetailRow
              icon={CreditCard}
              label="CIN (ID Card)"
              value={client.CIN}
            />
            <DetailRow
              icon={User}
              label="Driver License"
              value={client.driverLicenseNumber || <span className="text-muted-foreground">Not provided</span>}
            />
          </div>

          {/* Dates importantes */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Registration
            </h4>
            <DetailRow
              icon={Calendar}
              label="Registered At"
              value={formatDate(client.registeredAt)}
            />
            {client.updatedAt && (
              <DetailRow
                icon={Calendar}
                label="Last Updated"
                value={formatDate(client.updatedAt)}
              />
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Notes
              </h4>
              <DetailRow
                icon={FileText}
                label="Additional Notes"
                value={
                  <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                    {client.notes}
                  </div>
                }
              />
            </div>
          )}
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
