import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, Copy } from "lucide-react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";
import { createTemplate, deleteTemplate, getTemplates } from "../api/features";

export default function BillTemplatesPage({ user }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    templateName: "",
    vendor: "",
    category: "Fuel",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTemplates = useCallback(async () => {
    if (!user?.email) {
      setError("User email not found");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getTemplates(user.email);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch templates error:", err);
      setError(err.message || "Failed to load templates. Please try again.");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.templateName || !form.vendor || !form.category) {
      setError("All fields are required");
      return;
    }
    if (!user?.email) {
      setError("User email not found");
      return;
    }
    try {
      await createTemplate({
        employeeEmail: user.email,
        ...form,
      });
      setSuccess("Template created successfully");
      setForm({ templateName: "", vendor: "", category: "Fuel", description: "" });
      setShowForm(false);
      fetchTemplates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Create template error:", err);
      setError(err.message || "Failed to create template");
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await deleteTemplate(templateId);
      setSuccess("Template deleted");
      fetchTemplates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete template");
    }
  };

  if (loading) {
    return (
      <section className="panel rounded-2xl p-6 shadow-panel">
        <p className="text-slate-400">Loading bill templates...</p>
      </section>
    );
  }

  if (error && templates.length === 0 && !showForm) {
    return (
      <section className="space-y-5">
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h2 className="page-title text-2xl font-bold">Bill Templates</h2>
          <p className="mt-2 text-sm text-slate-400">Create and manage reusable bill templates</p>
        </div>
        <div className="panel rounded-2xl border border-rose-200/30 bg-rose-500/5 p-8 shadow-panel dark:border-rose-800/30 dark:bg-rose-900/10">
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-4">{error}</p>
          <button
            onClick={() => fetchTemplates()}
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
        <h2 className="page-title text-2xl font-bold">Bill Templates</h2>
        <p className="mt-2 text-sm text-slate-400">Create and manage reusable bill templates</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={18} /> New Template
        </Button>
      </div>

      {showForm && (
        <div className="panel rounded-2xl p-6 shadow-panel">
          <h3 className="text-lg font-semibold mb-4">Create Template</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <FormInput
                label="Template Name"
                value={form.templateName}
                onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                placeholder="e.g., Frequent Fuel"
                required
              />
              <FormInput
                label="Vendor"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g., Shell"
                required
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
                </select>
              </label>
            </div>
            <FormInput
              label="Description (Optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add notes..."
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit">Create Template</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.templateId} className="panel rounded-2xl border border-slate-200 p-4 shadow-panel dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.templateName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vendor: {t.vendor}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Category: {t.category}</p>
            {t.description && <p className="text-xs text-slate-400 mt-2 italic">{t.description}</p>}
            <div className="flex gap-2 mt-4">
              <button className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-600">
                <Copy size={14} /> Use
              </button>
              <button
                onClick={() => handleDelete(t.templateId)}
                className="ml-auto text-xs text-rose-400 hover:text-rose-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showForm && (
        <div className="panel rounded-2xl border border-slate-200 p-8 text-center shadow-panel dark:border-slate-700">
          <p className="text-slate-400">No templates yet. Create your first template to get started!</p>
        </div>
      )}
    </section>
  );
}
