import { useMemo, useState } from "react";
import { hasPermission } from "../auth/permissions";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children, role, navConfig, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavItems = useMemo(
    () => navConfig.filter((item) => hasPermission(role, item.permission)),
    [navConfig, role]
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      <Sidebar
        navItems={filteredNavItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />
      <main className="ml-0 transition-all md:ml-72">
        <Navbar role={role} onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />
        <div className="space-y-6 pb-8">{children}</div>
      </main>
    </div>
  );
}
