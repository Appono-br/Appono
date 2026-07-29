"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido, textoStatusRepasse } from "@/lib/formatadores-status";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";

const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Pedidos", href: "/restaurante/pedidos" },
    { label: "Historico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];

const filtros = [
    { label: "Todos", value: "TODOS" },
    { label: "Entregues", value: "ENTREGUE" },
    { label: "Cancelados", value: "CANCELADO" },
    { label: "Removidos da cozinha", value: "REMOVIDOS" },
];

const filtrosPeriodo = [
    { label: "Todo periodo", value: "TODOS" },
    { label: "Hoje", value: "HOJE" },
    { label: "7 dias", value: "7_DIAS" },
    { label: "30 dias", value: "30_DIAS" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        menu: "M4 7h16M4 12h16M4 17h16",
        receipt: "M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z",
        search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z",
        calendar: "M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
        money: "M4 7h16v10H4V7z M7 10h.01M17 14h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
        download: "M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2",
        print: "M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7v-7Z",
        chevron: "m8 10 4 4 4-4",
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

function formatarData(data) {
    if (!data) {
        return "Sem data";
    }

    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function obterDataPedido(pedido) {
    const data = pedido.reservas?.data_reserva ?? pedido.data_pedido?.slice(0, 10);
    return data ? new Date(`${data}T12:00:00`) : null;
}

function pedidoPassaPeriodo(pedido, periodo) {
    if (periodo === "TODOS") {
        return true;
    }

    const dataPedido = obterDataPedido(pedido);
    if (!dataPedido) {
        return false;
    }

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    if (periodo === "HOJE") {
        return dataPedido.toDateString() === hoje.toDateString();
    }

    const dias = periodo === "7_DIAS" ? 7 : 30;
    const dataLimite = new Date(hoje);
    dataLimite.setDate(hoje.getDate() - dias + 1);
    return dataPedido >= dataLimite && dataPedido <= hoje;
}

function calcularSubtotalItem(item) {
    return Number(item.subtotal ?? 0) || Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);
}

function obterPagamentoPrincipal(pedido) {
    return Array.isArray(pedido.pagamentos) ? pedido.pagamentos[0] : null;
}

function obterClasseStatus(status) {
    if (status === "CANCELADO") {
        return "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/30";
    }

    if (status === "ENTREGUE") {
        return "bg-app-dourado-mel/15 text-app-cafe-profundo ring-app-dourado-mel/40";
    }

    return "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo";
}

function obterItensResumo(pedido) {
    const itens = pedido.itens_pedido ?? [];
    if (!itens.length) {
        return "Sem itens detalhados";
    }

    const principais = itens.slice(0, 2).map((item) => `${item.quantidade}x ${item.produtos?.nome ?? "Item"}`);
    const restantes = itens.length > 2 ? ` +${itens.length - 2}` : "";
    return `${principais.join(", ")}${restantes}`;
}

function escaparCsv(valor) {
    const texto = String(valor ?? "");
    return `"${texto.replaceAll('"', '""')}"`;
}

function gerarCsvHistorico(pedidos) {
    const linhas = [
        ["Pedido", "Cliente", "Data", "Horario", "Status", "Itens", "Valor total", "Valor pago", "Repasse"].map(escaparCsv).join(";"),
        ...pedidos.map((pedido) => {
            const pagamento = obterPagamentoPrincipal(pedido);
            return [
                pedido.id_pedido,
                pedido.clientes?.nome ?? "Cliente",
                formatarData(pedido.reservas?.data_reserva),
                pedido.reservas?.horario_inicio?.slice(0, 5) ?? "--:--",
                textoStatusPedido(pedido.status_pedido),
                obterItensResumo(pedido),
                Number(pedido.valor_total ?? 0).toFixed(2).replace(".", ","),
                Number(pagamento?.valor_pago ?? 0).toFixed(2).replace(".", ","),
                textoStatusRepasse(pagamento?.status_repasse ?? "NAO_APLICAVEL"),
            ].map(escaparCsv).join(";");
        }),
    ];
    return linhas.join("\n");
}

function EmptyPanel() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[16px] bg-app-creme-leve px-6 py-10 text-center ring-1 ring-app-baunilha-dourada/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                <Icon type="receipt" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold">Nenhum pedido no historico</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
                Pedidos entregues, cancelados ou removidos da cozinha aparecem aqui para consulta operacional e financeira.
            </p>
        </div>
    );
}

export default function RestaurantOrderHistoryPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [filtro, setFiltro] = useState("TODOS");
    const [periodo, setPeriodo] = useState("TODOS");
    const [busca, setBusca] = useState("");
    const [pedidosAbertos, setPedidosAbertos] = useState([]);
    const [mensagem, setMensagem] = useState("Carregando historico de pedidos...");

    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }

        apiRequest("/pedidos/historico/restaurante")
            .then((resposta) => {
                setPedidos(resposta ?? []);
                setMensagem("");
            })
            .catch((erro) => setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o historico."));
    }, [sessao, sessaoCarregada]);

    const pedidosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return pedidos.filter((pedido) => {
            const passaFiltro = filtro === "TODOS" ||
                pedido.status_pedido === filtro ||
                (filtro === "REMOVIDOS" && pedido.ocultado_cozinha === true);
            const passaPeriodo = pedidoPassaPeriodo(pedido, periodo);
            const textoBusca = [
                pedido.id_pedido,
                pedido.clientes?.nome,
                pedido.clientes?.telefone,
                pedido.reservas?.data_reserva,
                pedido.status_pedido,
                ...(pedido.itens_pedido ?? []).map((item) => item.produtos?.nome),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return passaFiltro && passaPeriodo && (!termo || textoBusca.includes(termo));
        });
    }, [busca, filtro, pedidos, periodo]);

    const resumo = useMemo(() => {
        return pedidosFiltrados.reduce((acc, pedido) => {
            const pagamento = obterPagamentoPrincipal(pedido);
            acc.total += 1;
            acc.entregues += pedido.status_pedido === "ENTREGUE" ? 1 : 0;
            acc.cancelados += pedido.status_pedido === "CANCELADO" ? 1 : 0;
            acc.valor += pedido.status_pedido === "CANCELADO" ? 0 : Number(pagamento?.valor_pago ?? pedido.valor_total ?? 0);
            return acc;
        }, { total: 0, entregues: 0, cancelados: 0, valor: 0 });
    }, [pedidosFiltrados]);

    function alternarPedidoAberto(pedidoId) {
        setPedidosAbertos((atuais) => atuais.includes(pedidoId)
            ? atuais.filter((id) => id !== pedidoId)
            : [...atuais, pedidoId]);
    }

    function exportarCsv() {
        const csv = gerarCsvHistorico(pedidosFiltrados);
        const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `historico-pedidos-appono-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }

    if (sessao?.type !== "restaurant") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">Esta area e destinada a contas de restaurante.</p>
                    <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
                        Entrar
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
                    <div aria-label="Appono">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
                    </div>

                    <nav className="hidden items-center justify-self-center gap-5 text-xs font-semibold text-app-cinza xl:flex">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={item.href === "/restaurante/historico-pedidos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
                        <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
                        <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-history-menu">
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <nav id="restaurant-history-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => (
                                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/historico-pedidos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
                <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Historico operacional</p>
                        <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">Historico de pedidos</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
                            Consulte pedidos entregues, cancelados e removidos da fila da cozinha sem perder rastreabilidade.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={exportarCsv} disabled={!pedidosFiltrados.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-app-cafe-profundo transition hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada disabled:cursor-not-allowed disabled:opacity-50">
                            <Icon type="download" className="h-4 w-4" />
                            CSV
                        </button>
                        <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-app-cafe-profundo transition hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada">
                            <Icon type="print" className="h-4 w-4" />
                            Imprimir
                        </button>
                        <Link href="/restaurante/pedidos" className="inline-flex h-10 items-center justify-center rounded-[10px] bg-app-cafe-profundo px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                            Cozinha
                        </Link>
                    </div>
                </div>

                <section className="mt-8 grid gap-3 md:grid-cols-4">
                    {[
                        ["Pedidos", resumo.total],
                        ["Entregues", resumo.entregues],
                        ["Cancelados", resumo.cancelados],
                        ["Vendas validas", formatarMoeda(resumo.valor)],
                    ].map(([label, value], index) => (
                        <article key={label} className={`rounded-[12px] px-4 py-3 ring-1 ring-app-baunilha-dourada/55 ${index === 3 ? "bg-app-cafe-profundo text-app-creme-leve" : "bg-app-creme-leve text-app-cafe-profundo"}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${index === 3 ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>{label}</p>
                            <strong className="mt-2 block text-xl font-semibold">{value}</strong>
                        </article>
                    ))}
                </section>

                <section className="mt-6 rounded-[14px] bg-app-creme-leve p-4 ring-1 ring-app-baunilha-dourada/65">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                        <label className="flex h-11 items-center gap-3 rounded-[10px] bg-app-chantilly px-4 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/60">
                            <Icon type="search" className="h-4 w-4" />
                            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por cliente, pedido, data ou item..." className="h-full min-w-0 flex-1 bg-transparent text-app-cafe-profundo outline-none placeholder:text-app-cinza/60" />
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {filtros.map((item) => (
                                <button key={item.value} type="button" onClick={() => setFiltro(item.value)} className={`h-10 rounded-[8px] border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition ${filtro === item.value ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly" : "border-app-baunilha-dourada bg-app-creme-leve text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada"}`}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-app-baunilha-dourada/55 pt-3">
                        {filtrosPeriodo.map((item) => (
                            <button key={item.value} type="button" onClick={() => setPeriodo(item.value)} className={`h-8 rounded-full border px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition ${periodo === item.value ? "border-app-cafe-profundo bg-app-cafe-profundo text-app-creme-leve" : "border-app-baunilha-dourada bg-app-chantilly text-app-cinza hover:border-app-caramelo-torrado hover:text-app-cafe-profundo"}`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                {mensagem ? <p className="mt-6 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

                <section className="mt-8">
                    {pedidosFiltrados.length ? (
                        <div className="grid gap-5">
                            {pedidosFiltrados.map((pedido) => {
                                const pagamento = obterPagamentoPrincipal(pedido);
                                const totalItens = (pedido.itens_pedido ?? []).reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
                                return (
                                    <article key={pedido.id_pedido} className="rounded-[14px] bg-app-creme-leve p-4 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-5">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">#{pedido.id_pedido}</span>
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${obterClasseStatus(pedido.status_pedido)}`}>{textoStatusPedido(pedido.status_pedido)}</span>
                                                    {pedido.ocultado_cozinha ? <span className="rounded-full bg-app-chantilly px-2.5 py-1 text-[11px] font-bold text-app-cinza ring-1 ring-app-baunilha-dourada/60">Removido</span> : null}
                                                </div>

                                                <h2 className="mt-2 truncate text-xl font-semibold text-app-cafe-profundo">{pedido.clientes?.nome ?? "Cliente"}</h2>
                                                <p className="mt-1 text-sm text-app-cinza">
                                                    {formatarData(pedido.reservas?.data_reserva)} · {pedido.reservas?.horario_inicio?.slice(0, 5) ?? "--:--"} · Mesa {pedido.reservas?.mesas?.numero_mesa ?? "-"} · {pedido.reservas?.quantidade_pessoas ?? "-"} pessoas
                                                </p>
                                                <p className="mt-2 truncate text-sm text-app-mocha">{obterItensResumo(pedido)}</p>
                                            </div>

                                            <div className="grid gap-2 text-left lg:min-w-72 lg:text-right">
                                                <strong className="text-2xl font-semibold text-app-cafe-profundo">{formatarMoeda(pedido.valor_total)}</strong>
                                                <span className="text-xs text-app-cinza">Pago {formatarMoeda(pagamento?.valor_pago ?? 0)} · {textoStatusRepasse(pagamento?.status_repasse ?? "NAO_APLICAVEL")}</span>
                                                <button type="button" onClick={() => alternarPedidoAberto(pedido.id_pedido)} className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-app-baunilha-dourada bg-app-chantilly px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-app-cafe-profundo transition hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada lg:justify-self-end">
                                                    {pedidosAbertos.includes(pedido.id_pedido) ? "Ocultar itens" : `Ver ${totalItens} itens`}
                                                    <Icon type="chevron" className={`h-4 w-4 transition ${pedidosAbertos.includes(pedido.id_pedido) ? "rotate-180" : ""}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {pedidosAbertos.includes(pedido.id_pedido) ? (
                                            <div className="mt-4 border-t border-app-baunilha-dourada/60 pt-4">
                                                <div className="grid gap-2">
                                                    {(pedido.itens_pedido ?? []).map((item, indice) => (
                                                        <div key={`${pedido.id_pedido}-${item.produtos?.nome ?? indice}`} className="flex items-start justify-between gap-4 rounded-[10px] bg-app-chantilly px-3 py-2 text-sm text-app-mocha ring-1 ring-app-baunilha-dourada/45">
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-app-cafe-profundo">{item.quantidade}x {item.produtos?.nome ?? "Item"}</p>
                                                                {item.observacoes ? <p className="mt-1 text-xs text-app-cinza">Obs.: {item.observacoes}</p> : null}
                                                            </div>
                                                            <strong className="shrink-0 text-app-cafe-profundo">{formatarMoeda(calcularSubtotalItem(item))}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-3 grid gap-2 rounded-[10px] bg-app-cafe-profundo px-3 py-3 text-xs text-app-creme-suave sm:grid-cols-3">
                                                    <span>Liquido: <strong className="text-app-creme-leve">{formatarMoeda(pagamento?.valor_restaurante ?? 0)}</strong></span>
                                                    <span>Comissao: <strong className="text-app-creme-leve">{formatarMoeda(pagamento?.valor_comissao_app ?? 0)}</strong></span>
                                                    <span>Data pagamento: <strong className="text-app-creme-leve">{pagamento?.data_pagamento ? new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR") : "Nao informado"}</strong></span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyPanel />
                    )}
                </section>
            </section>
        </main>
    );
}
