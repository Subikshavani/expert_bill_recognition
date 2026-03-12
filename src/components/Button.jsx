export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const baseClass =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

  const variantClass =
    variant === "secondary"
      ? "border border-white/15 bg-slate-950/50 text-slate-200 hover:bg-white/5"
      : "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-[0_10px_34px_rgba(56,189,248,0.35)] hover:-translate-y-0.5";

  return (
    <button type={type} className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
