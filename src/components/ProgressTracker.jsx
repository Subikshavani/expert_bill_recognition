const defaultStages = [
  "Uploaded",
  "Accounts Review",
  "Manager Approval",
  "Finance Approval",
  "Payment Completed",
];

export default function ProgressTracker({ stage = 1, stages = defaultStages, timeline = [] }) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 backdrop-blur-md">
      <div>
        <h3 className="page-title text-base font-bold text-slate-800">Bill Progress</h3>
        <p className="text-xs text-slate-400">Track approval checkpoints in real time.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {stages.map((name, index) => {
          const current = index + 1;
          const reached = current <= stage;
          return (
            <div key={name} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    reached
                      ? "bg-blue-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.65)]"
                      : "bg-slate-700 text-slate-600"
                  }`}
                >
                  {current}
                </span>
                <p className="text-xs font-semibold text-slate-600">{name}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Approval Timeline</h4>
        {timeline.length ? (
          <ul className="space-y-2">
            {timeline.map((item, idx) => (
              <li key={`${item.billId}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <p className="font-semibold text-blue-600">{item.action}</p>
                <p>
                  {item.user} â€¢ {item.timestamp}
                </p>
                <p className="text-slate-400">{item.comments || "No remarks"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-400">No timeline events available.</p>
        )}
      </div>
    </div>
  );
}

