"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { BotaoVoltar } from "@/components/botao-voltar";

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function formatarData(data) {
    if (!data) {
        return "Nao informado";
    }
    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        check: "m5 12 4 4L19 6",
        lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6V11z M12 15v2",
        shield: "M12 21s7-3.2 7-9.8V5l-7-3-7 3v6.2C5 17.8 12 21 12 21z",
    };

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

export default function PaginaPagamentoPedido({ params }) {
    const [pedidoId, setPedidoId] = useState(null);
    const [preferencia, setPreferencia] = useState(null);
    const [mensagem, setMensagem] = useState("Preparando checkout seguro...");

    useEffect(() => {
        params.then(({ id }) => setPedidoId(Number(id)));
    }, [params]);

    useEffect(() => {
        if (!pedidoId) {
            return;
        }
        apiRequest(`/pagamentos/pedido/${pedidoId}/preferencia`, {
            method: "POST",
        })
            .then((resposta) => {
                setPreferencia(resposta);
                setMensagem("");
            })
            .catch((error) => {
                setMensagem(error instanceof Error ? error.message : "Nao foi possivel preparar o pagamento.");
            });
    }, [pedidoId]);

    const pedido = preferencia?.pedido;
    const preferenceId = preferencia?.preference_id;
    const checkoutUrl = preferencia?.checkout_url;
    const hrefDetalhesPedido = pedidoId ? `/cliente/pedidos/${pedidoId}` : "/cliente/detalhes-pedido";

    return (
        <main className="flex min-h-screen flex-col bg-white px-4 py-8 text-app-cafe-profundo sm:px-5">
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
                <BotaoVoltar href={hrefDetalhesPedido} className="text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
                    Voltar aos detalhes do pedido
                </BotaoVoltar>

                <section className="mt-6 grid overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/70 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]">
                    <div className="min-w-0 p-5 sm:p-10">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-16 w-16" priority />
                        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
                            Checkout Pro
                        </p>
                        <h1 className="mt-2 text-3xl font-bold leading-tight text-app-cafe-profundo sm:text-4xl">
                            Finalize o pagamento do pedido antecipado
                        </h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-app-mocha">
                            O pagamento e processado pelo Mercado Pago. Depois da aprovacao, a Appono confirma o pedido para o restaurante preparar no horario da sua reserva.
                        </p>

                        <div className="mt-8 grid gap-3 rounded-[12px] bg-white p-5 ring-1 ring-app-baunilha-dourada/60 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Pedido</p>
                                <p className="mt-1 font-semibold">#{pedido?.id_pedido ?? pedidoId ?? "--"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Restaurante</p>
                                <p className="mt-1 font-semibold">{pedido?.restaurantes?.nome ?? "Restaurante"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Reserva</p>
                                <p className="mt-1 font-semibold">
                                    {formatarData(pedido?.reservas?.data_reserva)} as {pedido?.reservas?.horario_inicio?.slice(0, 5) ?? "--"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-app-cinza">Total</p>
                                <p className="mt-1 font-semibold">{formatarMoeda(pedido?.valor_total)}</p>
                            </div>
                        </div>
                    </div>

                    <aside className="min-w-0 bg-app-cafe-profundo p-5 text-app-creme-leve sm:p-8 lg:flex lg:flex-col lg:justify-center">
                        <div className="rounded-[18px] border border-app-baunilha-dourada/25 bg-white/8 p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-app-baunilha-dourada text-app-cafe-profundo">
                                    <Icon type="shield" className="h-6 w-6" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-baunilha-dourada">
                                        Mercado Pago
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold">Pagamento seguro</h2>
                                </div>
                            </div>

                            <p className="mt-5 text-sm leading-6 text-app-creme-suave">
                                Clique no botao oficial abaixo para abrir o Checkout Pro com cartao, Pix, boleto e saldo Mercado Pago, conforme disponibilidade da sua conta.
                            </p>

                            <div className="mt-6 rounded-[14px] bg-app-cacau-intenso/45 p-4 ring-1 ring-app-baunilha-dourada/20">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">
                                    Total a pagar
                                </p>
                                <strong className="mt-2 block text-3xl text-app-creme-leve">
                                    {formatarMoeda(pedido?.valor_total)}
                                </strong>
                            </div>

                            <div className="mt-6 rounded-[12px] bg-white p-3 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/35">
                                {checkoutUrl ? (
                                    <a
                                        href={checkoutUrl}
                                        className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#ffe600] px-4 text-sm font-black uppercase tracking-[0.08em] text-[#03264c] shadow-sm transition hover:brightness-95"
                                    >
                                        Pagar com Mercado Pago
                                    </a>
                                ) : (
                                    <p className="text-center text-sm font-semibold text-app-caramelo-torrado">
                                        {mensagem || "Carregando botao de pagamento..."}
                                    </p>
                                )}
                                {preferenceId ? (
                                    <p className="mt-3 text-center text-[11px] font-semibold text-app-mocha">
                                        Checkout Pro seguro, processado pelo Mercado Pago.
                                    </p>
                                ) : null}
                            </div>

                            <div className="mt-5 grid gap-2 text-xs text-app-creme-suave">
                                <p className="flex items-center gap-2">
                                    <Icon type="lock" className="h-4 w-4 text-app-baunilha-dourada" />
                                    Pagamento processado fora da Appono, direto pelo Mercado Pago.
                                </p>
                                <p className="flex items-center gap-2">
                                    <Icon type="check" className="h-4 w-4 text-app-baunilha-dourada" />
                                    O pedido sera confirmado automaticamente apos aprovacao.
                                </p>
                            </div>
                        </div>

                        {mensagem && preferenceId ? (
                            <p className="mt-4 rounded-[8px] bg-white/10 p-3 text-sm text-app-creme-suave">
                                {mensagem}
                            </p>
                        ) : null}
                    </aside>
                </section>
            </div>
        </main>
    );
}
