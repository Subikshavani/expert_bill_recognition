export default function EmployeeProfilePage({ user }) {
  return (
    <section className="panel rounded-2xl p-6 shadow-panel">
      <h2 className="page-title text-2xl font-bold text-slate-100">Profile Details</h2>
      <p className="mt-1 text-sm text-slate-400">Your employee account information.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Employee ID</p>
          <p className="mt-1 text-slate-100">{user?.id || "-"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Name</p>
          <p className="mt-1 text-slate-100">{user?.name || "-"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Email</p>
          <p className="mt-1 text-slate-100">{user?.email || "-"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Role</p>
          <p className="mt-1 text-slate-100">{user?.role || "-"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Department</p>
          <p className="mt-1 text-slate-100">{user?.department || "-"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Phone</p>
          <p className="mt-1 text-slate-100">{user?.phone || "-"}</p>
        </div>
      </div>
    </section>
  );
}
