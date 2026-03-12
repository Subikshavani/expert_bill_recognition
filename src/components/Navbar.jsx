import { Bell, ChevronDown, LogOut, Menu, Search, UserCircle2 } from "lucide-react";
import { useState } from "react";

export default function Navbar({ role, onMenuClick, onLogout, profileLabel = "Admin" }) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 mb-6 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-md shadow-[0_12px_35px_rgba(2,6,23,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg border border-white/15 p-2 md:hidden" onClick={onMenuClick}>
            <Menu className="h-4 w-4 text-slate-100" />
          </button>
          <div className="relative hidden min-w-72 md:block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              placeholder="Search bills, users, actions..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/70"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-cyan-200 md:text-sm">
            {role}
          </div>

          <button type="button" className="rounded-xl border border-white/10 bg-slate-950/60 p-2 text-slate-300 hover:text-cyan-200">
            <Bell className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 md:text-sm"
            >
              <UserCircle2 className="h-4 w-4" />
              {profileLabel}
              <ChevronDown className="h-4 w-4" />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-slate-900 p-2 text-xs shadow-2xl">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-200 hover:bg-white/5"
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
