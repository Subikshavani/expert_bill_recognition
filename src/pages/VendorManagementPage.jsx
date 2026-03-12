import { useCallback, useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Plus } from "lucide-react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import { createVendor, getVendors, updateVendorStatus } from "../api/features";

export default function VendorManagementPage({ user }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("approved");
  const [form, setForm] = useState({
    vendorName: "",
    contactEmail: "",
    contactPhone: "",
    category: "Fuel",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVendors = useCallback(async () => {
    try {
      const data = await getVendors(filterStatus);
      setVendors(data || []);
    } catch {
      setError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendorName) {
      setError("Vendor name is required");
      return;
    }
    try {
      await createVendor(form);
      setSuccess("Vendor added successfully");
      setForm({ vendorName: "", contactEmail: "", contactPhone: "", category: "Fuel" });
      setShowForm(false);
      fetchVendors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to add vendor");
    }
  };

  const handleStatusChange = async (vendorId, newStatus) => {
    try {
      await updateVendorStatus(vendorId, newStatus);
      setSuccess("Vendor status updated");
      fetchVendors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} className="text-emerald-400" />;
      case "blacklisted":
        return <AlertCircle size={16} className="text-rose-400" />;
      case "pending":
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100/20 border-emerald-200/30 dark:bg-emerald-900/20 dark:border-emerald-800/30";
      case "blacklisted":
        return "bg-rose-100/20 border-rose-200/30 dark:bg-rose-900/20 dark:border-rose-800/30";
      case "pending":
        return "bg-yellow-100/20 border-yellow-200/30 dark:bg-yellow-900/20 dark:border-yellow-800/30";
      default:
        return "bg-slate-100/20 border-slate-200/30";
    }
  };

  if (loading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel">
        <p className="text-slate-400">Loading vendors...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-6 shadow-panel">
        <h2 className="page-title text-2xl font-bold">Vendor Management</h2>
        <p className="mt-2 text-sm text-slate-400">Manage vendors and track spending analytics</p>
      </div>

      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2">
          {["approved", "pending", "blacklisted"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={18} /> Add Vendor
        </Button>
      </div>

      {showForm && (
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h3 className="text-lg font-semibold mb-4">Add Vendor</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <FormInput
                label="Vendor Name"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                placeholder="e.g., Shell Petrol Pump"
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="vendor@example.com"
              />
              <FormInput
                label="Phone"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="9876543210"
              />
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700"
                >
                  <option>Fuel</option>
                  <option>Hotel</option>
                  <option>Courier</option>
                  <option>Travel</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Add Vendor</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div
            key={vendor.vendorId}
            className={`panel rounded-2xl border p-4 shadow-panel ${getStatusColor(vendor.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{vendor.vendorName}</h3>
                <div className="flex items-center gap-1 mt-1">
                  {getStatusIcon(vendor.status)}
                  <span className="text-xs capitalize">{vendor.status}</span>
                </div>
              </div>
            </div>

            {vendor.contactEmail && <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{vendor.contactEmail}</p>}
            {vendor.contactPhone && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{vendor.contactPhone}</p>}

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400">
                Total Spent: <span className="font-semibold text-slate-600 dark:text-slate-300">₹{vendor.totalSpent.toLocaleString()}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Bills: <span className="font-semibold">{vendor.billCount}</span>
              </p>
            </div>

            {vendor.status !== "approved" && (
              <button
                onClick={() => handleStatusChange(vendor.vendorId, "approved")}
                className="mt-3 w-full text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-1.5 rounded-lg transition-colors"
              >
                Approve
              </button>
            )}

            {vendor.status !== "blacklisted" && (
              <button
                onClick={() => handleStatusChange(vendor.vendorId, "blacklisted")}
                className="mt-2 w-full text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-1.5 rounded-lg transition-colors"
              >
                Blacklist
              </button>
            )}
          </div>
        ))}
      </div>

      {vendors.length === 0 && !showForm && (
        <div className="panel rounded-2xl border border-slate-200 p-8 text-center shadow-panel dark:border-slate-700">
          <p className="text-slate-400">No vendors found. Add one to get started!</p>
        </div>
      )}
    </section>
  );
}
