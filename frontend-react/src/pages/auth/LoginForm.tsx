import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { login as apiLogin, type LoginResponse } from "../../lib/api/auth-service";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginContext, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response: LoginResponse = await apiLogin({ username, password });

      if (response.user) {
        if (response.user.isActive === false) {
          const deactivationMessage = "Account is deactivated. Please contact administrator.";
          setError(deactivationMessage);
          toast.error(deactivationMessage);
        } else {
          loginContext(response.user);
          toast.success("Login successful!");
        }
      } else {
        const genericError = "Login failed. Please try again.";
        setError(genericError);
        toast.error(genericError);
      }
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message || "Login error. Please check your credentials.";
      setError(backendMessage);
      toast.error(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user && !isSubmitting) {
    return null;
  }

  return (
    <Card className="w-full bg-card text-card-foreground shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              required
              placeholder="Enter your username"
              disabled={isSubmitting}
              className="placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
              placeholder="Enter your password"
              disabled={isSubmitting}
              className="placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-10 font-medium" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
