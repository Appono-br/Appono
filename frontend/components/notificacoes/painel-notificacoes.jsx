"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoTipoEvento } from "@/lib/formatadores-status";
import { BotaoVoltar } from "@/components/botao-voltar";
import { dispararAtualizacaoNotificacoes } from "./contador-notificacoes";

const filtros = [
    { chave: "todas", rotulo: "Todas" },
    { chave: "nao_lidas", rotulo: "Nao lidas" },
    { chave: "favoritas", rotulo: "Favoritas" },
    { chave: "reservas", rotulo: "Reservas" },
    { chave: "pedidos", rotulo: "Pedidos" },
    { chave: "pagamentos", rotulo: "Pagamentos" },
    { chave: "cancelamentos", rotulo: "Cancelamentos" },
];

function formatarDataHora(data) {
    if (!data) {
        return "Agora";
    }
    return new Date(data).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function obterTomNotificacao(tipoEvento) {
    if (String(tipoEvento ?? "").includes("CANCEL")) {
        return "border-app-vermelho-erro/40 bg-app-vermelho-erro/10";
    }
    if (String(tipoEvento ?? "").includes("PAGAMENTO")) {
        return "border-app-dourado-mel/45 bg-app-baunilha-dourada/25";
    }
    return "border-app-baunilha-dourada/55 bg-app-creme-leve";
}

function IconeEstrela({ preenchida }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path
                d="m12 3 2.7 5.48 6.05.88-4.38 4.27 1.03 6.02L12 16.82l-5.4 2.83 1.03-6.02-4.38-4.27 6.05-.88L12 3Z"
                fill={preenchida ? "currentColor" : "none"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
        </svg>
    );
}

export function PainelNotificacoes({ modulo, voltarHref, dashboardHref }) {
    const [notificacoes, setNotificacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState("erro");
    const [filtroAtual, setFiltroAtual] = useState("todas");
    const [confirmacao, setConfirmacao] = useState(null);
    const [processandoConfirmacao, setProcessandoConfirmacao] = useState(false);

    const naoLidas = useMemo(() => notificacoes.filter((notificacao) => !notificacao.lida).length, [notificacoes]);

    function exibirMensagem(texto, tipo = "sucesso") {
        setMensagem(texto);
        setTipoMensagem(tipo);
    }

    async function carregarNotificacoes({ mostrarCarregando = true } = {}) {
        if (mostrarCarregando) {
            setCarregando(true);
        }
        setMensagem("");
        try {
            const consulta = filtroAtual === "todas" ? "" : `?filtro=${filtroAtual}`;
            const resposta = await apiRequest(`/notificacoes${consulta}`);
            setNotificacoes(resposta ?? []);
            if (mostrarCarregando) {
                exibirMensagem("Notificacoes atualizadas.", "sucesso");
            }
        }
        catch (error) {
            exibirMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar as notificacoes.", "erro");
        }
        finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        let ativo = true;
        const consulta = filtroAtual === "todas" ? "" : `?filtro=${filtroAtual}`;
        apiRequest(`/notificacoes${consulta}`)
            .then((resposta) => {
                if (ativo) {
                    setNotificacoes(resposta ?? []);
                }
            })
            .catch((error) => {
                if (ativo) {
                    exibirMensagem(error instanceof Error ? error.message : "Nao foi possivel carregar as notificacoes.", "erro");
                }
            })
            .finally(() => {
                if (ativo) {
                    setCarregando(false);
                }
            });
        return () => {
            ativo = false;
        };
    }, [filtroAtual]);

    useEffect(() => {
        const intervalo = window.setInterval(() => {
            const consulta = filtroAtual === "todas" ? "" : `?filtro=${filtroAtual}`;
            apiRequest(`/notificacoes${consulta}`)
                .then((resposta) => {
                    setNotificacoes(resposta ?? []);
                })
                .catch(() => undefined);
        }, 45000);
        return () => window.clearInterval(intervalo);
    }, [filtroAtual]);

    async function marcarComoLida(id) {
        try {
            const atualizada = await apiRequest(`/notificacoes/${id}/lida`, { method: "PATCH" });
            setNotificacoes((atuais) => atuais.map((notificacao) => notificacao.id_notificacao === id ? atualizada : notificacao));
            dispararAtualizacaoNotificacoes();
            exibirMensagem("Notificacao marcada como lida.", "sucesso");
        }
        catch (error) {
            exibirMensagem(error instanceof Error ? error.message : "Nao foi possivel atualizar a notificacao.", "erro");
        }
    }

    async function marcarTodasComoLidas() {
        try {
            await apiRequest("/notificacoes/marcar-todas/lidas", { method: "PATCH" });
            setNotificacoes((atuais) => atuais.map((notificacao) => ({
                ...notificacao,
                lida: true,
                lida_em: notificacao.lida_em ?? new Date().toISOString(),
            })));
            dispararAtualizacaoNotificacoes();
            exibirMensagem("Todas as notificacoes foram marcadas como lidas.", "sucesso");
        }
        catch (error) {
            exibirMensagem(error instanceof Error ? error.message : "Nao foi possivel marcar as notificacoes como lidas.", "erro");
        }
    }

    async function alternarFavorita(notificacao) {
        try {
            const atualizada = await apiRequest(`/notificacoes/${notificacao.id_notificacao}/favorita`, {
                method: "PATCH",
                body: JSON.stringify({ favoritada: !notificacao.favoritada }),
            });
            setNotificacoes((atuais) => atuais.map((item) => item.id_notificacao === notificacao.id_notificacao ? atualizada : item));
            exibirMensagem(atualizada.favoritada ? "Notificacao adicionada aos favoritos." : "Notificacao removida dos favoritos.", "sucesso");
        }
        catch (error) {
            exibirMensagem(error instanceof Error ? error.message : "Nao foi possivel favoritar a notificacao.", "erro");
        }
    }

    function solicitarApagarNotificacao(notificacao) {
        setConfirmacao({
            tipo: "apagar",
            titulo: "Apagar notificacao?",
            mensagem: "Esta notificacao sera removida da sua central. O historico tecnico continua preservado no sistema.",
            acao: "Apagar notificacao",
            notificacao,
        });
    }

    function solicitarLimparNotificacoes() {
        setConfirmacao({
            tipo: "limpar",
            titulo: "Limpar notificacoes?",
            mensagem: "Todas as notificacoes nao favoritadas serao removidas da sua central. As favoritas continuarao salvas.",
            acao: "Limpar notificacoes",
        });
    }

    async function confirmarAcao() {
        if (!confirmacao) {
            return;
        }
        setProcessandoConfirmacao(true);
        try {
            if (confirmacao.tipo === "apagar") {
                await apiRequest(`/notificacoes/${confirmacao.notificacao.id_notificacao}/apagar`, { method: "PATCH" });
                setNotificacoes((atuais) => atuais.filter((item) => item.id_notificacao !== confirmacao.notificacao.id_notificacao));
                dispararAtualizacaoNotificacoes();
                exibirMensagem("Notificacao apagada da sua central.", "sucesso");
            }
            if (confirmacao.tipo === "limpar") {
                await apiRequest("/notificacoes/limpar", { method: "PATCH" });
                setNotificacoes((atuais) => atuais.filter((notificacao) => notificacao.favoritada));
                dispararAtualizacaoNotificacoes();
                exibirMensagem("Notificacoes nao favoritadas foram limpas.", "sucesso");
            }
            setConfirmacao(null);
        }
        catch (error) {
            exibirMensagem(error instanceof Error ? error.message : "Nao foi possivel concluir a acao.", "erro");
        }
        finally {
            setProcessandoConfirmacao(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
            <section className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
                <BotaoVoltar href={voltarHref} className="text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
                    Voltar
                </BotaoVoltar>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                    <div className="rounded-[22px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:rounded-[28px] sm:p-9">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={76} height={76} className="h-14 w-14" priority />
                        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
                            Central de notificacoes
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                            Acompanhe o que muda na sua operacao
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-mocha sm:text-base">
                            Aqui ficam os avisos importantes de reservas, pedidos, pagamentos e cancelamentos do modulo {modulo}.
                        </p>
                    </div>

                    <aside className="rounded-[24px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Resumo</p>
                        <strong className="mt-4 block text-4xl">{naoLidas}</strong>
                        <p className="mt-2 text-sm text-app-creme-suave">notificacao(oes) ainda nao lida(s).</p>
                        <button type="button" onClick={marcarTodasComoLidas} disabled={!naoLidas} className="mt-6 w-full rounded-full bg-app-baunilha-dourada px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-cafe-profundo transition hover:bg-app-dourado-mel hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                            Marcar todas como lidas
                        </button>
                        <button type="button" onClick={solicitarLimparNotificacoes} disabled={!notificacoes.some((notificacao) => !notificacao.favoritada)} className="mt-3 w-full rounded-full border border-app-baunilha-dourada/70 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-baunilha-dourada/15 disabled:cursor-not-allowed disabled:opacity-50">
                            Limpar nao favoritas
                        </button>
                    </aside>
                </div>

                {mensagem ? (
                    <p className={`mt-6 rounded-[14px] px-4 py-3 text-sm font-semibold ring-1 ${tipoMensagem === "sucesso"
                        ? "bg-app-baunilha-dourada/25 text-app-cafe-profundo ring-app-baunilha-dourada/60"
                        : "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/20"}`}>
                        {mensagem}
                    </p>
                ) : null}

                <section className="mt-8 rounded-[22px] bg-app-creme-leve p-4 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:rounded-[28px] sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-app-baunilha-dourada/55 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Historico</p>
                            <h2 className="mt-2 text-2xl font-semibold">Notificacoes recentes</h2>
                        </div>
                        <button type="button" onClick={carregarNotificacoes} className="w-fit rounded-full border border-app-caramelo-torrado px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-caramelo-torrado hover:text-white">
                            Atualizar
                        </button>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {filtros.map((filtro) => (
                            <button
                                key={filtro.chave}
                                type="button"
                                onClick={() => setFiltroAtual(filtro.chave)}
                                className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${filtroAtual === filtro.chave
                                    ? "bg-app-cafe-profundo text-app-creme-leve"
                                    : "border border-app-baunilha-dourada bg-app-chantilly text-app-mocha hover:border-app-caramelo-torrado hover:text-app-cafe-profundo"}`}
                            >
                                {filtro.rotulo}
                            </button>
                        ))}
                    </div>

                    {carregando ? (
                        <p className="py-12 text-center text-sm text-app-cinza">Carregando notificacoes...</p>
                    ) : notificacoes.length ? (
                        <div className="mt-5 grid gap-4">
                            {notificacoes.map((notificacao) => (
                                <article key={notificacao.id_notificacao} className={`overflow-hidden rounded-[18px] border p-4 shadow-sm sm:p-5 ${obterTomNotificacao(notificacao.tipo_evento)} ${notificacao.lida ? "opacity-75" : ""}`}>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {notificacao.favoritada ? (
                                                    <span className="rounded-full bg-app-dourado-mel px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-app-cafe-profundo">
                                                        Favorita
                                                    </span>
                                                ) : null}
                                                {!notificacao.lida ? (
                                                    <span className="rounded-full bg-app-caramelo-torrado px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                                                        Nova
                                                    </span>
                                                ) : null}
                                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-cinza">
                                                    {textoTipoEvento(notificacao.tipo_evento)}
                                                </span>
                                            </div>
                                            <h3 className="mt-3 text-xl font-semibold text-app-cafe-profundo">{notificacao.titulo}</h3>
                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-app-mocha">{notificacao.mensagem}</p>
                                            <p className="mt-3 text-xs text-app-cinza">{formatarDataHora(notificacao.criado_em)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:min-w-52 sm:justify-end">
                                            <button type="button" onClick={() => alternarFavorita(notificacao)} className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${notificacao.favoritada
                                                ? "border-app-dourado-mel bg-app-dourado-mel text-app-cafe-profundo hover:bg-app-baunilha-dourada"
                                                : "border-app-baunilha-dourada text-app-mocha hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo"}`} aria-label={notificacao.favoritada ? "Remover dos favoritos" : "Favoritar notificacao"} title={notificacao.favoritada ? "Remover dos favoritos" : "Favoritar"}>
                                                <IconeEstrela preenchida={Boolean(notificacao.favoritada)} />
                                            </button>
                                            {notificacao.link_destino ? (
                                                <Link href={notificacao.link_destino} className="rounded-full bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                                                    Abrir
                                                </Link>
                                            ) : null}
                                            {!notificacao.lida ? (
                                                <button type="button" onClick={() => marcarComoLida(notificacao.id_notificacao)} className="rounded-full border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo">
                                                    Marcar lida
                                                </button>
                                            ) : null}
                                            <button type="button" onClick={() => solicitarApagarNotificacao(notificacao)} className="rounded-full border border-app-vermelho-erro/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-vermelho-erro transition hover:bg-app-vermelho-erro hover:text-white">
                                                Apagar
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-14 text-center">
                            <h3 className="text-2xl font-semibold">Nenhuma notificacao por enquanto</h3>
                            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-app-cinza">
                                Quando acontecer uma reserva, pedido, pagamento ou cancelamento, o aviso aparecera aqui.
                            </p>
                            <BotaoVoltar href={dashboardHref} className="mt-7 rounded-full bg-app-caramelo-torrado px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-mocha">
                                Voltar ao painel
                            </BotaoVoltar>
                        </div>
                    )}
                </section>
            </section>
            {confirmacao ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacao-notificacao">
                    <section className="w-full max-w-md rounded-[24px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Confirmacao</p>
                        <h2 id="titulo-confirmacao-notificacao" className="mt-3 text-2xl font-semibold">{confirmacao.titulo}</h2>
                        <p className="mt-3 text-sm leading-6 text-app-mocha">{confirmacao.mensagem}</p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setConfirmacao(null)} disabled={processandoConfirmacao} className="rounded-full border border-app-baunilha-dourada px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-baunilha-dourada disabled:cursor-not-allowed disabled:opacity-60">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmarAcao} disabled={processandoConfirmacao} className="botao-acao-critica rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60">
                                {processandoConfirmacao ? "Processando..." : confirmacao.acao}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
        </main>
    );
}
