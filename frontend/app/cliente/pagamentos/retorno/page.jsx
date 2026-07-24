"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

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
    const [dados, setDados] = useState(null);
    const [mensagem, setMensagem] = useState("Consultando status do pagamento...");
    const [consultando, setConsultando] = useState(false);
    const [consultaIniciada, iniciarConsulta] = useTransition();
    const [consulta, setConsulta] = useState(0);

    async function consultarStatus() {
        const endpoint = pedidoId
            ? `/pagamentos/pedido/${pedidoId}/status?${queryString}`
            : reservaId
                ? `/pagamentos/reserva/${reservaId}/status?${queryString}`
                : null;
        if (!endpoint) {
            return;
        }
        setConsultando(true);
        setMensagem("Consultando status do pagamento...");
        try {
            const resposta = await apiRequest(endpoint);
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
        iniciarConsulta(() => setConsulta((atual) => atual + 1));
    }, [queryString, reservaId, pedidoId, iniciarConsulta]);

    useEffect(() => {
        const endpoint = pedidoId
            ? `/pagamentos/pedido/${pedidoId}/status?${queryString}`
            : reservaId
                ? `/pagamentos/reserva/${reservaId}/status?${queryString}`
                : null;
        if (!consulta || !endpoint) {
            return;
        }
        let ignorarResposta = false;
        apiRequest(endpoint)
            .then((resposta) => {
                if (ignorarResposta) {
                    return;
                }
                setDados(resposta);
                setMensagem("");
            })
            .catch((erro) => {
                if (ignorarResposta) {
                    return;
                }
                setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel consultar o pagamento.");
            })
            .finally(() => {
                if (!ignorarResposta) {
                    setConsultando(false);
                }
            });
        return () => {
            ignorarResposta = true;
        };
    }, [consulta, queryString, reservaId, pedidoId]);
    const tipoPagamento = pedidoId ? "pedido" : "reserva";
    const mensagemVisivel = pedidoId || reservaId ? mensagem : "Pedido ou reserva nao informado no retorno do pagamento.";

    const estado = useMemo(() => {
        const status = dados?.status_pagamento;
        if (status === "APROVADO") {
            return {
                icon: "check",
                title: "Pagamento aprovado",
                description: tipoPagamento === "pedido"
                    ? "Seu pedido antecipado foi confirmado e ja pode aparecer para o restaurante acompanhar."
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
                ? "Ainda estamos aguardando a confirmacao do Mercado Pago para confirmar seu pedido antecipado."
                : "Ainda estamos aguardando a confirmacao do Mercado Pago.",
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
                        <Link href="/cliente/reservas" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado">
                            Ver minhas reservas
                        </Link>
                        <button type="button" onClick={consultarStatus} disabled={consultando || consultaIniciada || (!reservaId && !pedidoId)} className="inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:opacity-55">
                            {consultando || consultaIniciada ? "Atualizando..." : "Atualizar status"}
                        </button>
                        <Link href="/cliente/dashboard" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">
                            Voltar ao inicio
                        </Link>
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
