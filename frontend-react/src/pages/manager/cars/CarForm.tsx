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
import { API_URL } from "@/lib/api-client";
import {
  type Car,
  createCar,
  updateCar,
} from "@/lib/api/car-service";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface CarFormData {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string; // Ajouté
  color: string; // Ajouté
  status: Car["status"];
  dailyRate: string;
  description: string;
  imageFile?: File | null;
  imageUrl?: string | null;
}

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
  const initialFormData: CarFormData = {
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    licensePlate: "",
    vin: "", // Ajouté
    color: "", // Ajouté
    status: "available",
    dailyRate: "0",
    description: "",
    imageFile: null,
    imageUrl: null,
  };

  const [formData, setFormData] = useState<CarFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carColors = [
    { value: "black", label: "black", colorClass: "bg-black" },
    { value: "white", label: "white", colorClass: "bg-white border border-gray-300" },
    { value: "gray", label: "gray", colorClass: "bg-gray-500" },
    { value: "silver", label: "silver", colorClass: "bg-gray-300" },
    { value: "red", label: "red", colorClass: "bg-red-500" },
    { value: "blue", label: "blue", colorClass: "bg-blue-500" },
    { value: "green", label: "green", colorClass: "bg-green-500" },
    { value: "yellow", label: "yellow", colorClass: "bg-yellow-400" },
    { value: "orange", label: "orange", colorClass: "bg-orange-500" },
    { value: "brown", label: "brown", colorClass: "bg-amber-800" },
    { value: "beige", label: "beige", colorClass: "bg-amber-200" },
    { value: "gold", label: "gold", colorClass: "bg-yellow-600" },
  ];

  useEffect(() => {
    if (mode === "edit" && car) {
      setFormData({
        make: car.make,
        model: car.model,
        year: car.year.toString(),
        licensePlate: car.licensePlate,
        vin: car.vin, // Ajouté
        color: car.color || "", // Ajouté
        status: car.status,
        dailyRate: car.dailyRate.toString(),
        description: car.description || "",
        imageFile: null,
        imageUrl: car.imageUrl || null,
      });
      setPreviewImageUrl(car.imageUrl || null);
    } else {
      setFormData(initialFormData);
      setPreviewImageUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [mode, car, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, imageFile: file }));
      setPreviewImageUrl(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, imageFile: null }));
      setPreviewImageUrl(mode === 'edit' && car?.imageUrl ? car.imageUrl : null);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null, imageUrl: null }));
    setPreviewImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const dataToSend = new FormData();
    dataToSend.append("make", formData.make);
    dataToSend.append("model", formData.model);
    dataToSend.append("year", formData.year);
    dataToSend.append("licensePlate", formData.licensePlate);
    dataToSend.append("vin", formData.vin); // Ajouté
    if (formData.color) dataToSend.append("color", formData.color); // Ajouté
    dataToSend.append("status", formData.status);
    dataToSend.append("dailyRate", formData.dailyRate);
    if (formData.description) dataToSend.append("description", formData.description);

    if (formData.imageFile) {
      dataToSend.append("imageFile", formData.imageFile);
    } else if (formData.imageUrl === null && mode === 'edit' && car?.imageUrl) {
      dataToSend.append("imageUrl", "");
    }

    try {
      let result: Car;
      if (mode === "add") {
        result = await createCar(dataToSend);
        toast.success("Car added successfully.");
      } else if (car) {
        result = await updateCar(car.id, dataToSend);
        toast.success("Car updated successfully.");
      } else {
        throw new Error("Car data is missing for update.");
      }
      onSubmitSuccess(result);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === "add" ? "adding" : "updating"} car:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <Input id="make" value={formData.make} onChange={handleChange} required className="placeholder:text-muted-foreground/60" placeholder="e.g. Toyota" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={formData.model} onChange={handleChange} required className="placeholder:text-muted-foreground/60" placeholder="e.g. Corolla" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              required
              className="placeholder:text-muted-foreground/60"
              placeholder={new Date().getFullYear().toString()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
              className="placeholder:text-muted-foreground/60"
              placeholder="e.g. 123456-ا-01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
            <Input id="vin" value={formData.vin} onChange={handleChange} required className="placeholder:text-muted-foreground/60" placeholder="17-character VIN" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select
              value={formData.color}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, color: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color">
                  {formData.color && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${carColors.find(c => c.value === formData.color)?.colorClass || "bg-gray-300"}`}
                      />
                      {carColors.find(c => c.value === formData.color)?.label || formData.color}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {carColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${color.colorClass}`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              step="0.01"
              className="placeholder:text-muted-foreground/60"
              placeholder="e.g. 250.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              className="placeholder:text-muted-foreground/60"
              placeholder="Additional details about the car..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageFile">Car Image</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose Image
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formData.imageFile ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Image selected
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {previewImageUrl ? "Current image will be kept" : "No image selected"}
                    </span>
                  )}
                </span>
              </div>
              <Input
                id="imageFile"
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              {previewImageUrl && (
                <div className="space-y-2">
                  <img 
                    src={previewImageUrl.startsWith('blob:') ? previewImageUrl : `${API_URL}${previewImageUrl}`} 
                    alt="Preview" 
                    className="h-32 w-auto object-cover rounded border" 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRemoveImage} 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Car" : "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
