import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { useApi } from "../hooks/useApi";

export default function BillsListPage() {
  const { data, loading, error } = useApi("/bills");
  const bills = data ?? [];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBill, setSelectedBill] = useState(null);

  const statuses = useMemo(() => ["All", ...new Set(bills.map((bill) => bill.status))], [bills]);

  const filteredRows = useMemo(
    () =>
      bills.filter((bill) => {
        const value = `${bill.id} ${bill.billNumber} ${bill.vendor} ${bill.uploadedBy || ""}`.toLowerCase();
        const queryMatch = value.includes(query.toLowerCase());
        const statusMatch = statusFilter === "All" || bill.status === statusFilter;
        return queryMatch && statusMatch;
      }),
    [bills, query, statusFilter]
  );

  if (loading) return <LoadingSpinner message="Loading bills..." />;
  if (error) return <p className="p-4 text-rose-400">Error: {error}</p>;

  const columns = [
    { key: "id", header: "Bill ID" },
    { key: "uploadedBy", header: "Employee Name", render: (row) => row.uploadedBy || "N/A" },
    { key: "category", header: "Expense Type" },
    { key: "amount", header: "Amount", render: (row) => `$${Number(row.amount).toLocaleString()}` },
    { key: "date", header: "Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">{row.status}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedBill(row)}
          className="rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-100 hover:bg-white/5"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-2xl font-bold text-slate-100">Bills List</h2>
        <p className="mt-1 text-sm text-slate-400">Search, filter, and inspect submitted expenses.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by bill ID, employee, vendor"
            className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status} className="text-slate-900">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} rows={filteredRows} pageSize={8} emptyText="No bills found for selected filters." />

      <Modal
        open={!!selectedBill}
        title={selectedBill ? `Bill Details: ${selectedBill.id}` : "Bill Details"}
        onClose={() => setSelectedBill(null)}
      >
        {selectedBill ? (
          <div className="grid gap-3 md:grid-cols-2">
            <p className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"><strong>Employee:</strong> {selectedBill.uploadedBy || "N/A"}</p>
            <p className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"><strong>Vendor:</strong> {selectedBill.vendor}</p>
            <p className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"><strong>Bill No:</strong> {selectedBill.billNumber}</p>
            <p className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"><strong>Department:</strong> {selectedBill.department}</p>
            <p className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"><strong>Status:</strong> {selectedBill.status}</p>
            <p className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200"><strong>Amount:</strong> ${Number(selectedBill.amount).toLocaleString()}</p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
