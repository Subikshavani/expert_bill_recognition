import { useEffect, useState } from "react";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { getTripAnalytics, computeTripAnalytics } from "../api/features";

export default function TripAnalyticsPage({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");

  const handleFetchAnalytics = async () => {
    if (!sessionId) {
      setError("Session ID is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Try to compute first, then fetch
      try {
        await computeTripAnalytics(sessionId);
      } catch {
        // If compute fails, just fetch existing
      }
      const data = await getTripAnalytics(sessionId);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel">
        <p className="text-slate-400">Loading analytics...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-6 shadow-panel">
        <h2 className="page-title text-2xl font-bold">Trip Analytics</h2>
        <p className="mt-2 text-sm text-slate-400">View spending breakdown and trip summary</p>
      </div>

      <div className="panel rounded-2xl p-6 shadow-panel">
        <h3 className="text-lg font-semibold mb-4">Search Trip</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter Session ID (e.g., TRIP-1234567890)"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />
          <button
            onClick={handleFetchAnalytics}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors"
          >
            Load
          </button>
        </div>
        {error && <p className="text-sm text-rose-400 mt-2">{error}</p>}
      </div>

      {analytics && (
        <div className="space-y-5">
          {/* Header Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel rounded-2xl border border-slate-200 p-4 shadow-panel dark:border-slate-700">
              <h3 className="text-sm text-slate-400 uppercase tracking-wider">Trip Name</h3>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{analytics.tripName}</p>
            </div>
            <div className="panel rounded-2xl border border-slate-200 p-4 shadow-panel dark:border-slate-700">
              <h3 className="text-sm text-slate-400 uppercase tracking-wider">Duration</h3>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-2">
                {analytics.startDate} {analytics.endDate && `→ ${analytics.endDate}`}
              </p>
            </div>
          </div>

          {/* Expense Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel rounded-2xl border border-cyan-200/30 bg-cyan-500/5 p-4 shadow-panel dark:border-cyan-800/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Total Bills</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{analytics.totalBills}</p>
            </div>
            <div className="panel rounded-2xl border border-cyan-200/30 bg-cyan-500/5 p-4 shadow-panel dark:border-cyan-800/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Total Amount</p>
              <p className="text-3xl font-bold text-cyan-500 mt-2">₹{analytics.totalAmount.toLocaleString()}</p>
            </div>
            <div className="panel rounded-2xl border border-emerald-200/30 bg-emerald-500/5 p-4 shadow-panel dark:border-emerald-800/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Approved</p>
              <p className="text-3xl font-bold text-emerald-500 mt-2">₹{analytics.approvedAmount.toLocaleString()}</p>
            </div>
            <div className="panel rounded-2xl border border-yellow-200/30 bg-yellow-500/5 p-4 shadow-panel dark:border-yellow-800/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-500 mt-2">₹{analytics.pendingAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(analytics.categoryBreakdown).length > 0 && (
            <div className="panel rounded-2xl border border-slate-200 p-6 shadow-panel dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-cyan-500" />
                Category Breakdown
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(analytics.categoryBreakdown).map(([category, amount]) => {
                  const percentage = (amount / analytics.totalAmount) * 100;
                  return (
                    <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{category}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">₹{amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                          <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{Math.round(percentage)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advance Summary */}
          {(analytics.advanceRequested > 0 || analytics.advanceApproved > 0) && (
            <div className="panel rounded-2xl border border-slate-200 p-6 shadow-panel dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Advance Summary</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-xs text-slate-400">Requested</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                    ₹{analytics.advanceRequested.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Approved</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    ₹{analytics.advanceApproved.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                  <p className="text-xs text-cyan-600 dark:text-cyan-400">Settled</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
                    ₹{analytics.advanceSettled.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!analytics && !loading && (
        <div className="panel rounded-2xl border border-slate-200 p-8 text-center shadow-panel dark:border-slate-700">
          <BarChart3 size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="text-slate-400">Enter a session ID to view trip analytics</p>
        </div>
      )}
    </section>
  );
}
