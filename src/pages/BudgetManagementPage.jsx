import { useCallback, useEffect, useState } from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import { createBudget, getBudgets } from "../api/features";

export default function BudgetManagementPage({ user }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    budgetType: "employee",
    monthlyLimit: "",
    alertThreshold: 80,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const now = new Date();

  const fetchBudgets = useCallback(async () => {
    try {
      const data = await getBudgets({
        email: user?.email,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      setBudgets(data || []);
    } catch {
      setError("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [user?.email, now]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.monthlyLimit) {
      setError("Monthly limit is required");
      return;
    }
    try {
      await createBudget({
        department: user?.department || "General",
        employeeEmail: form.budgetType === "employee" ? user?.email : "",
        budgetType: form.budgetType,
        monthlyLimit: parseFloat(form.monthlyLimit),
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        alertThreshold: form.alertThreshold,
      });
      setSuccess("Budget set successfully");
      setForm({ budgetType: "employee", monthlyLimit: "", alertThreshold: 80 });
      setShowForm(false);
      fetchBudgets();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to create budget");
    }
  };

  const getProgressColor = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return "bg-rose-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-cyan-500";
  };

  const getStatusBadge = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return { text: "Exceeded", color: "text-rose-400" };
    if (percentage >= 80) return { text: "Alert", color: "text-yellow-400" };
    if (percentage >= 50) return { text: "Moderate", color: "text-cyan-400" };
    return { text: "Good", color: "text-emerald-400" };
  };

  if (loading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel">
        <p className="text-slate-400">Loading budgets...</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-6 shadow-panel">
        <h2 className="page-title text-2xl font-bold">Budget Management</h2>
        <p className="mt-2 text-sm text-slate-400">Monitor and set spending limits</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>Set Budget</Button>
      </div>

      {showForm && (
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h3 className="text-lg font-semibold mb-4">Set Budget Limit</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Budget Type</span>
                <select
                  value={form.budgetType}
                  onChange={(e) => setForm({ ...form, budgetType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700"
                >
                  <option value="employee">Personal (Employee)</option>
                  <option value="department">Department</option>
                </select>
              </label>
              <FormInput
                label="Monthly Limit (₹)"
                type="number"
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
                placeholder="50000"
                required
              />
              <FormInput
                label="Alert Threshold (%)"
                type="number"
                value={form.alertThreshold}
                onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
                min="1"
                max="100"
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Set Budget</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.monthlyLimit) * 100;
          const status = getStatusBadge(budget.spent, budget.monthlyLimit);
          const bgColor = getProgressColor(budget.spent, budget.monthlyLimit);

          return (
            <div key={budget.budgetId} className="panel rounded-2xl border border-slate-200 p-4 shadow-panel dark:border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {budget.budgetType === "employee" ? "Personal Budget" : "Department Budget"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {budget.year}-{String(budget.month).padStart(2, "0")}
                  </p>
                </div>
                <span className={`text-xs font-semibold ${status.color}`}>{status.text}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Spent: ₹{budget.spent.toLocaleString()}</span>
                  <span className="text-slate-400">Limit: ₹{budget.monthlyLimit.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${bgColor} transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <p className="text-xs text-slate-400">
                  Remaining: ₹{Math.max(0, budget.remaining).toLocaleString()} ({100 - Math.round(percentage)}%)
                </p>
              </div>

              {percentage > 80 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-100/20 border border-yellow-200/30 dark:bg-yellow-900/20 dark:border-yellow-800/30 p-2">
                  <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {percentage > 100
                      ? `Over by ₹${(budget.spent - budget.monthlyLimit).toLocaleString()}`
                      : `${Math.round(100 - percentage)}% remaining`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && !showForm && (
        <div className="panel rounded-2xl border border-slate-200 p-8 text-center shadow-panel dark:border-slate-700">
          <TrendingUp size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="text-slate-400">No budgets set yet. Create one to start tracking expenses.</p>
        </div>
      )}
    </section>
  );
}
