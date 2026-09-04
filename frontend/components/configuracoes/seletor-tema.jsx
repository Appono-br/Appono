"use client";

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
    const { tema, atualizarTema } = useTemaLocal();
    const opcoes = [
        {
            valor: "claro",
            titulo: "Modo claro",
            descricao: "Fundo quente, cards claros e texto forte.",
        },
        {
            valor: "escuro",
            titulo: "Modo escuro",
            descricao: "Fundo profundo, superfícies separadas e acento dourado.",
        },
    ];

    return (
        <fieldset className="mx-auto mt-7 w-full max-w-xl rounded-[8px] bg-app-chantilly p-5 shadow-sm ring-1 ring-app-baunilha-dourada/45">
            <legend className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
                Aparencia
            </legend>
            <div className="mt-1 grid gap-3 sm:grid-cols-2">
                {opcoes.map((opcao) => {
                    const selecionado = tema === opcao.valor;

                    return (
                        <label
                            key={opcao.valor}
                            className={`flex cursor-pointer items-start gap-3 rounded-[8px] border p-4 transition ${
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
                                className="mt-1 h-4 w-4 shrink-0 accent-app-caramelo-torrado"
                            />
                            <span className="mt-0.5 text-app-caramelo-torrado">
                                <IconeTema tema={opcao.valor} />
                            </span>
                            <span>
                                <strong className="block text-sm text-app-cafe-profundo">
                                    {opcao.titulo}
                                </strong>
                                <span className="mt-1 block text-xs leading-5 text-app-cinza">
                                    {opcao.descricao}
                                </span>
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
