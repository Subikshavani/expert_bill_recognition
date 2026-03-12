import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";

export default function ApprovalWorkflowPage({ role }) {
  const { data, loading, error, refetch } = useApi("/bills");
  const allBills = data ?? [];

  const pendingBills = useMemo(
    () => allBills.filter((bill) => ["Manager Approval", "Finance Approval", "Under Accounts Review"].includes(bill.status)),
    [allBills]
  );

  const [selectedBillId, setSelectedBillId] = useState("");
  const [comment, setComment] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (pendingBills.length && !selectedBillId) {
      setSelectedBillId(pendingBills[0].id);
    }
  }, [pendingBills, selectedBillId]);

  const selectedBill = pendingBills.find((bill) => bill.id === selectedBillId);

  const takeAction = async (action) => {
    if (!selectedBill) return;
    setActing(true);
    try {
      await apiFetch(`/bills/${selectedBill.id}/action`, {
        method: "POST",
        body: { action, comment, user: role || "Manager" },
      });
      setComment("");
      setActionMessage(`${action} recorded for ${selectedBill.id}`);
      setSelectedBillId("");
      refetch();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading approval queue..." />;
  if (error) return <p className="p-4 text-rose-400">Error: {error}</p>;

  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-xl font-bold text-slate-800">Pending Approval Queue</h2>
        <p className="mt-1 text-xs text-slate-400">Managers and finance team can approve, reject, or request clarification.</p>

        <div className="mt-4 space-y-2">
          {pendingBills.map((bill) => (
            <button
              key={bill.id}
              type="button"
              onClick={() => setSelectedBillId(bill.id)}
              className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                selectedBillId === bill.id
                  ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <p className="font-semibold">{bill.id}</p>
              <p className="text-xs text-slate-400">{bill.vendor}</p>
              <p className="text-xs text-slate-400">${Number(bill.amount).toLocaleString()}</p>
            </button>
          ))}
          {!pendingBills.length ? <p className="text-xs text-slate-500">No pending bills at the moment.</p> : null}
        </div>
      </div>

      <div className="panel rounded-2xl p-5 shadow-panel xl:col-span-2">
        {selectedBill ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="page-title text-xl font-bold text-slate-800">Bill Review: {selectedBill.id}</h3>
                <p className="text-sm text-slate-400">Current Stage: {selectedBill.status}</p>
              </div>
              <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">{selectedBill.category}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p><strong>Bill Number:</strong> {selectedBill.billNumber}</p>
                <p><strong>Vendor:</strong> {selectedBill.vendor}</p>
                <p><strong>Department:</strong> {selectedBill.department}</p>
                <p><strong>Amount:</strong> ${Number(selectedBill.amount).toLocaleString()}</p>
                <p><strong>Date:</strong> {selectedBill.date}</p>
              </div>
              <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-slate-50 text-sm text-cyan-600">
                Uploaded bill preview area
              </div>
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Manager / Finance remarks"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={acting}
                onClick={() => takeAction("Approved")}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => takeAction("Rejected")}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => takeAction("Clarification Requested")}
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                Request Clarification
              </button>
            </div>

            {actionMessage ? <p className="text-sm text-cyan-600">{actionMessage}</p> : null}
          </div>
        ) : (
          <p className="text-slate-400">Select a bill from the queue to begin review.</p>
        )}
      </div>
    </section>
  );
}
