"use client";

import { useInterface } from "@/lib/use-interface";
import { useTemaLocal } from "@/lib/use-tema-local";

function IconeTema({ tema }) {
    const caminho = tema === "claro"
        ? "M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
        : "M21 12.8A8 8 0 1 1 11.2 3a6 6 0 0 0 9.8 9.8z";

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path d={caminho} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

export function SeletorTema() {
    const { ui } = useInterface();
    const { tema, atualizarTema } = useTemaLocal();
    const opcoes = [
        {
            valor: "claro",
            titulo: "Modo claro",
        },
        {
            valor: "escuro",
            titulo: "Modo escuro",
        },
    ];

    return (
        <fieldset className="mt-5 pt-1">
            <legend className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Aparencia")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
                {opcoes.map((opcao) => {
                    const selecionado = tema === opcao.valor;

                    return (
                        <label
                            key={opcao.valor}
                            className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-[8px] border p-4 transition focus-within:ring-2 focus-within:ring-app-caramelo-torrado/40 ${
                                selecionado
                                    ? "border-app-caramelo-torrado bg-app-creme-suave"
                                    : "border-app-baunilha-dourada/65 bg-app-creme-leve hover:border-app-caramelo-torrado/70"
                            }`}
                        >
                            <input
                                type="radio"
                                name="tema-aplicacao"
                                value={opcao.valor}
                                checked={selecionado}
                                onChange={() => atualizarTema(opcao.valor)}
                                className="h-4 w-4 shrink-0 accent-app-caramelo-torrado"
                            />
                            <span className="flex min-w-0 items-center gap-2.5">
                                <span aria-hidden="true" className="text-app-caramelo-torrado">
                                    <IconeTema tema={opcao.valor} />
                                </span>
                                <strong className="block truncate text-sm text-app-cafe-profundo">
                                    {ui(opcao.titulo)}
                                </strong>
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
