import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const employeeNavItems = [
  { path: "/employee/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/employee/upload-bill", label: "Upload Bill", icon: "upload" },
  { path: "/employee/my-bills", label: "My Bills", icon: "myBills" },
  { path: "/employee/bill-status", label: "Bill Status Tracking", icon: "billStatus" },
  { path: "/employee/logout", label: "Logout", icon: "logout", action: "logout" },
];

export default function EmployeeShell({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = useMemo(() => employeeNavItems, []);

  return (
    <div className="min-h-screen p-4 md:p-6 text-slate-800">
      <Sidebar
        navItems={navItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
      />

      <main className="ml-0 transition-all md:ml-72">
        <Navbar
          role="Employee"
          profileLabel={user?.name || "Employee"}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        <header className="panel mb-4 rounded-2xl px-4 py-3 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Welcome, <span className="font-semibold text-slate-800">{user?.name || "Employee"}</span>
            </p>
            <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {user?.email}
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
