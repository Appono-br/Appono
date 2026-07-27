"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { BotaoVoltar } from "@/components/botao-voltar";

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        check: "m5 12 4 4L19 6",
        clock: "M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
        x: "M6 6l12 12M18 6 6 18",
    };
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function PagamentoRetornoContent() {
    const searchParams = useSearchParams();
    const reservaId = searchParams.get("reserva");
    const pedidoId = searchParams.get("pedido");
    const queryString = searchParams.toString();
    const endpointStatus = useMemo(() => {
        if (pedidoId) {
            return `/pagamentos/pedido/${pedidoId}/status?${queryString}`;
        }
        if (reservaId) {
            return `/pagamentos/reserva/${reservaId}/status?${queryString}`;
        }
        return null;
    }, [pedidoId, queryString, reservaId]);
    const [dados, setDados] = useState(null);
    const [mensagem, setMensagem] = useState("Consultando status do pagamento...");
    const [consultando, setConsultando] = useState(false);

    async function consultarStatus() {
        if (!endpointStatus) {
            return;
        }
        setConsultando(true);
        setMensagem("Consultando status do pagamento...");
        try {
            const resposta = await apiRequest(endpointStatus);
            setDados(resposta);
            setMensagem("");
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel consultar o pagamento.");
        }
        finally {
            setConsultando(false);
        }
    }

    useEffect(() => {
        if (!endpointStatus) {
            return;
        }
        let ignorarResposta = false;
        let temporizador = null;
        async function consultarAutomaticamente(tentativa = 0) {
            setConsultando(true);
            try {
                const resposta = await apiRequest(endpointStatus);
                if (ignorarResposta) {
                    return;
                }
                setDados(resposta);
                setMensagem("");
                const pagamentoFinalizado = ["APROVADO", "RECUSADO", "NAO_APLICAVEL"].includes(resposta.status_pagamento);
                if (!pagamentoFinalizado && tentativa < 5) {
                    temporizador = window.setTimeout(() => consultarAutomaticamente(tentativa + 1), 3000);
                }
            }
            catch (erro) {
                if (!ignorarResposta) {
                    setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel consultar o pagamento.");
                }
            }
            finally {
                if (!ignorarResposta) {
                    setConsultando(false);
                }
            }
        }
        consultarAutomaticamente();
        return () => {
            ignorarResposta = true;
            if (temporizador) {
                window.clearTimeout(temporizador);
            }
        };
    }, [endpointStatus]);
    const tipoPagamento = pedidoId ? "pedido" : "reserva";
    const mensagemVisivel = pedidoId || reservaId ? mensagem : "Pedido ou reserva nao informado no retorno do pagamento.";

    const estado = useMemo(() => {
        const status = dados?.status_pagamento;
        if (status === "APROVADO") {
            return {
                icon: "check",
                title: "Pagamento aprovado",
                description: tipoPagamento === "pedido"
                    ? "Pagamento aprovado. Seu pedido antecipado foi confirmado e enviado ao restaurante para preparo no horario combinado."
                    : "Sua reserva foi confirmada e ja aparece para o restaurante.",
                className: "bg-app-cafe-profundo text-app-creme-leve",
            };
        }
        if (status === "RECUSADO") {
            return {
                icon: "x",
                title: "Pagamento nao aprovado",
                description: tipoPagamento === "pedido"
                    ? "O pedido nao foi confirmado. Sua reserva continua ativa e voce pode tentar montar outro pedido."
                    : "A reserva foi marcada como cancelada. Voce pode tentar reservar novamente.",
                className: "bg-app-vermelho-erro text-white",
            };
        }
        return {
            icon: "clock",
            title: "Pagamento pendente",
            description: tipoPagamento === "pedido"
                ? "Seu pedido antecipado ainda nao foi confirmado. Assim que o Mercado Pago aprovar o pagamento, a Appono confirma o pedido para o restaurante."
                : "Sua reserva ainda aguarda a confirmacao do Mercado Pago.",
            className: "bg-app-baunilha-dourada text-app-cafe-profundo",
        };
    }, [dados, tipoPagamento]);

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly px-5 py-8 text-app-cafe-profundo">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
                <Image src="/brand/appono-mark.svg" alt="Appono" width={92} height={92} className="h-20 w-20" priority />
                <section className="mt-8 w-full rounded-[18px] bg-app-creme-leve p-6 text-center shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-10">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${estado.className}`}>
                        <Icon type={estado.icon} className="h-7 w-7" />
                    </div>
                    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
                        Mercado Pago
                    </p>
                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{mensagemVisivel || estado.title}</h1>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-app-mocha">{mensagemVisivel ? "Aguarde alguns instantes." : estado.description}</p>
                    {dados?.status_pagamento === "PENDENTE" ? (
                        <div className="mx-auto mt-6 max-w-xl rounded-[12px] bg-app-baunilha-dourada/35 p-4 text-left text-sm leading-6 text-app-mocha ring-1 ring-app-baunilha-dourada/70">
                            <strong className="block text-app-cafe-profundo">O pedido ainda nao foi enviado para preparo.</strong>
                            Pagamentos por Pix, boleto ou analise de cartao podem levar alguns instantes. Voce pode atualizar o status por aqui ou voltar aos detalhes do pedido depois.
                        </div>
                    ) : null}

                    {dados?.reserva ? (
                        <div className="mx-auto mt-7 grid max-w-xl gap-3 rounded-[12px] bg-app-chantilly p-4 text-left ring-1 ring-app-baunilha-dourada/60 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Reserva</p>
                                <p className="mt-1 font-semibold">#{dados.reserva.id_reserva}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Status</p>
                                <p className="mt-1 font-semibold">{dados.reserva.status_reserva}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Valor</p>
                                <p className="mt-1 font-semibold">{formatarMoeda(dados.reserva.valor_minimo_total)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Pagamento</p>
                                <p className="mt-1 font-semibold">{dados.status_pagamento ?? "PENDENTE"}</p>
                            </div>
                        </div>
                    ) : null}
                    {dados?.pedido ? (
                        <div className="mx-auto mt-7 grid max-w-xl gap-3 rounded-[12px] bg-app-chantilly p-4 text-left ring-1 ring-app-baunilha-dourada/60 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Pedido</p>
                                <p className="mt-1 font-semibold">#{dados.pedido.id_pedido}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Status</p>
                                <p className="mt-1 font-semibold">{dados.pedido.status_pedido}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Valor</p>
                                <p className="mt-1 font-semibold">{formatarMoeda(dados.pedido.valor_total)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Pagamento</p>
                                <p className="mt-1 font-semibold">{dados.status_pagamento ?? "PENDENTE"}</p>
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        {pedidoId ? (
                            <Link href="/cliente/detalhes-pedido" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado">
                                Ver detalhes do pedido
                            </Link>
                        ) : (
                            <Link href="/cliente/reservas" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado">
                                Ver minhas reservas
                            </Link>
                        )}
                        <button type="button" onClick={consultarStatus} disabled={consultando || (!reservaId && !pedidoId)} className="inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:opacity-55">
                            {consultando ? "Atualizando..." : "Atualizar status"}
                        </button>
                        <BotaoVoltar href="/cliente/dashboard" className="h-11 justify-center rounded-[8px] border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">
                            Voltar ao inicio
                        </BotaoVoltar>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default function PagamentoRetornoPage() {
    return (
        <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-app-chantilly text-app-cafe-profundo">Carregando pagamento...</main>}>
            <PagamentoRetornoContent />
        </Suspense>
    );
}
