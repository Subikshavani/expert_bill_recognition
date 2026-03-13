import { LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function EmployeeLoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/employee/login", {
        method: "POST",
        body: { email, password },
      });
      onLogin(response);
      navigate("/employee/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
      <div className="absolute inset-0 bg-slate-50" />
      <div className="panel relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400 text-slate-900">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Expense Management</p>
          <h1 className="page-title mt-2 text-2xl font-bold text-slate-800">Employee Login</h1>
          <p className="mt-2 text-sm text-slate-400">Access your bills, status, and profile</p>
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
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-400/70"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400/70"
              required
            />
          </label>

          {error ? <p className="text-xs text-blue-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

