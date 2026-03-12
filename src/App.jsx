import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RoleGate from "./components/RoleGate";
import EmployeeShell from "./components/EmployeeShell";
import { PERMISSIONS, ROLES, hasPermission } from "./auth/permissions";
import LoginPage from "./pages/LoginPage";
import AddEmployeePage from "./pages/AddEmployeePage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesListPage from "./pages/EmployeesListPage";
import EmployeeLoginPage from "./pages/EmployeeLoginPage";
import EmployeeHomePage from "./pages/EmployeeHomePage";
import EmployeeUploadBillPage from "./pages/EmployeeUploadBillPage";
import EmployeeMyBillsPage from "./pages/EmployeeMyBillsPage";
import EmployeeBillStatusPage from "./pages/EmployeeBillStatusPage";
import BillTemplatesPage from "./pages/BillTemplatesPage";
import BudgetManagementPage from "./pages/BudgetManagementPage";
import VendorManagementPage from "./pages/VendorManagementPage";
import AdvanceRequestsPage from "./pages/AdvanceRequestsPage";
import TripAnalyticsPage from "./pages/TripAnalyticsPage";

const adminNavConfig = [
  { path: "/dashboard", label: "Dashboard", permission: PERMISSIONS.DASHBOARD, icon: "dashboard" },
  { path: "/employees/add", label: "Add Employee", permission: PERMISSIONS.USER_MANAGEMENT, icon: "userAdd" },
  { path: "/employees", label: "Employees List", permission: PERMISSIONS.USER_MANAGEMENT, icon: "users" },
  { path: "/employee/login", label: "Employee Login", permission: PERMISSIONS.DASHBOARD, icon: "users" },
  { path: "/logout", label: "Logout", permission: PERMISSIONS.DASHBOARD, icon: "logout", action: "logout" },
];

function ProtectedPage({ role, permission, children }) {
  return (
    <RoleGate allowed={hasPermission(role, permission)} userRole={role}>
      {children}
    </RoleGate>
  );
}

function AdminApp() {
  const [role, setRole] = useState(ROLES.MANAGER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const firstAllowedRoute = "/dashboard";

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={() => {
                setRole(ROLES.MANAGER);
                setIsAuthenticated(true);
              }}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout role={role} navConfig={adminNavConfig} onLogout={() => setIsAuthenticated(false)}>
      <Routes>
        <Route path="/" element={<Navigate to={firstAllowedRoute} replace />} />
        <Route path="/login" element={<Navigate to={firstAllowedRoute} replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedPage role={role} permission={PERMISSIONS.DASHBOARD}>
              <DashboardPage />
            </ProtectedPage>
          }
        />

        <Route
          path="/employees/add"
          element={
            <ProtectedPage role={role} permission={PERMISSIONS.USER_MANAGEMENT}>
              <AddEmployeePage />
            </ProtectedPage>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedPage role={role} permission={PERMISSIONS.USER_MANAGEMENT}>
              <EmployeesListPage />
            </ProtectedPage>
          }
        />

        <Route path="/logout" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={firstAllowedRoute} replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [employeeSession, setEmployeeSession] = useState(() => {
    try {
      const saved = localStorage.getItem("employeeSession");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Theme is managed by ThemeContext in main.jsx

  useEffect(() => {
    if (employeeSession) {
      localStorage.setItem("employeeSession", JSON.stringify(employeeSession));
    } else {
      localStorage.removeItem("employeeSession");
    }
  }, [employeeSession]);

  return (
    <Routes>
      <Route
        path="/employee/login"
        element={<EmployeeLoginPage onLogin={(session) => setEmployeeSession(session)} />}
      />

      <Route
        path="/employee"
        element={
          employeeSession ? (
            <EmployeeShell user={employeeSession.user} onLogout={() => setEmployeeSession(null)} />
          ) : (
            <Navigate to="/employee/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeHomePage user={employeeSession?.user} />} />
        <Route path="upload-bill" element={<EmployeeUploadBillPage user={employeeSession?.user} />} />
        <Route path="my-bills" element={<EmployeeMyBillsPage user={employeeSession?.user} />} />
        <Route path="bill-status" element={<EmployeeBillStatusPage user={employeeSession?.user} />} />
        <Route path="templates" element={<BillTemplatesPage user={employeeSession?.user} />} />
        <Route path="budgets" element={<BudgetManagementPage user={employeeSession?.user} />} />
        <Route path="vendors" element={<VendorManagementPage user={employeeSession?.user} />} />
        <Route path="advances" element={<AdvanceRequestsPage user={employeeSession?.user} />} />
        <Route path="analytics" element={<TripAnalyticsPage user={employeeSession?.user} />} />
      </Route>

      <Route path="/*" element={<AdminApp />} />
    </Routes>
  );
}
