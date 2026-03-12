import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import FormInput from "../components/FormInput";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { useApi } from "../hooks/useApi";

export default function EmployeesListPage() {
  const { data, loading, error } = useApi("/users");
  const users = data ?? [];
  const [search, setSearch] = useState("");
  const [localUsers, setLocalUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const sourceUsers = localUsers.length ? localUsers : users;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sourceUsers;

    return sourceUsers.filter((user) => {
      return [user.name, user.email, user.role, user.department].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [search, sourceUsers]);

  const deleteLocal = (userId) => {
    setLocalUsers((prev) => {
      const base = prev.length ? prev : users;
      return base.filter((item) => item.id !== userId);
    });
  };

  const saveEdit = () => {
    setLocalUsers((prev) => {
      const base = prev.length ? prev : users;
      return base.map((item) => (item.id === editingUser.id ? editingUser : item));
    });
    setEditingUser(null);
  };

  if (loading) return <LoadingSpinner message="Loading employees..." />;
  if (error) return <p className="p-4 text-rose-400">Error: {error}</p>;

  const columns = [
    {
      key: "name",
      header: "Employee Name",
      render: (row) => <p className="font-semibold text-slate-100">{row.name}</p>,
    },
    { key: "email", header: "Email" },
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
          <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setEditingUser({ ...row })}>
            Edit
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="border-rose-300/30 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/10"
            onClick={() => deleteLocal(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="panel rounded-2xl p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="page-title text-xl font-bold text-slate-100">Employees List</h2>
            <p className="text-sm text-slate-400">Manage and review employee access.</p>
          </div>
          <div className="w-full max-w-sm">
            <FormInput
              label="Search"
              placeholder="Search by name, email, role, department"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <DataTable columns={columns} rows={filteredUsers} pageSize={8} emptyText="No employees found." />
        </div>
      </div>

      <Modal
        open={!!editingUser}
        title="Edit Employee"
        onClose={() => setEditingUser(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveEdit}>
              Save
            </Button>
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
