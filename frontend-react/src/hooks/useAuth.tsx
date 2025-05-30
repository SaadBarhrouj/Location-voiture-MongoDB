import {
  logout as apiLogout,
  checkAuthStatus,
  type AuthStatusResponse,
  type User
} from '@/lib/api/auth-service';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginContext: (userData: User) => void;
  logoutContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUserSession = async () => {
      setIsLoading(true);
      try {
        const response: AuthStatusResponse = await checkAuthStatus();
        if (response.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to verify session with backend from useAuth", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  const loginContext = (userData: User) => {
    setUser(userData);
  };

  const logoutContext = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      toast.success("Logged out successfully.");
    } catch (error: any) {
      console.error("Error during API logout:", error);
      setUser(null);
      toast.error(error.response?.data?.message || "Logout failed. Disconnected from client.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginContext, logoutContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
