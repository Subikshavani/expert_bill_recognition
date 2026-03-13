import { useCallback, useEffect, useState } from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import { createBudget, deleteBudget, getBudgets } from "../api/features";

export default function BudgetManagementPage({ user }) {
  const isAdminView = !user?.email;
  const canAddBudget = isAdminView;
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    budgetType: isAdminView ? "department" : "employee",
    monthlyLimit: "",
    alertThreshold: 80,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBudgets = useCallback(async () => {
    const now = new Date();
    setLoading(true);
    setError("");
    try {
      const filters = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      };
      if (user?.email) filters.email = user.email;

      const data = await getBudgets(filters);
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch budgets error:", err);
      setError(err.message || "Failed to load budgets. Please try again.");
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date();
    if (!form.monthlyLimit) {
      setError("Monthly limit is required");
      return;
    }
    try {
      await createBudget({
        department: user?.department || "General",
        employeeEmail: form.budgetType === "employee" ? (user?.email || "") : "",
        budgetType: form.budgetType,
        monthlyLimit: parseFloat(form.monthlyLimit),
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        alertThreshold: form.alertThreshold,
      });
      setSuccess("Budget set successfully");
      setForm({ budgetType: isAdminView ? "department" : "employee", monthlyLimit: "", alertThreshold: 80 });
      setShowForm(false);
      fetchBudgets();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to create budget");
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!budgetId) return;
    const confirmed = window.confirm("Delete this budget? This action can be restored only by creating it again.");
    if (!confirmed) return;

    try {
      await deleteBudget(budgetId);
      setSuccess("Budget deleted successfully");
      fetchBudgets();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete budget");
    }
  };

  const getProgressColor = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return "bg-blue-500";
    if (percentage >= 80) return "bg-blue-500";
    return "bg-blue-500";
  };

  const getStatusBadge = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return { text: "Exceeded", color: "text-blue-400" };
    if (percentage >= 80) return { text: "Alert", color: "text-blue-400" };
    if (percentage >= 50) return { text: "Moderate", color: "text-blue-400" };
    return { text: "Good", color: "text-blue-400" };
  };

  if (loading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel">
        <p className="text-slate-400">Loading budgets...</p>
      </section>
    );
  }

  if (error && budgets.length === 0 && !showForm) {
    return (
      <section className="space-y-5">
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h2 className="page-title text-2xl font-bold">Budget Management</h2>
          <p className="mt-2 text-sm text-slate-400">Monitor and set spending limits</p>
        </div>
        <div className="panel rounded-2xl border border-blue-200/30 bg-blue-500/5 p-8 shadow-panel dark:border-blue-800/30 dark:bg-blue-900/10">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">{error}</p>
          <button
            onClick={() => fetchBudgets()}
            className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 font-medium transition-colors text-sm"
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
        <h2 className="page-title text-2xl font-bold">Budget Management</h2>
        <p className="mt-2 text-sm text-slate-400">
          {isAdminView ? "Monitor and set organization budget limits" : "Monitor and set spending limits"}
        </p>
      </div>

      {canAddBudget ? (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)}>Set Budget</Button>
        </div>
      ) : null}

      {canAddBudget && showForm && (
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
                  {!isAdminView ? <option value="employee">Personal (Employee)</option> : null}
                  <option value="department">Department</option>
                </select>
              </label>
              <FormInput
                label="Monthly Limit (â‚¹)"
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
            {error && <p className="text-sm text-blue-400">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Set Budget</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {success && <p className="text-sm text-blue-400">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const spent = Number(budget.spent) || 0;
          const monthlyLimit = Number(budget.monthlyLimit) || 0;
          const remaining = Number(budget.remaining) || Math.max(0, monthlyLimit - spent);
          const percentage = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0;
          const status = getStatusBadge(spent, monthlyLimit);
          const bgColor = getProgressColor(spent, monthlyLimit);

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
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${status.color}`}>{status.text}</span>
                  {canAddBudget ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(budget.budgetId)}
                      className="rounded-md border border-blue-300 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Spent: â‚¹{spent.toLocaleString()}</span>
                  <span className="text-slate-400">Limit: â‚¹{monthlyLimit.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${bgColor} transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
                <p className="text-xs text-slate-400">
                  Remaining: â‚¹{Math.max(0, remaining).toLocaleString()} ({Math.max(0, 100 - Math.round(percentage))}%)
                </p>
                {typeof budget.totalBills === "number" ? (
                  <p className="text-xs text-slate-500">
                    OCR analyzed {budget.analyzedBills || 0}/{budget.totalBills} bills ({budget.analysisCoverage || 0}% coverage)
                  </p>
                ) : null}
              </div>

              {percentage > 80 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-100/20 border border-blue-200/30 dark:bg-blue-900/20 dark:border-blue-800/30 p-2">
                  <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {percentage > 100
                      ? `Over by â‚¹${(budget.spent - budget.monthlyLimit).toLocaleString()}`
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

