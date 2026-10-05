import { REQUISITOS_SENHA } from "@/lib/politica-senha";
export function PasswordRequirements({ value }) {
  const senha = String(value ?? "");
  return <ul className="grid gap-1 text-xs text-app-cinza">{REQUISITOS_SENHA.map(([chave, label, validar]) => <li key={chave} className={validar(senha) ? "text-emerald-700" : ""}>{validar(senha) ? "✓" : "○"} {label}</li>)}</ul>;
}
