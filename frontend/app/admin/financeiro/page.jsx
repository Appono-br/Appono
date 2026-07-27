"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { encerrarSessao } from "@/lib/session";

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

function formatarDataHora(data) {
    if (!data) {
        return "Sem data";
    }
    return new Date(data).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
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

function textoEvento(tipo) {
    const eventoMap = {
        PAGAMENTO_CRIADO: "Pagamento criado",
        PAGAMENTO_APROVADO: "Pagamento aprovado",
        PAGAMENTO_PENDENTE: "Pagamento pendente",
        PAGAMENTO_RECUSADO: "Pagamento recusado",
        REPASSE_LIBERADO: "Repasse liberado",
        REPASSE_ESTORNADO: "Repasse estornado",
    };
    return eventoMap[tipo] ?? String(tipo ?? "Evento financeiro").replaceAll("_", " ");
}

function textoConexaoMercadoPago(conexao) {
    if (!conexao) {
        return "Nao conectado";
    }
    const statusMap = {
        CONECTADO: "Conectado",
        AGUARDANDO_AUTORIZACAO: "Aguardando autorizacao",
        DESCONECTADO: "Desconectado",
        ERRO: "Erro",
    };
    return statusMap[conexao.status] ?? conexao.status ?? "Nao conectado";
}

function CardResumo({ label, value, destaque }) {
    return (
        <article className={`rounded-[14px] p-5 shadow-sm ring-1 ${destaque
            ? "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo"
            : "bg-app-creme-leve text-app-cafe-profundo ring-app-baunilha-dourada/70"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${destaque ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>
                {label}
            </p>
            <strong className="mt-5 block text-2xl font-semibold">{formatarMoeda(value)}</strong>
        </article>
    );
}

function Pill({ children, tone = "neutral" }) {
    const tones = {
        neutral: "bg-app-chantilly text-app-mocha ring-app-baunilha-dourada/70",
        strong: "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo",
        alert: "bg-app-baunilha-dourada/45 text-app-cafe-profundo ring-app-baunilha-dourada",
    };
    return (
        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ${tones[tone]}`}>
            {children}
        </span>
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
        eventos: [],
        restaurantes: [],
        suporte: null,
        politica_financeira: null,
    });

    const eventosRecentes = useMemo(() => dados.eventos?.slice(0, 8) ?? [], [dados.eventos]);
    const restaurantesComAtencao = useMemo(() => (
        dados.restaurantes?.filter((restaurante) => restaurante.metricas?.valor_retido > 0 ||
            restaurante.conexao_mercado_pago?.status !== "CONECTADO").slice(0, 6) ?? []
    ), [dados.restaurantes]);

    async function sairParaHome() {
        await encerrarSessao();
        window.location.href = "/";
    }

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
                <section className="w-full max-w-md rounded-[14px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
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
                <section className="w-full max-w-md rounded-[14px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
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
                <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-12 w-12" priority />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Appono Admin</p>
                            <strong className="text-lg font-semibold">Central administrativa</strong>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve">
                            {admin?.nome ?? "Administracao"}
                        </span>
                        <button type="button" onClick={sairParaHome} className="rounded-full border border-app-baunilha-dourada bg-app-chantilly px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-baunilha-dourada">
                            Sair para home
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto w-full max-w-7xl px-5 py-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Marketplace financeiro</p>
                        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
                            Retencao, comissao e repasses da Appono
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-app-mocha">
                            Painel da plataforma para acompanhar pagamentos, taxa de {Number(dados.politica_financeira?.percentual_comissao_app ?? 13).toLocaleString("pt-BR")}%, valores retidos ate entrega e liberacao de repasses.
                        </p>
                    </div>

                    <article className="rounded-[14px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Suporte operacional</p>
                        <strong className="mt-4 block text-3xl">{dados.suporte?.abertos ?? 0}</strong>
                        <p className="mt-2 text-sm leading-6 text-app-creme-suave">
                            pontos em acompanhamento por retencao, cancelamento ou divergencia financeira.
                        </p>
                    </article>
                </div>

                <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                    {cardsResumo.map((card) => (
                        <CardResumo key={card.key} label={card.label} value={dados.resumo?.[card.key]} destaque={card.destaque} />
                    ))}
                </section>

                <section className="mt-10 grid gap-8 xl:grid-cols-[1.35fr_0.9fr]">
                    <article className="rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <div className="flex flex-col gap-3 border-b border-app-baunilha-dourada/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Conciliacao</p>
                                <h2 className="mt-2 text-2xl font-semibold">Pedidos pagos</h2>
                            </div>
                            <p className="text-sm text-app-cinza">{dados.resumo?.quantidade_pagamentos ?? 0} pagamento(s) aprovado(s)</p>
                        </div>

                        {dados.pagamentos?.length ? (
                            <div className="mt-5 divide-y divide-app-baunilha-dourada/50">
                                {dados.pagamentos.slice(0, 8).map((pagamento) => (
                                    <article key={pagamento.id_pagamento} className="grid gap-4 py-5 text-sm text-app-mocha lg:grid-cols-[0.7fr_1fr_1fr_1fr_1fr]">
                                        <div>
                                            <strong className="block text-app-cafe-profundo">#{pagamento.id_pedido}</strong>
                                            <span className="text-xs text-app-cinza">{textoStatusPedido(pagamento.pedido?.status_pedido)}</span>
                                        </div>
                                        <span>{pagamento.pedido?.restaurantes?.nome ?? "Restaurante"}</span>
                                        <span>{formatarReserva(pagamento.pedido?.reservas?.data_reserva, pagamento.pedido?.reservas?.horario_inicio)}</span>
                                        <div>
                                            <strong className="block text-app-caramelo-torrado">{textoStatusRepasse(pagamento.status_repasse)}</strong>
                                            <span className="text-xs text-app-cinza">Fluxo {pagamento.tipo_fluxo_pagamento ?? "Appono"}</span>
                                        </div>
                                        <div>
                                            <strong className="block text-app-cafe-profundo">{formatarMoeda(pagamento.valor_pago ?? pagamento.valor)}</strong>
                                            <span className="text-xs text-app-cinza">Appono {formatarMoeda(pagamento.valor_comissao_app)}</span>
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
                    </article>

                    <article className="rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Historico financeiro</p>
                        <h2 className="mt-2 text-2xl font-semibold">Eventos recentes</h2>
                        <div className="mt-5 grid gap-3">
                            {eventosRecentes.length ? eventosRecentes.map((evento) => (
                                <div key={evento.id_evento} className="rounded-[12px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/55">
                                    <div className="flex items-start justify-between gap-3">
                                        <strong className="text-sm text-app-cafe-profundo">{textoEvento(evento.tipo_evento)}</strong>
                                        <span className="text-xs text-app-cinza">{formatarDataHora(evento.criado_em)}</span>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-app-mocha">{evento.descricao ?? "Evento registrado na operacao financeira."}</p>
                                    <p className="mt-2 text-xs font-semibold text-app-caramelo-torrado">Pedido #{evento.id_pedido ?? "-"} | {formatarMoeda(evento.valor)}</p>
                                </div>
                            )) : (
                                <p className="rounded-[12px] bg-app-chantilly p-4 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/55">
                                    Os eventos financeiros aparecerao conforme pagamentos, cancelamentos e entregas forem processados.
                                </p>
                            )}
                        </div>
                    </article>
                </section>

                <section className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                    <article className="rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <div className="flex flex-col gap-3 border-b border-app-baunilha-dourada/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Parceiros</p>
                                <h2 className="mt-2 text-2xl font-semibold">Restaurantes cadastrados</h2>
                            </div>
                            <p className="text-sm text-app-cinza">{dados.restaurantes?.length ?? 0} restaurante(s)</p>
                        </div>
                        <div className="mt-5 grid gap-3">
                            {(dados.restaurantes ?? []).slice(0, 8).map((restaurante) => (
                                <div key={restaurante.id_restaurante} className="grid gap-4 rounded-[12px] bg-app-chantilly p-4 text-sm ring-1 ring-app-baunilha-dourada/55 md:grid-cols-[1fr_auto]">
                                    <div>
                                        <strong className="block text-app-cafe-profundo">{restaurante.nome}</strong>
                                        <span className="text-xs text-app-cinza">{restaurante.email ?? restaurante.telefone ?? "Contato nao informado"}</span>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Pill tone={restaurante.conexao_mercado_pago?.status === "CONECTADO" ? "strong" : "alert"}>
                                                {textoConexaoMercadoPago(restaurante.conexao_mercado_pago)}
                                            </Pill>
                                            <Pill>{restaurante.metricas?.pedidos_pagos ?? 0} pedido(s)</Pill>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <strong className="block text-app-cafe-profundo">{formatarMoeda(restaurante.metricas?.valor_transacionado)}</strong>
                                        <span className="text-xs text-app-cinza">Retido {formatarMoeda(restaurante.metricas?.valor_retido)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Atencao operacional</p>
                        <h2 className="mt-2 text-2xl font-semibold">Fila de suporte</h2>
                        <p className="mt-3 text-sm leading-6 text-app-mocha">
                            Casos com valor retido, cancelamento ou parceiro sem conexao Mercado Pago aparecem aqui para acompanhamento da Appono.
                        </p>
                        <div className="mt-5 grid gap-3">
                            {(dados.suporte?.itens?.length ? dados.suporte.itens : restaurantesComAtencao).slice(0, 6).map((item, index) => (
                                <div key={item.id_pagamento ?? item.id_restaurante ?? index} className="rounded-[12px] bg-app-chantilly p-4 text-sm ring-1 ring-app-baunilha-dourada/55">
                                    <strong className="block text-app-cafe-profundo">
                                        {item.restaurante ?? item.nome ?? "Ocorrencia operacional"}
                                    </strong>
                                    <p className="mt-1 text-xs leading-5 text-app-cinza">
                                        {item.id_pedido ? `Pedido #${item.id_pedido} | ${textoStatusRepasse(item.status_repasse)}` : textoConexaoMercadoPago(item.conexao_mercado_pago)}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold text-app-caramelo-torrado">
                                        {formatarMoeda(item.valor ?? item.metricas?.valor_retido ?? 0)}
                                    </p>
                                </div>
                            ))}
                            {!dados.suporte?.itens?.length && !restaurantesComAtencao.length ? (
                                <p className="rounded-[12px] bg-app-chantilly p-4 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/55">
                                    Nenhuma ocorrencia operacional no momento.
                                </p>
                            ) : null}
                        </div>
                    </article>
                </section>
            </section>
        </main>
    );
}
