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
import { Textarea } from "@/components/ui/textarea";
import {
    createClient,
    updateClient,
    type Client,
    type ClientCreateInput,
} from "@/lib/api/client-service";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ClientFormData {
  firstName: string;
  lastName: string;
  phone: string;
  CIN: string;
  email: string;
  driverLicenseNumber: string;
  notes: string;
}

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  client: Client | null;
  onSubmitSuccess: (client: Client) => void;
}

export function ClientForm({
  open,
  onOpenChange,
  mode,
  client,
  onSubmitSuccess,
}: ClientFormProps) {
  const initialFormData: ClientFormData = {
    firstName: "",
    lastName: "",
    phone: "",
    CIN: "",
    email: "",
    driverLicenseNumber: "",
    notes: "",
  };

  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        CIN: client.CIN,
        email: client.email || "",
        driverLicenseNumber: client.driverLicenseNumber || "",
        notes: client.notes || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [mode, client, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!formData.CIN.trim()) {
      toast.error("CIN is required");
      return false;
    }
    if (formData.email && !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    const dataToSubmit: ClientCreateInput = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      CIN: formData.CIN.trim(),
      email: formData.email.trim() || undefined,
      driverLicenseNumber: formData.driverLicenseNumber.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      let result: Client;
      if (mode === "add") {
        result = await createClient(dataToSubmit);
        // result = await simulateCreateClient(dataToSubmit); // Pour demo
        toast.success("Client added successfully.");
      } else if (client) {
        result = await updateClient(client.id, dataToSubmit);
        // result = await simulateUpdateClient(client.id, dataToSubmit); // Pour demo
        toast.success("Client updated successfully.");
      } else {
        throw new Error("Client data is missing for update.");
      }
      onSubmitSuccess(result);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === "add" ? "adding" : "updating"} client:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Client" : "Edit Client"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Fill in the details of the new client."
              : "Update the details of the selected client."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter first name"
                className="placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter last name"
                className="placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+212 6XX XXX XXX"
              className="placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="CIN">
              CIN (ID Card) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="CIN"
              value={formData.CIN}
              onChange={handleChange}
              required
              placeholder="AB123456"
              className="placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@example.com"
              className="placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="driverLicenseNumber">Driver License Number</Label>
            <Input
              id="driverLicenseNumber"
              value={formData.driverLicenseNumber}
              onChange={handleChange}
              placeholder="DL123456"
              className="placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the client..."
              rows={3}
              className="placeholder:text-muted-foreground/60"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Client" : "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
