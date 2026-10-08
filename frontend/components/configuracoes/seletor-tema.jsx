"use client";

import { Moon, SunMedium } from "lucide-react";
import { useInterface } from "@/lib/use-interface";
import { useTemaLocal } from "@/lib/use-tema-local";

function IconeTema({ tema }) {
    const Icone = tema === "claro" ? SunMedium : Moon;

    return <Icone aria-hidden="true" className="h-5 w-5" fill={tema === "escuro" ? "currentColor" : "none"} strokeWidth={1.8} />;
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
