import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import {
    type Client,
    deleteClient,
    getClients,
} from "@/lib/api/client-service";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClientDetails } from "./ClientDetails";
import { ClientForm } from "./ClientForm";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getClients();
      // const data = await simulateGetClients(); // Pour demo
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load clients.");
      toast.error("Failed to load clients.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PP");
    } catch {
      return dateString;
    }
  };

  const columns = [
    {
      header: "First Name",
      accessorKey: "firstName" as keyof Client,
    },
    {
      header: "Last Name",
      accessorKey: "lastName" as keyof Client,
    },
    {
      header: "Phone",
      accessorKey: "phone" as keyof Client,
    },
    {
      header: "CIN",
      accessorKey: "CIN" as keyof Client,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Client,
      cell: (client: Client) => client.email || <span className="text-gray-500">N/A</span>,
    },
    {
      header: "Driver License",
      accessorKey: "driverLicenseNumber" as keyof Client,
      cell: (client: Client) => client.driverLicenseNumber || <span className="text-gray-500">N/A</span>,
    },
    {
      header: "Registered",
      accessorKey: "registeredAt" as keyof Client,
      cell: (client: Client) => formatDate(client.registeredAt),
    },
  ];

  const handleAddClient = () => {
    setFormMode("add");
    setCurrentClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setFormMode("edit");
    setCurrentClient(client);
    setIsFormOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setCurrentClient(client);
    setIsDetailsOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentClient) return;

    const originalClients = [...clients];
    setClients(clients.filter((c) => c.id !== currentClient.id));
    toast.info("Deleting client...");

    try {
      await deleteClient(currentClient.id);
      // await simulateDeleteClient(currentClient.id); // Pour demo
      toast.success("Client deleted successfully.");
    } catch (err) {
      console.error("Error deleting client:", err);
      toast.error("Failed to delete client.");
      setClients(originalClients);
    } finally {
      setCurrentClient(null);
    }
  };

  const handleFormSubmit = (updatedOrNewClient: Client) => {
    if (formMode === "add") {
      setClients((prevClients) => [updatedOrNewClient, ...prevClients]);
    } else {
      setClients((prevClients) =>
        prevClients.map((c) => (c.id === updatedOrNewClient.id ? updatedOrNewClient : c))
      );
    }
    setIsFormOpen(false);
  };

  const handleDeleteClient = (client: Client) => {
    setCurrentClient(client);
    setIsDeleteDialogOpen(true);
  };

  if (error && !isLoading) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <Button onClick={handleAddClient}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        onView={handleViewClient}
      />

      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        client={currentClient}
        onSubmitSuccess={handleFormSubmit}
      />

      <ClientDetails
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        client={currentClient}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Client"
        description={`Are you sure you want to delete ${currentClient?.firstName} ${currentClient?.lastName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
