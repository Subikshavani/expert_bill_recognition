import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";

export default function AuditTrailPage() {
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useApi("/audit");
  const { data: usersData, loading: usersLoading } = useApi("/users");

  const events = eventsData ?? [];
  const users = usersData ?? [];

  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const roleByUser = useMemo(
    () => Object.fromEntries(users.map((u) => [u.name, u.role])),
    [users]
  );

  const actions = useMemo(() => ["All", ...new Set(events.map((event) => event.action))], [events]);

  const rows = useMemo(
    () =>
      events.filter((event) => {
        const q = query.toLowerCase();
        const text = `${event.billId} ${event.user} ${event.comments} ${event.action}`.toLowerCase();
        const searchOk = text.includes(q);
        const actionOk = actionFilter === "All" || event.action === actionFilter;
        return searchOk && actionOk;
      }),
    [events, query, actionFilter]
  );

  if (eventsLoading || usersLoading) return <LoadingSpinner message="Loading audit logs..." />;
  if (eventsError) return <p className="p-4 text-rose-400">Error: {eventsError}</p>;

  const columns = [
    { key: "billId", header: "Bill ID" },
    { key: "action", header: "Action Performed" },
    { key: "user", header: "Performed By" },
    { key: "role", header: "Role", render: (row) => roleByUser[row.user] || "N/A" },
    { key: "timestamp", header: "Timestamp" },
    { key: "comments", header: "Remarks" },
  ];

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-2xl font-bold text-slate-800">Audit Trail</h2>
        <p className="mt-1 text-sm text-slate-400">Immutable system logs for governance and compliance.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bill, user, action, remarks"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
          />
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
          >
            {actions.map((action) => (
              <option key={action} value={action} className="text-slate-900">
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} pageSize={8} emptyText="No audit events found for selected criteria." />
    </section>
  );
}
