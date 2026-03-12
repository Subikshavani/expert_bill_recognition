import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { useApi } from "../hooks/useApi";
import { apiFetch } from "../api/client";

export default function BillsListPage() {
  const { data, loading, error } = useApi("/bills");
  const bills = data ?? [];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBill, setSelectedBill] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleViewBill = async (row) => {
    setSelectedBill(row);
    setOcrData(null);
    setOcrLoading(true);
    try {
      const res = await apiFetch(`/ocr-results?billId=${row.id}`);
      if (res.results?.length > 0) setOcrData(res.results[0]);
    } catch {}
    finally { setOcrLoading(false); }
  };

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
        <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-600">{row.status}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleViewBill(row)}
          className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-800 hover:bg-slate-100"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-2xl font-bold text-slate-800">Bills List</h2>
        <p className="mt-1 text-sm text-slate-400">Search, filter, and inspect submitted expenses.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by bill ID, employee, vendor"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
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
        onClose={() => { setSelectedBill(null); setOcrData(null); }}
      >
        {selectedBill ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Employee:</strong> {selectedBill.uploadedBy || "N/A"}</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Vendor:</strong> {selectedBill.vendor}</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Bill No:</strong> {selectedBill.billNumber}</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Department:</strong> {selectedBill.department}</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Status:</strong> {selectedBill.status}</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Amount:</strong> ${Number(selectedBill.amount).toLocaleString()}</p>
            </div>
            {ocrLoading ? (
              <p className="text-xs text-cyan-500 animate-pulse">Fetching extracted data from file...</p>
            ) : ocrData?.status === "success" ? (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-400/5 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-500">Extracted Data</p>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  {ocrData.vendor ? <p><span className="text-slate-400">Vendor: </span><span className="text-slate-800">{ocrData.vendor}</span></p> : null}
                  {ocrData.billNumber ? <p><span className="text-slate-400">Invoice No: </span><span className="text-slate-800">{ocrData.billNumber}</span></p> : null}
                  {ocrData.date ? <p><span className="text-slate-400">Date: </span><span className="text-slate-800">{ocrData.date}</span></p> : null}
                  {ocrData.amount != null ? <p><span className="text-slate-400">Amount: </span><span className="text-slate-800">Rs. {ocrData.amount.toLocaleString()}</span></p> : null}
                  {ocrData.category ? <p><span className="text-slate-400">Category: </span><span className="text-slate-800">{ocrData.category}</span></p> : null}
                </div>
                {ocrData.rawText ? (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-cyan-400">View raw extracted text</summary>
                    <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-slate-600">{ocrData.rawText}</pre>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
