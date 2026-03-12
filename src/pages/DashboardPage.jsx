import LoadingSpinner from "../components/LoadingSpinner";
import StatCard from "../components/StatCard";
import { useApi } from "../hooks/useApi";

export default function DashboardPage() {
  const { loading, error } = useApi("/dashboard");
  const { data: usersData, loading: usersLoading } = useApi("/users");

  if (loading || usersLoading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <p className="text-rose-500 p-4">Error: {error}</p>;

  const dashboardStats = [
    { label: "Total Employees", value: usersData?.length ?? 0, delta: "Start by creating employee accounts" },
    { label: "Total Bills", value: 0, delta: "Bill modules locked for initial setup" },
    { label: "Pending Approvals", value: 0, delta: "No approval queues active yet" },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-cyan-100 shadow-[0_14px_40px_rgba(34,211,238,0.15)]">
        <p className="text-sm font-semibold">Please add employees to start using the system.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} title={item.label} value={item.value} delta={item.delta} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel fade-up rounded-2xl p-5 shadow-panel">
          <h3 className="page-title text-lg font-bold text-slate-100">Expense Trend Placeholder</h3>
          <p className="text-sm text-slate-400">Charts will unlock when bill workflows are enabled.</p>
          <div className="mt-5 flex h-72 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/30 text-sm text-slate-400">
            No bill data available
          </div>
        </div>

        <div className="panel fade-up rounded-2xl p-5 shadow-panel">
          <h3 className="page-title text-lg font-bold text-slate-100">Approval Pipeline Placeholder</h3>
          <p className="text-sm text-slate-400">Pending, approved, and rejected metrics appear later.</p>
          <div className="mt-5 flex h-72 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/30 text-sm text-slate-400">
            Workflow visualization pending setup
          </div>
        </div>
      </div>
    </section>
  );
}
