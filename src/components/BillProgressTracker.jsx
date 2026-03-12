const STAGES = [
  "Uploaded",
  "Under Accounts Review",
  "Manager Approval",
  "Finance Approval",
  "Approved / Rejected",
];

export default function BillProgressTracker({ stage = 1 }) {
  return (
    <div className="panel rounded-2xl p-5">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Bill Processing Stages</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        {STAGES.map((step, index) => {
          const reached = stage > index;
          return (
            <div key={step} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  reached
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {index + 1}
              </span>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{step}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
