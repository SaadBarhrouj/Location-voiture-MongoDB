import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
// Remove lucide-react imports
// import { CalendarClock, Car, Home, LogOut, Menu, UserCog, X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUserCog,
  faCar,
  faCalendarCheck,
  faSignOutAlt,
  faTimes,
  faBars,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = {
  admin: [
    { title: "Dashboard", href: "/admin/dashboard", icon: <FontAwesomeIcon icon={faHome} className="h-5 w-5" /> },
    { title: "Managers", href: "/admin/managers", icon: <FontAwesomeIcon icon={faUserCog} className="h-5 w-5" /> },
    { title: "Audit Logs", href: "/admin/audit-logs", icon: <FontAwesomeIcon icon={faHistory} className="h-5 w-5" /> },
  ],
  manager: [
    { title: "Dashboard", href: "/manager/dashboard", icon: <FontAwesomeIcon icon={faHome} className="h-5 w-5" /> },
    { title: "Cars", href: "/manager/cars", icon: <FontAwesomeIcon icon={faCar} className="h-5 w-5" /> },
    { title: "Clients", href: "/manager/clients", icon: <FontAwesomeIcon icon={faUserCog} className="h-5 w-5" /> },
    { title: "Reservations", href: "/manager/reservations", icon: <FontAwesomeIcon icon={faCalendarCheck} className="h-5 w-5" /> },
    // Ajoutez d'autres éléments de navigation manager si nécessaire
  ],
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // if (!user) return null;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const effectiveRole = user ? user.role : (location.pathname.startsWith('/admin') ? 'admin' : 'manager');
  const panelTitle = effectiveRole === "admin" ? "Admin Panel (Dev)" : "Manager Panel";
  const currentNavItems = user ? navItems[user.role] : (effectiveRole === 'admin' ? navItems.admin : navItems.manager);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform border-r border-border ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h2 className="text-xl font-bold">{panelTitle}</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            {sidebarOpen ? <FontAwesomeIcon icon={faTimes} /> : <FontAwesomeIcon icon={faBars} />} {/* Use faBars or similar for menu */}
          </Button>
        </div>
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {currentNavItems?.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-4 rounded-md text-sm font-medium transition-colors ${ // Ajout de transition-colors
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground" // Style actif mis à jour
                  : "hover:bg-primary/10 hover:text-foreground" // Style de survol mis à jour
              }`}
            >
              {/* Icon is already updated via navItems */}
              {item.icon}
              {item.title}
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-primary/10 hover:text-destructive"
            onClick={logout}
          >
            {/* Replace LogOut icon */}
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-72">
        {/* Header */}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}