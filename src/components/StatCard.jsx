export default function StatCard({ title, value, delta }) {
  return (
    <article className="fade-up group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-lg backdrop-blur-md transition hover:-translate-y-1">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl transition group-hover:bg-blue-500/25" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-800">{value}</p>
      <p className="mt-2 text-xs text-blue-500">{delta}</p>
    </article>
  );
}

