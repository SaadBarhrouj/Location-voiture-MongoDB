import { Outlet } from "react-router-dom";

export function ManagerLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation/Header si nécessaire */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
