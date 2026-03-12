import { useCallback, useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import { createAdvanceRequest, getAdvanceRequests, approveAdvanceRequest } from "../api/features";

export default function AdvanceRequestsPage({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tripName: "",
    amount: "",
    purpose: "",
    requestDate: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("pending");

  const fetchRequests = useCallback(async () => {
    if (!user?.email) {
      setError("User email not found");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getAdvanceRequests({
        email: user.email,
        status: filter,
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch advance requests error:", err);
      setError(err.message || "Failed to load requests. Please try again.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email, filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tripName || !form.amount || !form.purpose) {
      setError("All fields are required");
      return;
    }
    try {
      await createAdvanceRequest({
        employeeEmail: user.email,
        employeeName: user.name,
        ...form,
        amount: parseFloat(form.amount),
      });
      setSuccess("Advance request submitted");
      setForm({ tripName: "", amount: "", purpose: "", requestDate: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      fetchRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit request");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-emerald-400" />;
      case "rejected":
        return <XCircle size={16} className="text-rose-400" />;
      case "pending":
        return <Clock size={16} className="text-yellow-400" />;
      case "settled":
        return <CheckCircle size={16} className="text-cyan-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100/20 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "rejected":
        return "bg-rose-100/20 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400";
      case "pending":
        return "bg-yellow-100/20 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "settled":
        return "bg-cyan-100/20 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel">
        <p className="text-slate-400">Loading requests...</p>
      </section>
    );
  }

  if (error && requests.length === 0 && !showForm) {
    return (
      <section className="space-y-5">
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h2 className="page-title text-2xl font-bold">Advance Requests</h2>
          <p className="mt-2 text-sm text-slate-400">Request and manage trip advances</p>
        </div>
        <div className="panel rounded-2xl border border-rose-200/30 bg-rose-500/5 p-8 shadow-panel dark:border-rose-800/30 dark:bg-rose-900/10">
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{error}</p>
          <button
            onClick={() => fetchRequests()}
            className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-medium transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-6 shadow-panel">
        <h2 className="page-title text-2xl font-bold">Advance Requests</h2>
        <p className="mt-2 text-sm text-slate-400">Request and manage trip advances</p>
      </div>

      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "settled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === s
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={18} /> Request Advance
        </Button>
      </div>

      {showForm && (
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h3 className="text-lg font-semibold mb-4">New Advance Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <FormInput
                label="Trip Name"
                value={form.tripName}
                onChange={(e) => setForm({ ...form, tripName: e.target.value })}
                placeholder="e.g., Delhi Sales Trip"
                required
              />
              <FormInput
                label="Amount (₹)"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="25000"
                required
              />
              <FormInput
                label="Purpose"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="Travel, accommodation..."
                required
              />
              <FormInput
                label="Request Date"
                type="date"
                value={form.requestDate}
                onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Submit Request</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.advanceId} className="panel rounded-2xl border border-slate-200 p-4 shadow-panel dark:border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{req.tripName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{req.purpose}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(req.requestStatus)}`}>
                  {getStatusIcon(req.requestStatus)}
                  {req.requestStatus.charAt(0).toUpperCase() + req.requestStatus.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-400">Requested Amount</p>
                <p className="font-semibold text-cyan-500">₹{req.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Request Date</p>
                <p className="font-semibold text-slate-600 dark:text-slate-300">{req.requestDate}</p>
              </div>
              {req.requestStatus === "settled" && (
                <div>
                  <p className="text-xs text-slate-400">Settled Amount</p>
                  <p className="font-semibold text-emerald-500">₹{req.settlementAmount.toLocaleString()}</p>
                </div>
              )}
            </div>

            {req.approvalComments && (
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-xs">
                <p className="text-slate-400 font-semibold">Approver Notes</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{req.approvalComments}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {requests.length === 0 && !showForm && (
        <div className="panel rounded-2xl border border-slate-200 p-8 text-center shadow-panel dark:border-slate-700">
          <p className="text-slate-400">No advance requests. Create one for your next trip!</p>
        </div>
      )}
    </section>
  );
}
