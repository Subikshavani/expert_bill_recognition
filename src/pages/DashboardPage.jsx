import { useEffect } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import StatCard from "../components/StatCard";
import { useApi } from "../hooks/useApi";

export default function DashboardPage() {
  const { data: dashboardData, loading, error, refetch } = useApi("/dashboard");
  const { data: usersData, loading: usersLoading } = useApi("/users");

  useEffect(() => {
    const refreshDashboard = () => {
      refetch();
    };

    window.addEventListener("focus", refreshDashboard);
    document.addEventListener("visibilitychange", refreshDashboard);

    return () => {
      window.removeEventListener("focus", refreshDashboard);
      document.removeEventListener("visibilitychange", refreshDashboard);
    };
  }, [refetch]);

  if (loading || usersLoading) return <LoadingSpinner message="Loading dashboardâ€¦" />;
  if (error) return <p className="text-blue-500 p-4">Error: {error}</p>;

  const totalBills = dashboardData?.stats?.find((item) => item.label === "Total Bills Submitted");
  const pendingBills = dashboardData?.stats?.find((item) => item.label === "Bills Pending Approval");
  const approvedBills = dashboardData?.stats?.find((item) => item.label === "Approved Bills");

  const dashboardStats = [
    { label: "Total Employees", value: usersData?.length ?? 0, delta: "Start by creating employee accounts" },
    { label: "Total Bills", value: totalBills?.value ?? 0, delta: totalBills?.delta ?? "No bills submitted yet" },
    { label: "Pending Approvals", value: pendingBills?.value ?? 0, delta: pendingBills?.delta ?? "No approval queues active" },
    { label: "Approved Bills", value: approvedBills?.value ?? 0, delta: approvedBills?.delta ?? "No approved bills yet" },
  ];

  const hasEmployees = (usersData?.length ?? 0) > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-blue-500/30 bg-blue-50 p-4 text-blue-700 shadow-sm">
        <p className="text-sm font-semibold">
          {hasEmployees
            ? "Live dashboard metrics refresh from the latest bill approvals."
            : "Please add employees to start using the system."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} title={item.label} value={item.value} delta={item.delta} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel fade-up rounded-2xl p-5 shadow-panel">
          <h3 className="page-title text-lg font-bold text-slate-800">Expense Trend Placeholder</h3>
          <p className="text-sm text-slate-400">Charts will reflect current persisted bill data.</p>
          <div className="mt-5 flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-400">
            {Number(totalBills?.value ?? 0) > 0 ? `${totalBills?.value} bills currently in the system` : "No bill data available"}
          </div>
        </div>

        <div className="panel fade-up rounded-2xl p-5 shadow-panel">
          <h3 className="page-title text-lg font-bold text-slate-800">Approval Pipeline Placeholder</h3>
          <p className="text-sm text-slate-400">Pending and approved metrics update from the live approval workflow.</p>
          <div className="mt-5 flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-400">
            Pending: {pendingBills?.value ?? 0} | Approved: {approvedBills?.value ?? 0}
          </div>
        </div>
      </div>
    </section>
  );
}

