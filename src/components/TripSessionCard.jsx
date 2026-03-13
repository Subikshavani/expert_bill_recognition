import { useState } from "react";
import { Briefcase, Calendar, CheckCircle2, PlayCircle, StopCircle } from "lucide-react";
import { startSession, endSession } from "../api/tripSession";

function formatDate(iso) {
  if (!iso) return "â€”";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
        isActive
          ? "bg-blue-400/15 text-blue-600 border border-blue-400/40"
          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-blue-500 animate-pulse" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

export default function TripSessionCard({ session, user, onSessionChange }) {
  const [showStartForm, setShowStartForm] = useState(false);
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) { setError("Trip name is required."); return; }
    setError("");
    setLoading(true);
    try {
      const newSession = await startSession({
        employeeId: user?.id || "",
        employeeEmail: user?.email || "",
        tripName: tripName.trim(),
        startDate,
      });
      setShowStartForm(false);
      setTripName("");
      onSessionChange(newSession);
    } catch (err) {
      setError(err.message || "Failed to start trip.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!session?.sessionId) return;
    setLoading(true);
    try {
      const updated = await endSession(session.sessionId);
      onSessionChange(updated);
    } catch (err) {
      setError(err.message || "Failed to end trip.");
    } finally {
      setLoading(false);
    }
  };

  const isActive = session?.sessionStatus === "Active";

  return (
    <div className="panel rounded-2xl p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-500" />
          <h3 className="page-title text-lg font-bold text-slate-800 dark:text-slate-100">Trip Session</h3>
        </div>
        {session && <StatusBadge status={session.sessionStatus} />}
      </div>

      {session ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Trip Name</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{session.tripName}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{session.sessionStatus}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Start Date
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{formatDate(session.startDate)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> End Date
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{session.endDate ? formatDate(session.endDate) : "Ongoing"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {isActive ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleEnd}
                className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              >
                <StopCircle className="h-4 w-4" />
                {loading ? "Ending..." : "End Trip Session"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowStartForm(true)}
                className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              >
                <PlayCircle className="h-4 w-4" />
                Start New Trip Session
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">No active trip session.</p>
          <p className="text-xs text-slate-400">Start a trip to enable bill uploads.</p>
          <button
            type="button"
            onClick={() => setShowStartForm(true)}
            className="mt-3 mx-auto flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2 text-sm font-bold text-white"
          >
            <PlayCircle className="h-4 w-4" />
            Start Trip Session
          </button>
        </div>
      )}

      {/* Inline start-trip form */}
      {showStartForm && (
        <form onSubmit={handleStart} className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">New Trip Session</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trip Name *</span>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. Client Visit â€“ Chennai"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Start Date *</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </label>
          </div>
          {error && <p className="text-xs text-blue-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? "Starting..." : "Confirm Start"}
            </button>
            <button
              type="button"
              onClick={() => { setShowStartForm(false); setError(""); }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

