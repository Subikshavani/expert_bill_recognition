import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { useApi } from "../hooks/useApi";

export default function EmployeeMyBillsPage({ user }) {
  const [query, setQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const email = encodeURIComponent(user?.email || "");
  const { data, loading, error } = useApi(`/employee/bills?email=${email}`);
  const bills = data ?? [];

  const rows = useMemo(
    () =>
      bills.filter((bill) => {
        const blob = `${bill.id} ${bill.billNumber} ${bill.vendor} ${bill.department}`.toLowerCase();
        return blob.includes(query.toLowerCase());
      }),
    [bills, query]
  );

  const columns = [
    { key: "id", header: "Bill ID" },
    { key: "category", header: "Expense Type" },
    { key: "amount", header: "Amount", render: (row) => `$${Number(row.amount).toLocaleString()}` },
    { key: "date", header: "Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-2 py-1 text-xs text-blue-600">{row.status}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedBill(row)}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-800 hover:bg-slate-100"
        >
          View
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner message="Loading your bills..." />;
  if (error) return <p className="p-4 text-blue-300">Error: {error}</p>;

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-2xl font-bold text-slate-800">My Bills</h2>
        <p className="mt-1 text-sm text-slate-400">All bills submitted by your account.</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by bill number, vendor, department"
          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
        />
      </div>

      <DataTable columns={columns} rows={rows} pageSize={8} emptyText="No bills submitted yet." />

      <Modal
        open={!!selectedBill}
        title={selectedBill ? `Bill ${selectedBill.id}` : "Bill Details"}
        onClose={() => setSelectedBill(null)}
      >
        {selectedBill ? (
          <div className="grid gap-3 md:grid-cols-2">
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Bill Number:</strong> {selectedBill.billNumber}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Vendor:</strong> {selectedBill.vendor}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Department:</strong> {selectedBill.department}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Status:</strong> {selectedBill.status}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Amount:</strong> ${Number(selectedBill.amount).toLocaleString()}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Date:</strong> {selectedBill.date}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 md:col-span-2"><strong>Notes:</strong> {selectedBill.notes || "-"}</p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

