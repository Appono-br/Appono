"use client";

import { useInterface } from "@/lib/use-interface";
export function FormField({ label, className = "", ...props }) {
    const { ui } = useInterface();
  return (
    <label className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-app-cafe-profundo">
        {ui(label)}
      </span>

      <input
        {...props}
        className="h-8 rounded-xl border border-app-baunilha-dourada bg-white px-3 text-sm text-app-cafe-profundo outline-none transition placeholder:text-app-cinza/45 hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"
      />
    </label>
  );
}

export function SelectField({
  label,
  children,
  className = "",
  ...props
}) {
    const { ui } = useInterface();
  return (
    <label className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-app-cafe-profundo">
        {ui(label)}
      </span>

      <select
        {...props}
        className="h-8 rounded-xl border border-app-baunilha-dourada bg-white px-3 text-sm text-app-cafe-profundo outline-none transition hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"
      >
        {children}
      </select>
    </label>
  );
}
