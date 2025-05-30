import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus } from "lucide-react";
import { ManagerForm } from "./ManagerForm";
import {
  type Manager,
  type ManagerCreateInput,
  type ManagerUpdateInput,
  getManagers,      // Using actual API function
  createManager,    // Using actual API function
  updateManager,    // Using actual API function
  deleteManager,    // Using actual API function
} from "@/lib/api/manager-service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder for DashboardShell if you create one
// import { DashboardShell } from "@/components/layout/DashboardShell";

// --- Mock Data Removed ---

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [isLoading, setIsLoading] = useState(true); // For initial page load
  const [actionLoading, setActionLoading] = useState(false); // For form submissions/deletions
  const [error, setError] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getManagers(); // Call actual API
      setManagers(data);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load managers from the server.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error fetching managers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const columns = [
    { header: "Username", accessorKey: "username" as keyof Manager },
    { header: "Full Name", accessorKey: "fullName" as keyof Manager },
    {
      header: "Created At",
      accessorKey: "createdAt" as keyof Manager,
      cell: (item: Manager) =>
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  const handleAddManager = () => {
    setFormMode("add");
    setCurrentManager(null);
    setIsFormOpen(true);
  };

  const handleEditManager = (manager: Manager) => {
    setFormMode("edit");
    setCurrentManager(manager);
    setIsFormOpen(true);
  };

  const handleDeleteManager = (manager: Manager) => {
    setCurrentManager(manager);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentManager) return;
    setActionLoading(true);
    try {
      await deleteManager(currentManager.id); // Call actual API
      toast.success(`Manager '${currentManager.fullName}' deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setCurrentManager(null);
      fetchManagers(); // Refresh the list from the server
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete manager.";
      toast.error(errorMessage);
      console.error("Error deleting manager:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveManager = async (
    data: ManagerCreateInput | ManagerUpdateInput
  ) => {
    setActionLoading(true);
    try {
      let savedManager: Manager;
      if (formMode === "add") {
        savedManager = await createManager(data as ManagerCreateInput); // Call actual API
        toast.success(`Manager '${savedManager.fullName}' created successfully.`);
      } else if (formMode === "edit" && currentManager) {
        // Ensure the data includes the id for updateManager
        savedManager = await updateManager({ id: currentManager.id, ...(data as Omit<ManagerUpdateInput, 'id'>) });
        toast.success(`Manager '${savedManager.fullName}' updated successfully.`);
      }
      setIsFormOpen(false);
      setCurrentManager(null);
      fetchManagers(); // Refresh the list from the server
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${formMode} manager.`;
      toast.error(errorMessage);
      console.error(`Error saving manager (mode: ${formMode}):`, err);
      // Optionally, re-throw to allow ManagerForm to handle the error too
      // throw err; 
    } finally {
      setActionLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !isLoading) { // Show error only if not loading and an error exists
    return (
      <div className="p-4 md:p-6 lg:p-8 text-red-600">
        <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        <p>{error}</p>
        <Button onClick={fetchManagers} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    // Replace outer div with <DashboardShell role="admin"> if you implement it
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Manage Managers
        </h1>
        <Button onClick={handleAddManager}>
          <Plus className="mr-2 h-4 w-4" />
          Add Manager
        </Button>
      </div>

      <DataTable
        data={managers}
        columns={columns}
        onEdit={handleEditManager}
        onDelete={handleDeleteManager}
        searchKey="username" // Or "fullName"
      />

      <ManagerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        manager={currentManager}
        onSave={handleSaveManager}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Manager"
        description={`Are you sure you want to delete manager '${
          currentManager?.fullName || ""
        }'? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}