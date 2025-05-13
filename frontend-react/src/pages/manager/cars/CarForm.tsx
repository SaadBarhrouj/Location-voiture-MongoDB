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
import {
  type Car,
  type CarCreateInput,
  type CarUpdateInput,
  createCar,
  updateCar,
} from "@/lib/api/car-service";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface CarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  car: Car | null;
  onSubmitSuccess: (car: Car) => void;
}

export function CarForm({
  open,
  onOpenChange,
  mode,
  car,
  onSubmitSuccess,
}: CarFormProps) {
  const [formData, setFormData] = useState<CarCreateInput>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    status: "available",
    dailyRate: 0,
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && car) {
      setFormData({
        make: car.make,
        model: car.model,
        year: car.year,
        licensePlate: car.licensePlate,
        status: car.status,
        dailyRate: car.dailyRate,
        description: car.description || "",
      });
    } else {
      setFormData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        licensePlate: "",
        status: "available",
        dailyRate: 0,
        description: "",
      });
    }
  }, [mode, car]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let result: Car;
      if (mode === "add") {
        result = await createCar(formData);
        toast.success("Car added successfully.");
      } else if (car) {
        result = await updateCar({ ...formData, id: car.id });
        toast.success("Car updated successfully.");
      } else {
        throw new Error("Car data is missing for update.");
      }
      onSubmitSuccess(result);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === "add" ? "adding" : "updating"} car:`, error);
      toast.error(`Failed to ${mode === "add" ? "add" : "update"} car.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Car" : "Edit Car"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details of the new car."
              : "Update the details of the selected car."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input id="make" value={formData.make} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={formData.model} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value as Car["status"] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyRate">Daily Rate (MAD)</Label>
            <Input
              id="dailyRate"
              type="number"
              value={formData.dailyRate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
