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
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      : "bg-blue-500 text-white shadow-[0_10px_30px_rgba(6,182,212,0.35)] hover:-translate-y-0.5";

  return (
    <button type={type} className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

