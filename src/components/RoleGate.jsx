export default function RoleGate({ allowed, userRole, children }) {
  if (!allowed) {
    return (
      <div className="panel rounded-2xl p-8 text-center shadow-panel">
        <h2 className="page-title text-2xl font-semibold">Access Restricted</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {userRole} role does not have permission to view this module.
        </p>
      </div>
    );
  }

  return children;
}
