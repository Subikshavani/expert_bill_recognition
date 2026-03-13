import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressTracker from "../components/ProgressTracker";
import { useApi } from "../hooks/useApi";

export default function BillStatusTrackingPage() {
  const { data: billsData, loading: billsLoading, error: billsError } = useApi("/bills");
  const { data: auditData, loading: auditLoading, error: auditError } = useApi("/audit");

  const bills = billsData ?? [];
  const audits = auditData ?? [];
  const [selectedBillId, setSelectedBillId] = useState("");

  useEffect(() => {
    if (bills.length && !selectedBillId) {
      setSelectedBillId(bills[0].id);
    }
  }, [bills, selectedBillId]);

  const selectedBill = useMemo(() => bills.find((bill) => bill.id === selectedBillId), [bills, selectedBillId]);
  const timeline = useMemo(
    () => audits.filter((item) => item.billId === selectedBillId),
    [audits, selectedBillId]
  );

  if (billsLoading || auditLoading) return <LoadingSpinner message="Loading status tracker..." />;
  if (billsError || auditError) return <p className="p-4 text-blue-400">Error: {billsError || auditError}</p>;

  return (
    <section className="space-y-6">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-2xl font-bold text-slate-800">Bill Status Tracking</h2>
        <p className="mt-1 text-sm text-slate-400">Monitor the full lifecycle from upload to payment completion.</p>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Select Bill</label>
          <select
            value={selectedBillId}
            onChange={(event) => setSelectedBillId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 md:w-96"
          >
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id} className="text-slate-900">
                {bill.id} - {bill.billNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBill ? (
        <>
          <ProgressTracker stage={selectedBill.stage || 1} timeline={timeline} />

          <div className="panel rounded-2xl p-5 shadow-panel">
            <h3 className="page-title text-lg font-bold text-slate-800">Current Bill Snapshot</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Bill ID:</strong> {selectedBill.id}</p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Status:</strong> {selectedBill.status}</p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Vendor:</strong> {selectedBill.vendor}</p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><strong>Uploaded By:</strong> {selectedBill.uploadedBy || "N/A"}</p>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

