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
import { type Car } from "@/lib/api/car-service";

interface CarDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
}

export function CarDetails({ open, onOpenChange, car }: CarDetailsProps) {
  if (!car) return null;

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    rented: "bg-blue-100 text-blue-800",
    maintenance: "bg-yellow-100 text-yellow-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Car Details</DialogTitle>
          <DialogDescription>
            Viewing details for {car.make} {car.model}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="font-semibold">Make:</div>
            <div>{car.make}</div>
            <div className="font-semibold">Model:</div>
            <div>{car.model}</div>
            <div className="font-semibold">Year:</div>
            <div>{car.year}</div>
            <div className="font-semibold">License Plate:</div>
            <div>{car.licensePlate}</div>
            <div className="font-semibold">Status:</div>
            <div>
              <Badge
                className={statusColors[car.status] || "bg-gray-100 text-gray-800"}
                variant="outline"
              >
                {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
              </Badge>
            </div>
            <div className="font-semibold">Daily Rate:</div>
            <div>{car.dailyRate.toFixed(2)} MAD</div>
          </div>
          {car.description && (
            <div>
              <div className="font-semibold">Description:</div>
              <p>{car.description}</p>
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
