import React, { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table"; 
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuditLogs, type ProcessedAuditLog } from "@/lib/api/admin-service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

// Define a column type that matches your custom DataTable in `components/ui/data-table.tsx`
interface CustomColumnDef<TData> {
  header: string;
  accessorKey: keyof TData;
  cell?: (item: TData) => React.ReactNode;
}

const columns: CustomColumnDef<ProcessedAuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: (item) => <div className="min-w-[160px] text-xs">{item.timestamp}</div>,
  },
  {
    accessorKey: "user",
    header: "User",
    cell: (item) => <div className="min-w-[120px] text-xs">{item.user}</div>,
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: (item) => <div className="min-w-[180px] text-xs font-medium">{item.action}</div>,
  },
  {
    accessorKey: "target",
    header: "Target",
    cell: (item) => <div className="min-w-[200px] text-xs">{item.target}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (item) => {
      const status = item.status;
      let statusClass = "text-gray-600";
      if (status?.toLowerCase() === "success") statusClass = "text-green-600";
      else if (status?.toLowerCase() === "failure") statusClass = "text-red-600";
      else if (status?.toLowerCase() === "info") statusClass = "text-blue-600";
      else if (status?.toLowerCase() === "warning") statusClass = "text-yellow-600";
      return <div className={`min-w-[80px] text-xs font-semibold ${statusClass}`}>{status}</div>;
    },
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: (item) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs h-7">View</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-60 overflow-y-auto p-0">
          <pre className="p-3 text-xs whitespace-pre-wrap break-all bg-muted rounded-md">
            {item.details}
          </pre>
        </PopoverContent>
      </Popover>
    ),
  },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ProcessedAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(20);

  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const fetchAuditLogs = useCallback(async (pageToFetch: number, itemsPerPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = {
        userUsername: userFilter || undefined,
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        entityType: entityTypeFilter || undefined,
      };
      const result = await getAuditLogs(pageToFetch, itemsPerPage, activeFilters);
      setLogs(result.data);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage); 
      setTotalRecords(result.totalRecords);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load audit logs.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userFilter, actionFilter, statusFilter, entityTypeFilter]);

  useEffect(() => {
    fetchAuditLogs(currentPage, perPage);
  }, [currentPage, perPage, fetchAuditLogs]);


  const handleApplyFilters = () => {
    if (currentPage === 1) {
      fetchAuditLogs(1, perPage);
    } else {
      setCurrentPage(1);
    }
  };
  
  const handleClearFilters = () => {
    setUserFilter("");
    setActionFilter("");
    setStatusFilter("");
    setEntityTypeFilter("");
    if (currentPage === 1) {
        fetchAuditLogs(1, perPage);
    } else {
        setCurrentPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handlePerPageChange = (value: string) => {
    const newPerPage = Number(value);
    setPerPage(newPerPage);
    if (currentPage === 1) {
        fetchAuditLogs(1, newPerPage);
    } else {
        setCurrentPage(1);
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => ( <Skeleton key={i} className="h-10 w-full" /> ))}
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <Terminal className="h-4 w-4" /> <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchAuditLogs(currentPage, perPage)} className="mt-6">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background text-foreground">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4 p-4">
            <div className="space-y-1">
              <Label htmlFor="userFilter" className="text-xs">Username</Label>
              <Input id="userFilter" placeholder="Filter by username..." value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="actionFilter" className="text-xs">Action</Label>
              <Input id="actionFilter" placeholder="Filter by action..." value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="statusFilter" className="text-xs">Status</Label>
              <Input id="statusFilter" placeholder="Filter by status..." value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs" />
            </div>
             <div className="space-y-1">
              <Label htmlFor="entityTypeFilter" className="text-xs">Entity Type</Label>
              <Input id="entityTypeFilter" placeholder="Filter by entity type..." value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">Clear</Button>
                <Button size="sm" onClick={handleApplyFilters} className="text-xs">Apply</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <DataTable columns={columns} data={logs} />

      <div className="flex items-center justify-between pt-4 flex-wrap gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {logs.length > 0 ? (currentPage - 1) * perPage + 1 : 0}-
          {Math.min(currentPage * perPage, totalRecords)} of {totalRecords} logs.
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="h-9 w-[70px] text-xs"><SelectValue placeholder={String(perPage)} /></SelectTrigger>
            <SelectContent>{[10, 20, 50, 100].map(size => (<SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(1)} disabled={currentPage === 1 || isLoading}><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm px-1">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0 || isLoading}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0 || isLoading}><ChevronsRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}