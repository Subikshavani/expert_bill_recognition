import { CheckCircle2, Circle, Upload, Flag } from "lucide-react";

const STEPS = [
  { key: "started",   label: "Trip Started",     icon: CheckCircle2 },
  { key: "uploading", label: "Bills Uploading",   icon: Upload },
  { key: "completed", label: "Trip Completed",    icon: Flag },
];

function getStepIndex(session) {
  if (!session) return -1;
  if (session.sessionStatus === "Completed") return 2;
  return 1; // Active = at "uploading" step
}

export default function TripTimeline({ session }) {
  const currentStep = getStepIndex(session);

  return (
    <div className="panel rounded-2xl p-5 shadow-panel">
      <h3 className="page-title text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Trip Progress</h3>
      <ol className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const done    = idx < currentStep;
          const active  = idx === currentStep;
          const pending = idx > currentStep;
          const Icon    = step.icon;

          return (
            <li key={step.key} className="flex flex-1 flex-col items-center">
              {/* connector line before */}
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${done || active ? "bg-cyan-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    done
                      ? "border-cyan-400 bg-cyan-400 text-white"
                      : active
                      ? "border-cyan-400 bg-white text-cyan-500 shadow-[0_0_14px_rgba(34,211,238,0.5)] dark:bg-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${done ? "bg-cyan-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
              </div>
              <p className={`mt-2 text-center text-[11px] font-semibold ${
                active  ? "text-cyan-600 dark:text-cyan-400" :
                done    ? "text-slate-700 dark:text-slate-300" :
                          "text-slate-400"
              }`}>
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>

      {!session && (
        <p className="mt-3 text-center text-xs text-slate-400">Start a trip session to begin tracking.</p>
      )}
    </div>
  );
}
