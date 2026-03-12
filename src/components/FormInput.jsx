export default function FormInput({ label, className = "", ...props }) {
  return (
    <label className={`space-y-2 text-sm ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15)]"
      />
    </label>
  );
}
