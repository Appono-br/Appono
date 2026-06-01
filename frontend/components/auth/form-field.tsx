import { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type FormFieldProps = {
  label: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({ label, className = "", ...props }: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-app-cafe-profundo">
        {label}
      </span>
      <input
        {...props}
        className="h-8 border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm text-app-cafe-profundo outline-none transition placeholder:text-app-cinza/45 hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  label,
  children,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <label className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-app-cafe-profundo">
        {label}
      </span>
      <select
        {...props}
        className="h-8 border border-app-baunilha-dourada bg-app-chantilly px-3 text-sm text-app-cafe-profundo outline-none transition hover:border-app-caramelo-torrado focus:border-app-dourado-mel focus:ring-2 focus:ring-app-dourado-mel/20"
      >
        {children}
      </select>
    </label>
  );
}
