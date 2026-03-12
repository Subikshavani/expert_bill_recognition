import { LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("manager@enterprise.com");
  const [password, setPassword] = useState("Manager@123");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (email.toLowerCase() === "manager@enterprise.com" && password === "Manager@123") {
      onLogin();
      return;
    }
    setError("Invalid admin credentials. Try manager@enterprise.com / Manager@123");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(147,51,234,0.24),transparent_35%),linear-gradient(160deg,#020617_0%,#0f172a_50%,#111827_100%)]" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/70 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.75)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-400 text-slate-900">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Company Logo</p>
          <h1 className="page-title mt-2 text-2xl font-bold text-slate-100">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-400">Secure access to Expense Bill Approval System</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400/70"
                required
              />
            </div>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/70"
              required
            />
          </label>

          {error ? <p className="text-xs text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-[0_10px_40px_rgba(56,189,248,0.4)] transition hover:scale-[1.01]"
          >
            Login To Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
