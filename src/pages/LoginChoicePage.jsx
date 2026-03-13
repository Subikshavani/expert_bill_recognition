import { ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

export default function LoginChoicePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Expense Bill Approval</p>
          <h1 className="page-title mt-2 text-2xl font-bold text-slate-800">Choose Login Type</h1>
          <p className="mt-2 text-sm text-slate-500">Select how you want to continue.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            to="/admin/login"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Admin Login</h2>
            <p className="mt-1 text-sm text-slate-500">Manager and admin dashboard access.</p>
          </Link>

          <Link
            to="/employee/login"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Employee Login</h2>
            <p className="mt-1 text-sm text-slate-500">Upload bills and track approval status.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

