import * as React from "react";
type Props = { checked: boolean; onCheckedChange: (v: boolean) => void };
export function Switch({ checked, onCheckedChange }: Props) { return (<button onClick={() => onCheckedChange(!checked)} className={`relative w-12 h-6 rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-300"}`} aria-pressed={checked}><span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-6" : ""}`} /></button>); }
