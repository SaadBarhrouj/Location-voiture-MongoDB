import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { useAuth } from "./hooks/useAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginPage from "./pages/auth/LoginPage";
import CarsPage from "./pages/manager/cars/CarsPage";
import ClientsPage from "./pages/manager/clients/ClientsPage";
import ManagerDashboard from "./pages/manager/dashboard/ManagerDashboard";

export default function App() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

    useEffect(() => {
    if (!isLoading) {
      const publicPaths = ["/login"];
      const isPublicPath = publicPaths.includes(location.pathname);
  
      if (user) {
        // Détermine l'URL cible selon le rôle
        const target = user.role === "admin" ? "/admin/dashboard" : "/manager/dashboard";
  
        // Si l'utilisateur se trouve sur une page publique ou à la racine, et que l'URL actuelle n'est pas déjà celle cible
        if ((isPublicPath || location.pathname === "/") && location.pathname !== target) {
          navigate(target, { replace: true });
        }
      } else {
        if (!isPublicPath && location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route
        path="/admin/*"
        element={
          user && user.role === "admin" ? (
            <MainLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* Ajoutez d'autres routes admin ici */}
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
                {/* Ajoutez d'autres routes manager ici */}
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={<Navigate to={user ? (user.role === "admin" ? "/admin/dashboard" : "/manager/dashboard") : "/login"} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
