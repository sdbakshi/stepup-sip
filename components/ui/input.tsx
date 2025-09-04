import * as React from "react";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = "", ...props }, ref) => (<input ref={ref} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring focus:ring-slate-200 ${className}`} {...props} />));
Input.displayName = "Input";
