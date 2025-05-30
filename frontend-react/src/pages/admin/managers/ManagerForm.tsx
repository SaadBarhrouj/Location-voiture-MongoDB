import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { type Manager, type ManagerCreateInput, type ManagerUpdateInput } from "@/lib/api/manager-service";

interface ManagerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  manager?: Manager | null;
  onSave: (data: ManagerCreateInput | ManagerUpdateInput) => Promise<void>;
  isLoading: boolean;
}

export function ManagerForm({
  open,
  onOpenChange,
  mode,
  manager,
  onSave,
  isLoading,
}: ManagerFormProps) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (manager && mode === "edit") {
        setUsername(manager.username || "");
        setFullName(manager.fullName || "");
        setPassword(""); 
        setConfirmPassword("");
      } else {
        setUsername("");
        setFullName("");
        setPassword("");
        setConfirmPassword("");
      }
      setError(null);
    }
  }, [manager, mode, open]);

  const internalHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !fullName.trim()) {
      setError("Username and full name are required.");
      return;
    }

    if (mode === "add" && !password) {
      setError("Password is required for new managers.");
      return;
    }
    
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const dataToSave: ManagerCreateInput | ManagerUpdateInput =
      mode === "add"
        ? { username, fullName, password }
        : { id: manager!.id, username, fullName, ...(password && { password }) };

    try {
      await onSave(dataToSave);
      // onOpenChange(false); // Parent will handle closing on success
    } catch (apiError: any) {
      setError(apiError.message || "An unexpected error occurred during save.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Manager" : "Edit Manager"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new manager account."
              : "Update manager account details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={internalHandleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "edit" ? "Leave blank to keep current" : ""}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={mode === "edit" ? "Leave blank to keep current" : ""}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (mode === "add" ? "Create Manager" : "Update Manager")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}