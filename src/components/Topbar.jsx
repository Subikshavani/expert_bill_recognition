import { Menu, MoonStar, SunMedium } from "lucide-react";

export default function Topbar({ role, setRole, roleOptions, darkMode, setDarkMode, onMenuClick }) {
  return (
    <header className="panel sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-panel">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-300 p-2 dark:border-slate-700 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h2 className="page-title text-lg font-bold">Expense Bill Approval System</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Multi-role workflow and compliance dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        >
          {roleOptions.map((item) => (
            <option key={item} value={item} className="text-slate-900">
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-lg border border-slate-300 p-2 dark:border-slate-700"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
