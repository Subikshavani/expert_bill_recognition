import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Sun, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ role, onMenuClick, onLogout, profileLabel = "Admin" }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { isDark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 mb-6 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg border border-slate-200 p-2 md:hidden" onClick={onMenuClick}>
            <Menu className="h-4 w-4 text-slate-800" />
          </button>
          <div className="relative hidden min-w-72 md:block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              placeholder="Search bills, users, actions..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:border-blue-400/70"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-blue-600 md:text-sm">
            {role}
          </div>

          <button
            type="button"
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-400"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Bell className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 md:text-sm"
            >
              <UserCircle2 className="h-4 w-4" />
              {profileLabel}
              <ChevronDown className="h-4 w-4" />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-2xl">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

