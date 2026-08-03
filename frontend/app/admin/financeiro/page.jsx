"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoFluxoPagamento, textoStatusPedido, textoStatusRepasse, textoTipoEvento } from "@/lib/formatadores-status";
import { encerrarSessao } from "@/lib/session";

const cardsResumo = [
    { label: "Valor transacionado", key: "valor_transacionado", destaque: true },
    { label: "Receita Appono", key: "receita_app" },
    { label: "Retido ate entrega", key: "valor_retido" },
    { label: "Liberado a restaurantes", key: "valor_liberado" },
    { label: "Estornado", key: "valor_estornado" },
];

const cardsOperacao = [
    { label: "Clientes", key: "total_clientes" },
    { label: "Restaurantes", key: "total_restaurantes" },
    { label: "Restaurantes conectados", key: "restaurantes_conectados" },
    { label: "Reservas", key: "total_reservas" },
    { label: "Pedidos", key: "total_pedidos" },
    { label: "Ticket medio", key: "ticket_medio", moeda: true },
];

const abas = [
    { label: "Pedidos", value: "pedidos" },
    { label: "Eventos", value: "eventos" },
    { label: "Restaurantes", value: "restaurantes" },
    { label: "Pendencias", value: "pendencias" },
];

const filtrosStatus = [
    { label: "Todos", value: "todos" },
    { label: "Retidos", value: "AGUARDANDO_ENTREGA" },
    { label: "Liberados", value: "LIBERADO_PARA_REPASSE" },
    { label: "Estornados", value: "ESTORNADO" },
];

const filtrosPeriodo = [
    { label: "Hoje", value: "hoje" },
    { label: "7 dias", value: "7d" },
    { label: "30 dias", value: "30d" },
    { label: "Todos", value: "todos" },
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

function CardOperacao({ label, value, moeda }) {
    return (
        <article className="rounded-[14px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-cinza">{label}</p>
            <strong className="mt-4 block text-2xl font-semibold text-app-cafe-profundo">
                {moeda ? formatarMoeda(value) : Number(value ?? 0).toLocaleString("pt-BR")}
            </strong>
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

function GraficoFinanceiro({ serie }) {
    const pontos = serie?.length ? serie : [];
    const maiorValor = Math.max(...pontos.map((ponto) => Number(ponto.valor_transacionado ?? 0)), 1);
    return (
        <section className="mt-8 rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Evolucao financeira</p>
                    <h2 className="mt-2 text-2xl font-semibold">Movimento por periodo</h2>
                </div>
                <p className="text-sm text-app-cinza">Somente pedidos pagos e nao cancelados.</p>
            </div>
            <div className="mt-6 flex h-56 items-end gap-2 overflow-x-auto rounded-[12px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/45">
                {pontos.map((ponto) => {
                    const altura = Math.max((Number(ponto.valor_transacionado ?? 0) / maiorValor) * 100, ponto.pedidos ? 8 : 2);
                    return (
                        <div key={ponto.data} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                            <div className="flex h-36 w-full items-end">
                                <div
                                    title={`${ponto.label}: ${formatarMoeda(ponto.valor_transacionado)} em ${ponto.pedidos} pedido(s)`}
                                    className="w-full rounded-t-[10px] bg-app-caramelo-torrado transition hover:bg-app-mocha"
                                    style={{ height: `${altura}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-semibold text-app-cinza">{ponto.label}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default function AdminFinanceiroPage() {
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [admin, setAdmin] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState("pedidos");
    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [periodoAtivo, setPeriodoAtivo] = useState("30d");
    const [restauranteSelecionado, setRestauranteSelecionado] = useState(null);
    const [atualizando, setAtualizando] = useState(false);
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
        metricas_gerais: {
            total_clientes: 0,
            total_restaurantes: 0,
            restaurantes_conectados: 0,
            total_reservas: 0,
            total_pedidos: 0,
            pedidos_ativos: 0,
            ticket_medio: 0,
        },
        pagamentos: [],
        eventos: [],
        restaurantes: [],
        serie_financeira: [],
        pendencias: null,
        politica_financeira: null,
    });

    const eventosRecentes = useMemo(() => dados.eventos?.slice(0, 8) ?? [], [dados.eventos]);
    const termoBusca = busca.trim().toLowerCase();
    const pagamentosFiltrados = useMemo(() => (
        (dados.pagamentos ?? []).filter((pagamento) => {
            const statusOk = filtroStatus === "todos" || pagamento.status_repasse === filtroStatus;
            const texto = [
                pagamento.id_pedido,
                pagamento.pedido?.restaurantes?.nome,
                pagamento.pedido?.clientes?.nome,
                pagamento.status_repasse,
                pagamento.pedido?.status_pedido,
            ].filter(Boolean).join(" ").toLowerCase();
            return statusOk && (!termoBusca || texto.includes(termoBusca));
        })
    ), [dados.pagamentos, filtroStatus, termoBusca]);
    const restaurantesFiltrados = useMemo(() => (
        (dados.restaurantes ?? []).filter((restaurante) => {
            const texto = [
                restaurante.nome,
                restaurante.email,
                restaurante.telefone,
                restaurante.conexao_mercado_pago?.status,
            ].filter(Boolean).join(" ").toLowerCase();
            return !termoBusca || texto.includes(termoBusca);
        })
    ), [dados.restaurantes, termoBusca]);
    const restaurantesComAtencao = useMemo(() => (
        dados.restaurantes?.filter((restaurante) => restaurante.metricas?.valor_retido > 0 ||
            restaurante.conexao_mercado_pago?.status !== "CONECTADO").slice(0, 6) ?? []
    ), [dados.restaurantes]);

    async function sairParaHome() {
        await encerrarSessao();
        window.location.href = "/";
    }

    async function atualizarPainel() {
        setAtualizando(true);
        setErro("");
        try {
            const resposta = await apiRequest(`/admin/financeiro/resumo?periodo=${periodoAtivo}`);
            setDados(resposta);
        }
        catch (error) {
            setErro(error instanceof Error ? error.message : "Nao foi possivel atualizar o painel administrativo.");
        }
        finally {
            setAtualizando(false);
        }
    }

    useEffect(() => {
        async function carregarPainel() {
            try {
                const perfil = await apiRequest("/me");
                if (perfil.tipo !== "admin") {
                    throw new Error("Acesso restrito a administradores Appono.");
                }
                setAdmin(perfil.perfil);
                const resposta = await apiRequest(`/admin/financeiro/resumo?periodo=${periodoAtivo}`);
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
    }, [periodoAtivo]);

    function exportarRelatorioCsv() {
        const cabecalho = [
            "Pedido",
            "Restaurante",
            "Cliente",
            "Reserva",
            "Status pedido",
            "Status repasse",
            "Valor pago",
            "Comissao Appono",
            "Valor restaurante",
        ];
        const linhas = pagamentosFiltrados.map((pagamento) => [
            pagamento.id_pedido ?? "",
            pagamento.pedido?.restaurantes?.nome ?? "",
            pagamento.pedido?.clientes?.nome ?? "",
            formatarReserva(pagamento.pedido?.reservas?.data_reserva, pagamento.pedido?.reservas?.horario_inicio),
            textoStatusPedido(pagamento.pedido?.status_pedido),
            textoStatusRepasse(pagamento.status_repasse),
            Number(pagamento.valor_pago ?? pagamento.valor ?? 0).toFixed(2),
            Number(pagamento.valor_comissao_app ?? 0).toFixed(2),
            Number(pagamento.valor_restaurante ?? 0).toFixed(2),
        ]);
        const csv = [cabecalho, ...linhas]
            .map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";"))
            .join("\n");
        const arquivo = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement("a");
        link.href = url;
        link.download = `appono-financeiro-${periodoAtivo}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

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
                    <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                        <span className="rounded-full bg-app-cafe-profundo px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve">
                            {admin?.nome ?? "Administracao"}
                        </span>
                        <Link href="/admin/notificacoes" className="rounded-full border border-app-baunilha-dourada bg-app-chantilly px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-baunilha-dourada">
                            Notificacoes
                        </Link>
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
                        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
                            Retencao, comissao e repasses da Appono
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-app-mocha">
                            Painel da plataforma para acompanhar pagamentos, taxa de {Number(dados.politica_financeira?.percentual_comissao_app ?? 13).toLocaleString("pt-BR")}%, valores retidos ate entrega e liberacao de repasses.
                        </p>
                    </div>

                    <article className="rounded-[14px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Acompanhamento financeiro</p>
                        <strong className="mt-4 block text-3xl">{dados.pendencias?.abertos ?? dados.suporte?.abertos ?? 0}</strong>
                        <p className="mt-2 text-sm leading-6 text-app-creme-suave">
                            pendencias operacionais por retencao, cancelamento ou restaurante sem conexao.
                        </p>
                    </article>
                </div>

                <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                    {cardsResumo.map((card) => (
                        <CardResumo key={card.key} label={card.label} value={dados.resumo?.[card.key]} destaque={card.destaque} />
                    ))}
                </section>

                <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
                    {cardsOperacao.map((card) => (
                        <CardOperacao key={card.key} label={card.label} value={dados.metricas_gerais?.[card.key]} moeda={card.moeda} />
                    ))}
                </section>

                <section className="mt-8 flex flex-col gap-4 rounded-[14px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Periodo analisado</p>
                        <p className="mt-2 text-sm leading-6 text-app-mocha">
                            Use o recorte para explicar a evolucao do caixa sem misturar testes antigos com dados recentes.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filtrosPeriodo.map((periodo) => (
                            <button key={periodo.value} type="button" onClick={() => setPeriodoAtivo(periodo.value)} className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${periodoAtivo === periodo.value ? "bg-app-cafe-profundo text-app-creme-leve" : "bg-app-chantilly text-app-mocha hover:bg-app-baunilha-dourada"}`}>
                                {periodo.label}
                            </button>
                        ))}
                    </div>
                </section>

                <GraficoFinanceiro serie={dados.serie_financeira} />

                <section className="mt-10 rounded-[14px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {abas.map((aba) => (
                                <button key={aba.value} type="button" onClick={() => setAbaAtiva(aba.value)} className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${abaAtiva === aba.value ? "bg-app-cafe-profundo text-app-creme-leve" : "bg-app-chantilly text-app-mocha hover:bg-app-baunilha-dourada"}`}>
                                    {aba.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3 sm:min-w-80 sm:flex-row">
                            <label className="campo-busca-app flex h-10 items-center rounded-full border border-app-baunilha-dourada/70 bg-app-chantilly px-4 transition">
                                <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar no painel..." className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo placeholder:text-app-cinza/60" />
                            </label>
                            <button type="button" onClick={atualizarPainel} disabled={atualizando} className="h-10 rounded-full bg-app-caramelo-torrado px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-mocha disabled:cursor-not-allowed disabled:opacity-60">
                                {atualizando ? "Atualizando..." : "Atualizar"}
                            </button>
                        </div>
                    </div>
                </section>

                {abaAtiva === "pedidos" ? (
                    <section className="mt-8 rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <div className="flex flex-col gap-4 border-b border-app-baunilha-dourada/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Conciliacao</p>
                                <h2 className="mt-2 text-2xl font-semibold">Pedidos pagos</h2>
                            </div>
                            <div className="flex flex-col gap-3 sm:items-end">
                                <div className="flex flex-wrap gap-2">
                                    {filtrosStatus.map((filtro) => (
                                        <button key={filtro.value} type="button" onClick={() => setFiltroStatus(filtro.value)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${filtroStatus === filtro.value ? "bg-app-cafe-profundo text-app-creme-leve" : "bg-app-chantilly text-app-mocha hover:bg-app-baunilha-dourada"}`}>
                                            {filtro.label}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" onClick={exportarRelatorioCsv} disabled={!pagamentosFiltrados.length} className="h-10 rounded-full border border-app-caramelo-torrado px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-caramelo-torrado hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                                    Exportar CSV
                                </button>
                            </div>
                        </div>

                        {pagamentosFiltrados.length ? (
                            <div className="mt-5 divide-y divide-app-baunilha-dourada/50">
                                {pagamentosFiltrados.slice(0, 12).map((pagamento) => (
                                    <article key={pagamento.id_pagamento} className="grid gap-4 py-5 text-sm text-app-mocha lg:grid-cols-[0.7fr_1fr_1fr_1fr_1fr]">
                                        <div>
                                            <strong className="block text-app-cafe-profundo">#{pagamento.id_pedido}</strong>
                                            <span className="text-xs text-app-cinza">{textoStatusPedido(pagamento.pedido?.status_pedido)}</span>
                                        </div>
                                        <span>{pagamento.pedido?.restaurantes?.nome ?? "Restaurante"}</span>
                                        <span>{formatarReserva(pagamento.pedido?.reservas?.data_reserva, pagamento.pedido?.reservas?.horario_inicio)}</span>
                                        <div>
                                            <strong className="block text-app-caramelo-torrado">{textoStatusRepasse(pagamento.status_repasse)}</strong>
                                            <span className="text-xs text-app-cinza">Fluxo {textoFluxoPagamento(pagamento.tipo_fluxo_pagamento)}</span>
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
                    </section>
                ) : null}

                {abaAtiva === "eventos" ? (
                    <section className="mt-8 rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Historico financeiro</p>
                        <h2 className="mt-2 text-2xl font-semibold">Eventos recentes</h2>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {eventosRecentes.length ? eventosRecentes.map((evento) => (
                                <div key={evento.id_evento} className="rounded-[12px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/55">
                                    <div className="flex items-start justify-between gap-3">
                                        <strong className="text-sm text-app-cafe-profundo">{textoTipoEvento(evento.tipo_evento)}</strong>
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
                    </section>
                ) : null}

                {abaAtiva === "restaurantes" ? (
                    <section className="mt-8 rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <div className="flex flex-col gap-3 border-b border-app-baunilha-dourada/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Parceiros</p>
                                <h2 className="mt-2 text-2xl font-semibold">Restaurantes cadastrados</h2>
                            </div>
                            <p className="text-sm text-app-cinza">{restaurantesFiltrados.length} restaurante(s)</p>
                        </div>
                        <div className="mt-5 grid gap-3 lg:grid-cols-2">
                            {restaurantesFiltrados.slice(0, 12).map((restaurante) => (
                                <button key={restaurante.id_restaurante} type="button" onClick={() => setRestauranteSelecionado(restaurante)} className="grid gap-4 rounded-[12px] bg-app-chantilly p-4 text-left text-sm ring-1 ring-app-baunilha-dourada/55 transition hover:-translate-y-0.5 hover:bg-app-baunilha-dourada/35 md:grid-cols-[1fr_auto]">
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
                                </button>
                            ))}
                        </div>
                        {restaurantesFiltrados.length ? null : (
                            <p className="mt-5 rounded-[12px] bg-app-chantilly p-4 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/55">
                                Nenhum restaurante encontrado para a busca atual.
                            </p>
                        )}
                        {restauranteSelecionado ? (
                            <article className="mt-6 rounded-[14px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Detalhe do parceiro</p>
                                        <h3 className="mt-2 text-2xl font-semibold">{restauranteSelecionado.nome}</h3>
                                        <p className="mt-2 text-sm text-app-creme-suave">{restauranteSelecionado.email ?? restauranteSelecionado.telefone ?? "Contato nao informado"}</p>
                                    </div>
                                    <button type="button" onClick={() => setRestauranteSelecionado(null)} className="w-fit rounded-full border border-app-baunilha-dourada/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-baunilha-dourada/20">
                                        Fechar
                                    </button>
                                </div>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-[12px] bg-app-mocha/55 p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-baunilha-dourada">Mercado Pago</span>
                                        <strong className="mt-2 block">{textoConexaoMercadoPago(restauranteSelecionado.conexao_mercado_pago)}</strong>
                                    </div>
                                    <div className="rounded-[12px] bg-app-mocha/55 p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-baunilha-dourada">Pedidos pagos</span>
                                        <strong className="mt-2 block">{restauranteSelecionado.metricas?.pedidos_pagos ?? 0}</strong>
                                    </div>
                                    <div className="rounded-[12px] bg-app-mocha/55 p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-baunilha-dourada">Retido</span>
                                        <strong className="mt-2 block">{formatarMoeda(restauranteSelecionado.metricas?.valor_retido)}</strong>
                                    </div>
                                    <div className="rounded-[12px] bg-app-mocha/55 p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-baunilha-dourada">Liberado</span>
                                        <strong className="mt-2 block">{formatarMoeda(restauranteSelecionado.metricas?.valor_liberado)}</strong>
                                    </div>
                                </div>
                            </article>
                        ) : null}
                    </section>
                ) : null}

                {abaAtiva === "pendencias" ? (
                    <section className="mt-8 rounded-[14px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Acompanhamento financeiro</p>
                        <h2 className="mt-2 text-2xl font-semibold">Pendencias operacionais</h2>
                        <p className="mt-3 text-sm leading-6 text-app-mocha">
                            Casos com valor retido, cancelamento ou parceiro sem conexao Mercado Pago aparecem aqui para acompanhamento interno da Appono.
                        </p>
                        <div className="mt-5 grid gap-3">
                            {((dados.pendencias?.itens ?? dados.suporte?.itens)?.length ? (dados.pendencias?.itens ?? dados.suporte?.itens) : restaurantesComAtencao).slice(0, 6).map((item, index) => (
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
                            {!(dados.pendencias?.itens ?? dados.suporte?.itens)?.length && !restaurantesComAtencao.length ? (
                                <p className="rounded-[12px] bg-app-chantilly p-4 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/55">
                                    Nenhuma ocorrencia operacional no momento.
                                </p>
                            ) : null}
                        </div>
                    </section>
                ) : null}
            </section>
        </main>
    );
}
