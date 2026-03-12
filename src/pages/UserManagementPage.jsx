import { useMemo, useState } from "react";
import { roleOptions } from "../auth/permissions";
import { apiFetch } from "../api/client";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { useApi } from "../hooks/useApi";

const emptyForm = {
  name: "",
  email: "",
  role: roleOptions[0],
  department: "",
};

export default function UserManagementPage() {
  const { data, loading, error, refetch } = useApi("/users");
  const users = data ?? [];
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [localUsers, setLocalUsers] = useState([]);

  const displayUsers = localUsers.length ? localUsers : users;

  const activeCount = useMemo(
    () => displayUsers.filter((user) => user.status === "Active").length,
    [displayUsers]
  );

  const addUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/users", { method: "POST", body: form });
      setForm(emptyForm);
      setLocalUsers([]);
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (userId) => {
    try {
      await apiFetch(`/users/${userId}`, { method: "PATCH" });
      setLocalUsers([]);
      refetch();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteLocal = (userId) => {
    setLocalUsers((prev) => {
      const source = prev.length ? prev : users;
      return source.filter((item) => item.id !== userId);
    });
  };

  const saveEdit = () => {
    setLocalUsers((prev) => {
      const source = prev.length ? prev : users;
      return source.map((item) => (item.id === editingUser.id ? editingUser : item));
    });
    setEditingUser(null);
  };

  if (loading) return <LoadingSpinner message="Loading employees..." />;
  if (error) return <p className="p-4 text-rose-400">Error: {error}</p>;

  const columns = [
    {
      key: "name",
      header: "Employee Name",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-100">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    { key: "role", header: "Role" },
    { key: "department", header: "Department" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            row.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditingUser({ ...row })}
            className="rounded-lg border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-400/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => deleteLocal(row.id)}
            className="rounded-lg border border-rose-300/30 px-2 py-1 text-xs text-rose-200 hover:bg-rose-400/10"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => toggleStatus(row.id)}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
          >
            {row.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="page-title text-xl font-bold text-slate-100">User Management</h2>
          <p className="text-xs text-slate-400">Active employees: {activeCount}</p>
        </div>

        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={addUser}>
          <FormInput
            label="Employee Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Enter full name"
            required
          />
          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="employee@company.com"
            required
          />

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100"
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
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            placeholder="Finance"
            required
          />

          <div className="flex items-end">
            <button
              className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      </div>

      <DataTable columns={columns} rows={displayUsers} pageSize={7} emptyText="No employees found." />

      <Modal
        open={!!editingUser}
        title="Edit Employee"
        onClose={() => setEditingUser(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950"
            >
              Save
            </button>
          </>
        }
      >
        {editingUser ? (
          <div className="grid gap-3 md:grid-cols-2">
            <FormInput
              label="Employee Name"
              value={editingUser.name}
              onChange={(event) => setEditingUser((prev) => ({ ...prev, name: event.target.value }))}
            />
            <FormInput
              label="Email"
              value={editingUser.email}
              onChange={(event) => setEditingUser((prev) => ({ ...prev, email: event.target.value }))}
            />
            <FormInput
              label="Department"
              value={editingUser.department}
              onChange={(event) => setEditingUser((prev) => ({ ...prev, department: event.target.value }))}
            />
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
