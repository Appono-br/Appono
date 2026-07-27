"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

const cardsResumo = [
    { label: "Valor transacionado", key: "valor_transacionado", destaque: true },
    { label: "Receita Appono", key: "receita_app" },
    { label: "Retido ate entrega", key: "valor_retido" },
    { label: "Liberado a restaurantes", key: "valor_liberado" },
    { label: "Estornado", key: "valor_estornado" },
];

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function formatarReserva(data, horario) {
    if (!data) {
        return "Sem reserva";
    }
    const dataFormatada = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
    return horario ? `${dataFormatada} as ${String(horario).slice(0, 5)}` : dataFormatada;
}

function textoStatusRepasse(status) {
    const statusMap = {
        AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
        AGUARDANDO_ENTREGA: "Retido ate entrega",
        LIBERADO_PARA_REPASSE: "Liberado para repasse",
        REPASSADO: "Repassado",
        ESTORNADO: "Estornado",
        NAO_APLICAVEL: "Nao aplicavel",
    };
    return statusMap[status] ?? "Em acompanhamento";
}

function textoStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Aguardando pagamento",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };
    return statusMap[status] ?? "Pedido";
}

function CardResumo({ label, value, destaque }) {
    return (
        <article className={`rounded-[8px] p-5 shadow-sm ring-1 ${destaque
            ? "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo"
            : "bg-app-creme-leve text-app-cafe-profundo ring-app-baunilha-dourada/60"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${destaque ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>
                {label}
            </p>
            <strong className="mt-5 block text-2xl font-semibold">{formatarMoeda(value)}</strong>
        </article>
    );
}

export default function AdminFinanceiroPage() {
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [admin, setAdmin] = useState(null);
    const [dados, setDados] = useState({
        resumo: {
            valor_transacionado: 0,
            receita_app: 0,
            valor_restaurantes: 0,
            valor_retido: 0,
            valor_liberado: 0,
            valor_estornado: 0,
            quantidade_pagamentos: 0,
            pedidos_retidos: 0,
            pedidos_liberados: 0,
        },
        pagamentos: [],
        suporte: null,
    });

    useEffect(() => {
        async function carregarPainel() {
            try {
                const perfil = await apiRequest("/me");
                if (perfil.tipo !== "admin") {
                    throw new Error("Acesso restrito a administradores Appono.");
                }
                setAdmin(perfil.perfil);
                const resposta = await apiRequest("/admin/financeiro/resumo");
                setDados(resposta);
            }
            catch (error) {
                setErro(error instanceof Error ? error.message : "Nao foi possivel carregar o painel administrativo.");
            }
            finally {
                setCarregando(false);
            }
        }
        carregarPainel();
    }, []);

    if (carregando) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
                <section className="w-full max-w-md rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">Carregando administracao</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">Estamos conferindo suas permissoes.</p>
                </section>
            </main>
        );
    }

    if (erro) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
                <section className="w-full max-w-md rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">Acesso indisponivel</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">{erro}</p>
                    <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-caramelo-torrado px-6 text-sm font-bold text-white transition hover:bg-app-mocha">
                        Entrar novamente
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-app-chantilly text-app-cafe-profundo">
            <header className="border-b border-app-baunilha-dourada/60 bg-app-creme-leve/95 px-5 py-5 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-12 w-12" priority />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Appono Admin</p>
                            <strong className="text-lg font-semibold">Central administrativa</strong>
                        </div>
                    </div>
                    <span className="rounded-full bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve">
                        {admin?.nome ?? "Administracao"}
                    </span>
                </div>
            </header>

            <section className="mx-auto w-full max-w-7xl px-5 py-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Marketplace financeiro</p>
                        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                            Retencao, comissao e repasses da Appono
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-app-mocha">
                            Esta area representa a camada administrativa da startup: o pagamento entra na Appono, a taxa da plataforma e calculada e o valor do restaurante fica retido ate o pedido ser entregue.
                        </p>
                    </div>

                    <article className="rounded-[8px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Suporte operacional</p>
                        <strong className="mt-4 block text-3xl">{dados.suporte?.abertos ?? 0}</strong>
                        <p className="mt-2 text-sm leading-6 text-app-creme-suave">
                            chamados abertos para conciliacao financeira e atendimento aos parceiros.
                        </p>
                    </article>
                </div>

                <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                    {cardsResumo.map((card) => (
                        <CardResumo key={card.key} label={card.label} value={dados.resumo?.[card.key]} destaque={card.destaque} />
                    ))}
                </section>

                <section className="mt-10 rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                    <div className="flex flex-col gap-3 border-b border-app-baunilha-dourada/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Conciliacao</p>
                            <h2 className="mt-2 text-2xl font-semibold">Pedidos pagos</h2>
                        </div>
                        <p className="text-sm text-app-cinza">{dados.resumo?.quantidade_pagamentos ?? 0} pagamento(s) aprovado(s)</p>
                    </div>

                    {dados.pagamentos?.length ? (
                        <div className="mt-5 divide-y divide-app-baunilha-dourada/50">
                            {dados.pagamentos.map((pagamento) => (
                                <article key={pagamento.id_pagamento} className="grid gap-4 py-5 text-sm text-app-mocha lg:grid-cols-[0.8fr_1fr_1fr_1.1fr_1fr_1fr]">
                                    <div>
                                        <strong className="block text-app-cafe-profundo">Pedido #{pagamento.id_pedido}</strong>
                                        <span className="text-xs text-app-cinza">{textoStatusPedido(pagamento.pedido?.status_pedido)}</span>
                                    </div>
                                    <span>{pagamento.pedido?.restaurantes?.nome ?? "Restaurante"}</span>
                                    <span>{pagamento.pedido?.clientes?.nome ?? "Cliente"}</span>
                                    <span>{formatarReserva(pagamento.pedido?.reservas?.data_reserva, pagamento.pedido?.reservas?.horario_inicio)}</span>
                                    <div>
                                        <strong className="block text-app-caramelo-torrado">{textoStatusRepasse(pagamento.status_repasse)}</strong>
                                        <span className="text-xs text-app-cinza">Fluxo {pagamento.tipo_fluxo_pagamento ?? "Appono"}</span>
                                    </div>
                                    <div>
                                        <strong className="block text-app-cafe-profundo">{formatarMoeda(pagamento.valor_pago ?? pagamento.valor)}</strong>
                                        <span className="text-xs text-app-cinza">
                                            Appono {formatarMoeda(pagamento.valor_comissao_app)} | Restaurante {formatarMoeda(pagamento.valor_restaurante)}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <h3 className="text-xl font-semibold">Nenhum pagamento aprovado</h3>
                            <p className="mt-2 text-sm text-app-cinza">Quando um pedido for pago, ele aparecera nesta central.</p>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}
