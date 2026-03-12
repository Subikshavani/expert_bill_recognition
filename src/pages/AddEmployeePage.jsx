import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roleOptions } from "../auth/permissions";
import { apiFetch } from "../api/client";
import Button from "../components/Button";
import FormInput from "../components/FormInput";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: roleOptions[0],
  department: "",
  password: "",
};

export default function AddEmployeePage() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/users", { method: "POST", body: form });
      navigate("/employees", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="panel rounded-2xl p-6 shadow-panel">
        <h2 className="page-title text-xl font-bold text-slate-800">Add Employee</h2>
        <p className="mt-1 text-sm text-slate-400">Create employee accounts before enabling bill workflows.</p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormInput
            label="Employee Name"
            value={form.name}
            placeholder="Enter full name"
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <FormInput
            label="Email"
            type="email"
            value={form.email}
            placeholder="employee@company.com"
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <FormInput
            label="Phone Number"
            value={form.phone}
            placeholder="+91 98765 43210"
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            required
          />

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400/70"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role} className="text-slate-900">
                  {role}
                </option>
              ))}
            </select>
          </label>

          <FormInput
            label="Department"
            value={form.department}
            placeholder="Operations"
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            required
          />
          <FormInput
            label="Password"
            type="password"
            value={form.password}
            placeholder="Set temporary password"
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />

          {error ? <p className="md:col-span-2 text-sm text-rose-300">{error}</p> : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Adding Employee..." : "Add Employee"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm(emptyForm);
                setError("");
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
