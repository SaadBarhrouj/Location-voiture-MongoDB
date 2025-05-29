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
import { type Car } from "@/lib/api/car-service";
import { format } from 'date-fns';

interface CarDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
}

export function CarDetails({ open, onOpenChange, car }: CarDetailsProps) {
  if (!car) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPPpp");
    } catch {
      return dateString;
    }
  };

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    rented: "bg-blue-100 text-blue-800",
    maintenance: "bg-yellow-100 text-yellow-800",
  };

  const getColorDisplay = (color?: string) => {
    if (!color) return "N/A";
    
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
          className={`w-4 h-4 rounded-full ${colorMap[color.toLowerCase()] || "bg-gray-300"}`}
        />
        <span>{color}</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Car Details</DialogTitle>
          <DialogDescription>
            Viewing details for {car.make} {car.model}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {car.imageUrl && (
            <div className="mb-4">
              <img
                src={`${API_URL}${car.imageUrl}`}
                alt={`${car.make} ${car.model}`}
                className="w-full h-auto max-h-64 object-contain rounded"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="font-semibold">Make:</div>
            <div>{car.make}</div>
            <div className="font-semibold">Model:</div>
            <div>{car.model}</div>
            <div className="font-semibold">Year:</div>
            <div>{car.year}</div>
            <div className="font-semibold">License Plate:</div>
            <div>{car.licensePlate}</div>
            <div className="font-semibold">VIN:</div>
            <div>{car.vin}</div>
            <div className="font-semibold">Color:</div>
            <div>{getColorDisplay(car.color)}</div>
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
            <div>{car.dailyRate ? car.dailyRate.toFixed(2) + " MAD" : "N/A"}</div>
            <div className="font-semibold">Added At:</div>
            <div>{formatDate(car.addedAt)}</div>
            {car.updatedAt && (
              <>
                <div className="font-semibold">Last Updated At:</div>
                <div>{formatDate(car.updatedAt)}</div>
              </>
            )}
          </div>
          {car.description && (
            <div className="mt-4">
              <div className="font-semibold">Description:</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{car.description}</p>
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
