import { Check } from "lucide-react";
import { REQUISITOS_SENHA } from "@/lib/politica-senha";

export function PasswordRequirements({ value, variant = "simple" }) {
  const senha = String(value ?? "");

  if (variant === "simple") {
    return <ul className="grid gap-1 text-xs text-app-cinza">{REQUISITOS_SENHA.map(([chave, label, validar]) => <li key={chave} className={validar(senha) ? "text-emerald-700" : ""}>{validar(senha) ? "✓" : "○"} {label}</li>)}</ul>;
  }

  return (
    <div>
      <p className="text-xs font-semibold text-app-cafe-profundo">
        Sua senha precisa ter:
      </p>
      <ul className="mt-2 grid gap-1.5">
        {REQUISITOS_SENHA.map(([chave, label, validar]) => {
          const concluido = validar(senha);

          return (
            <li
              key={chave}
              className={`flex items-center gap-2 text-xs leading-4 transition-colors ${
                concluido ? "text-app-verde-sucesso" : "text-app-cinza"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  concluido
                    ? "border-app-verde-sucesso/25 bg-app-verde-sucesso-claro text-app-verde-sucesso"
                    : "border-app-baunilha-dourada/45"
                }`}
              >
                {concluido && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span>
                {label}
                <span className="sr-only">
                  {concluido ? ": concluído" : ": pendente"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
