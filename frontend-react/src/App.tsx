import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import MainLayout from "./components/layout/MainLayout";
import { useAuth } from "./hooks/useAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginPage from "./pages/auth/LoginPage";
import CarsPage from "./pages/manager/cars/CarsPage";
import ClientsPage from "./pages/manager/clients/ClientsPage";
import ManagerDashboard from "./pages/manager/dashboard/ManagerDashboard";
import ReservationsPage from "./pages/manager/reservations/ReservationsPage";
import ManagersPage from "./pages/admin/managers/ManagersPage";
import AuditLogsPage from "./pages/admin/audit-logs/AuditLogsPage";

export default function App() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until authentication status is resolved
    }

    const isLoginPage = location.pathname === "/login";

    if (user) {
      // User is "logged in"
      const targetDashboard = user.role === "admin" ? "/admin/dashboard" : "/manager/dashboard";

      if (isLoginPage) {
        // If logged in and on the login page, redirect to their dashboard
        navigate(targetDashboard, { replace: true });
      } else if (location.pathname === "/") {
        // If logged in and on the root path, redirect to their dashboard
        navigate(targetDashboard, { replace: true });
      }
      // If logged in and on any other page (e.g., already on their dashboard or another allowed page), do nothing.
    } else {
      // User is NOT "logged in"
      if (!isLoginPage) {
        // If not logged in and not on the login page, redirect to the login page
        navigate("/login", { replace: true });
      }
      // If not logged in and on the login page, do nothing (stay on the login page).
    }
  }, [user, isLoading, navigate, location]); // Use location object for full dependency

  if (isLoading) {
    // You can replace this with a more sophisticated loading spinner
    return <div className="flex justify-center items-center h-screen">Loading application...</div>;
  }

  return (
    <>
      <Toaster 
        position="top-right" // Or your preferred position
        expand={false}
        richColors
        closeButton
      />
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route
          path="/admin/*"
          element={
            user && user.role === "admin" ? (
              <MainLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="managers" element={<ManagersPage />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                  {/* Add other admin routes here */}
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager/*"
          element={
            user && user.role === "manager" ? (
              <MainLayout>
                <Routes>
                  <Route path="dashboard" element={<ManagerDashboard />} />
                  <Route path="cars" element={<CarsPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="reservations" element={<ReservationsPage />} />
                  {/* Add other manager routes here */}
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            // This will be caught by the useEffect:
            // if user -> navigate to dashboard
            // if !user -> navigate to /login
            <Navigate to="/login" replace /> 
          }
        />
        {/* Catch-all for undefined routes, redirect to login or a 404 page */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}