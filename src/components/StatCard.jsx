export default function StatCard({ title, value, delta }) {
  return (
    <article className="fade-up group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.5)] backdrop-blur-md transition hover:-translate-y-1">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl transition group-hover:bg-violet-500/25" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100">{value}</p>
      <p className="mt-2 text-xs text-cyan-300">{delta}</p>
    </article>
  );
}
