import LoadingSpinner from "../components/LoadingSpinner";
import { useApi } from "../hooks/useApi";

const order = [
  "Uploaded",
  "Under Accounts Review",
  "Manager Approval",
  "Finance Approval",
  "Payment Completed",
];

function normalizeStep(status) {
  if (status === "Approved") return "Payment Completed";
  return status;
}

export default function EmployeeBillStatusPage({ user }) {
  const email = encodeURIComponent(user?.email || "");
  const { data, loading, error } = useApi(`/employee/bills/status?email=${email}`);
  const rows = data ?? [];

  if (loading) return <LoadingSpinner message="Loading bill status..." />;
  if (error) return <p className="p-4 text-rose-300">Error: {error}</p>;

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <h2 className="page-title text-2xl font-bold text-slate-100">Bill Status Tracking</h2>
        <p className="mt-1 text-sm text-slate-400">Track where each bill sits in the approval flow.</p>
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="panel rounded-2xl p-4 text-sm text-slate-400">No bill status records available yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="panel rounded-2xl p-4 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300">{row.billNumber} • {row.vendor}</p>
                  <p className="text-xs text-slate-500">{row.date} • ${Number(row.amount).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">{row.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {order.map((step) => (
                  <span
                    key={step}
                    className={`rounded-lg border px-2 py-1 text-[11px] ${
                      step === normalizeStep(row.status)
                        ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-200"
                        : "border-white/10 bg-slate-950/35 text-slate-500"
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approval Timeline</p>
                <div className="mt-3 space-y-2">
                  {(row.timeline || []).length ? (
                    row.timeline.map((event, index) => (
                      <div key={`${event.action}-${event.timestamp}-${index}`} className="rounded-lg border border-white/10 bg-slate-900/60 p-2 text-xs text-slate-300">
                        <p>
                          <span className="font-semibold text-slate-200">{event.action}</span> by {event.user || "System"}
                        </p>
                        <p className="mt-1 text-slate-500">{event.timestamp || "-"}</p>
                        <p className="mt-1 text-slate-400">Remarks: {event.remarks || "-"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No timeline events yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
