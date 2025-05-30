import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    type Client,
    deleteClient,
    getClients,
} from "@/lib/api/client-service";
import { format } from "date-fns";
import { Filter, Plus, X } from "lucide-react"; // Added Filter and X icons
import { useEffect, useMemo, useState } from "react"; // Added useMemo
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

  // State for filters
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [cinFilter, setCinFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false);


  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load clients.";
      setError(errorMessage);
      toast.error(errorMessage);
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

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      return (
        client.firstName.toLowerCase().includes(firstNameFilter.toLowerCase()) &&
        client.lastName.toLowerCase().includes(lastNameFilter.toLowerCase()) &&
        client.phone.toLowerCase().includes(phoneFilter.toLowerCase()) &&
        client.CIN.toLowerCase().includes(cinFilter.toLowerCase()) &&
        (client.email || "").toLowerCase().includes(emailFilter.toLowerCase())
      );
    });
  }, [clients, firstNameFilter, lastNameFilter, phoneFilter, cinFilter, emailFilter]);

  const handleClearFilters = () => {
    setFirstNameFilter("");
    setLastNameFilter("");
    setPhoneFilter("");
    setCinFilter("");
    setEmailFilter("");
    setIsFiltersPopoverOpen(false); // Optionally close popover on clear
  };
  
  const activeFilterCount = [firstNameFilter, lastNameFilter, phoneFilter, cinFilter, emailFilter].filter(Boolean).length;


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

    // Optimistic update
    const originalClients = [...clients];
    setClients(clients.filter((c) => c.id !== currentClient.id)); 
    // No toast.info here, let the success/error toast be the source of truth

    try {
      await deleteClient(currentClient.id);
      toast.success(`Client '${currentClient.firstName} ${currentClient.lastName}' deleted successfully.`);
      // No need to call fetchClients() if optimistic update is preferred for removal
    } catch (err) {
      console.error("Error deleting client:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete client.";
      toast.error(errorMessage);
      setClients(originalClients); // Revert on error
    } finally {
      setCurrentClient(null);
      setIsDeleteDialogOpen(false); // Close dialog in finally
    }
  };

  const handleFormSubmit = (updatedOrNewClient: Client) => {
    // Instead of optimistic update here, we'll refetch or update based on API response
    // This ensures the list reflects the true state from the server, especially IDs for new items.
    fetchClients(); // Refetch the list to get the most up-to-date data
    setIsFormOpen(false);
  };

  const handleDeleteClient = (client: Client) => {
    setCurrentClient(client);
    setIsDeleteDialogOpen(true);
  };

  if (error && !isLoading && clients.length === 0) { // Show error only if loading is done and still no clients
    return (
      <div className="p-4 md:p-8 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <Button onClick={fetchClients}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <div className="flex items-center gap-2">
          <Popover open={isFiltersPopoverOpen} onOpenChange={setIsFiltersPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter Clients</h4>
                  <p className="text-sm text-muted-foreground">
                    Apply filters to narrow down the client list.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="firstNameFilter" className="text-xs">First Name</Label>
                    <Input
                      id="firstNameFilter"
                      value={firstNameFilter}
                      onChange={(e) => setFirstNameFilter(e.target.value)}
                      placeholder="Filter by first name..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="lastNameFilter" className="text-xs">Last Name</Label>
                    <Input
                      id="lastNameFilter"
                      value={lastNameFilter}
                      onChange={(e) => setLastNameFilter(e.target.value)}
                      placeholder="Filter by last name..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="phoneFilter" className="text-xs">Phone</Label>
                    <Input
                      id="phoneFilter"
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                      placeholder="Filter by phone..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="cinFilter" className="text-xs">CIN</Label>
                    <Input
                      id="cinFilter"
                      value={cinFilter}
                      onChange={(e) => setCinFilter(e.target.value)}
                      placeholder="Filter by CIN..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="emailFilter" className="text-xs">Email</Label>
                    <Input
                      id="emailFilter"
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      placeholder="Filter by email..."
                      className="col-span-2 h-8 text-xs placeholder:opacity-70"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
                    <X className="mr-1 h-3 w-3" /> Clear
                  </Button>
                  {/* Apply button is optional, filters apply on change */}
                  {/* <Button size="sm" onClick={() => setIsFiltersPopoverOpen(false)} className="text-xs">Apply</Button> */}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleAddClient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredClients} // Use filtered data
        columns={columns}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        onView={handleViewClient}
        // No searchKey needed here as we are handling filtering outside
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