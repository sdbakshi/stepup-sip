import * as React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "secondary" };
export function Button({ className = "", variant="default", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition border";
  const styles = { default: "bg-slate-900 text-white border-slate-900 hover:opacity-90", outline: "bg-white text-slate-900 border-slate-300 hover:bg-slate-50", secondary: "bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200" } as const;
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
