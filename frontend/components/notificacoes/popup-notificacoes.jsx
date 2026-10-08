"use client";

import Link from "next/link";
import { Bell, ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiRequest } from "@/lib/api";
import { useInterface } from "@/lib/use-interface";
import { mensagemNotificacaoUI } from "@/lib/notificacoes-interface";
import "./popup-notificacoes.css";

export function PopupNotificacoes({ id, href, onClose, onNavigate }) {
    const { ui, localeUI, dataHoraUI } = useInterface();
    const dialogRef = useRef(null);
    const fecharRef = useRef(null);
    const [resultado, setResultado] = useState({ status: "loading", items: [], erro: "" });
    const [tentativa, setTentativa] = useState(0);
    const tituloId = `${id}-titulo`;

    useEffect(() => {
        const dialog = dialogRef.current;
        const overflowAnterior = document.body.style.overflow;
        const bloquearRolagem = overflowAnterior !== "hidden";
        const focoAnterior = document.activeElement;
        dialog.showModal();
        if (bloquearRolagem) document.body.style.overflow = "hidden";
        fecharRef.current?.focus();
        return () => {
            dialog.close();
            if (bloquearRolagem) document.body.style.overflow = overflowAnterior;
            if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected) focoAnterior.focus({ preventScroll: true });
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest("/notificacoes", { signal: controller.signal, forceRefresh: true })
            .then((items) => {
                if (!controller.signal.aborted) {
                    setResultado({ status: "ready", items: (items ?? []).slice(0, 6), erro: "" });
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setResultado({ status: "error", items: [], erro: error instanceof Error ? error.message : "Não foi possível carregar as notificações." });
                }
            });
        return () => controller.abort();
    }, [tentativa]);

    function tentarNovamente() {
        setResultado({ status: "loading", items: [], erro: "" });
        setTentativa((atual) => atual + 1);
    }

    function navegar() {
        onClose();
        onNavigate?.();
    }

    function manterFoco(event) {
        if (event.key !== "Tab") return;
        const dialog = event.currentTarget;
        const elementos = dialog.querySelectorAll('a[href], button:not(:disabled)');
        const primeiro = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (event.shiftKey && document.activeElement === primeiro) {
            event.preventDefault();
            ultimo?.focus();
        } else if (!event.shiftKey && document.activeElement === ultimo) {
            event.preventDefault();
            primeiro?.focus();
        }
    }

    return createPortal(
        <dialog
            ref={dialogRef}
            id={id}
            className="notificacoes-popup"
            aria-modal="true"
            aria-labelledby={tituloId}
            onKeyDown={manterFoco}
            onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
            onClick={(event) => {
                event.stopPropagation();
                if (event.target !== event.currentTarget) return;
                const rect = event.currentTarget.getBoundingClientRect();
                if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
            }}
        >
            <div className="notificacoes-popup-content">
                <header className="notificacoes-popup-header">
                    <div>
                        <h2 id={tituloId}>{ui("Notificações")}</h2>
                        <p className="mt-1 text-sm text-app-mocha">{ui("Notificações recentes")}</p>
                    </div>
                    <button ref={fecharRef} type="button" onClick={onClose} className="app-button-secondary notificacoes-popup-close" aria-label={ui("Fechar notificações")}>
                        <X aria-hidden="true" className="h-5 w-5" />
                    </button>
                </header>

                <div className="notificacoes-popup-list" aria-busy={resultado.status === "loading"}>
                    {resultado.status === "loading" ? (
                        <p role="status" className="notificacoes-popup-state text-sm">{ui("Carregando notificações...")}</p>
                    ) : resultado.status === "error" ? (
                        <div className="notificacoes-popup-state">
                            <p role="alert" className="text-sm text-app-vermelho-erro">{ui(resultado.erro)}</p>
                            <button type="button" onClick={tentarNovamente} className="app-button-secondary mt-4 rounded-xl px-4 py-2.5">{ui("Tentar novamente")}</button>
                        </div>
                    ) : resultado.items.length ? (
                        <ul>
                            {resultado.items.map((notificacao) => {
                                const conteudo = <>
                                    <h3>{notificacao.tipo_evento === "INFORMATIVO" ? notificacao.titulo : ui(notificacao.titulo)}</h3>
                                    <p className="mt-2 text-sm text-app-mocha">{mensagemNotificacaoUI(notificacao, localeUI.startsWith("en") ? "en" : "pt-BR")}</p>
                                    <time dateTime={notificacao.criado_em} className="mt-3 block text-xs text-app-cinza">{dataHoraUI(notificacao.criado_em)}</time>
                                </>;
                                return <li key={notificacao.id_notificacao}>
                                    {notificacao.link_destino ? (
                                        <Link href={notificacao.link_destino} onNavigate={navegar} className="notificacoes-popup-item">{conteudo}</Link>
                                    ) : <article className="notificacoes-popup-item">{conteudo}</article>}
                                </li>;
                            })}
                        </ul>
                    ) : (
                        <div className="notificacoes-popup-state">
                            <Bell aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-app-mocha" />
                            <p className="text-sm">{ui("Nenhuma notificação por enquanto")}</p>
                        </div>
                    )}
                </div>

                <footer className="notificacoes-popup-footer">
                    <Link href={href} onNavigate={navegar} className="app-button-primary flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3">
                        {ui("Ver mais")} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </footer>
            </div>
        </dialog>,
        document.body,
    );
}
