"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export const EVENTO_NOTIFICACOES_ATUALIZADAS = "appono:notificacoes-atualizadas";

export function dispararAtualizacaoNotificacoes() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(EVENTO_NOTIFICACOES_ATUALIZADAS));
    }
}

function IconeSino({ className = "h-5 w-5" }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

export function LinkNotificacoes({ href }) {
    const [naoLidas, setNaoLidas] = useState(0);

    useEffect(() => {
        let ativo = true;
        function atualizarContador() {
            apiRequest("/notificacoes/contador")
                .then((resposta) => {
                    if (ativo) {
                        setNaoLidas(Number(resposta.nao_lidas ?? 0));
                    }
                })
                .catch(() => {
                    if (ativo) {
                        setNaoLidas(0);
                    }
                });
        }
        function atualizarQuandoVisivel() {
            if (document.visibilityState === "visible") {
                atualizarContador();
            }
        }
        atualizarContador();
        const intervalo = window.setInterval(atualizarContador, 30000);
        window.addEventListener(EVENTO_NOTIFICACOES_ATUALIZADAS, atualizarContador);
        document.addEventListener("visibilitychange", atualizarQuandoVisivel);
        return () => {
            ativo = false;
            window.clearInterval(intervalo);
            window.removeEventListener(EVENTO_NOTIFICACOES_ATUALIZADAS, atualizarContador);
            document.removeEventListener("visibilitychange", atualizarQuandoVisivel);
        };
    }, []);

    return (
        <Link href={href} className="relative transition hover:text-app-caramelo-torrado focus:outline-none focus:ring-2 focus:ring-app-dourado-mel" aria-label={naoLidas ? `${naoLidas} notificações não lidas` : "Notificações"}>
            <IconeSino />
            {naoLidas > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-app-vermelho-erro px-1 text-[10px] font-bold leading-none text-white">
                    {naoLidas > 9 ? "9+" : naoLidas}
                </span>
            ) : null}
        </Link>
    );
}

export function ItemHeaderNotificacoes({ href }) {
    return (
        <div className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo">
            <LinkNotificacoes href={href} />
        </div>
    );
}
