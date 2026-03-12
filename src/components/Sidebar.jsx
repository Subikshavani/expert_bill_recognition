import {
  Activity,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const iconMap = {
  dashboard: LayoutDashboard,
  userAdd: UserRoundPlus,
  upload: FilePlus2,
  myBills: ClipboardList,
  billStatus: ClipboardList,
  users: Users,
  logout: LogOut,
};

export default function Sidebar({ navItems, open, onClose, onLogout }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-slate-950/70 transition md:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-30 h-full w-72 border-r border-white/10 bg-slate-900/75 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.7)] backdrop-blur-xl transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Enterprise Suite</p>
            <h1 className="page-title text-xl font-bold text-slate-100">Expense Approval</h1>
          </div>
          <button className="text-slate-300 md:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-xs text-cyan-100">
          Active Environment: Production Preview
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || Activity;
            if (item.action === "logout") {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={onLogout}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  <Icon className="h-4 w-4 transition group-hover:scale-105" />
                  {item.label}
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-[0_10px_30px_rgba(56,189,248,0.35)]"
                      : "text-slate-300 hover:bg-white/5"
                  }`
                }
              >
                <Icon className="h-4 w-4 transition group-hover:scale-105" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
