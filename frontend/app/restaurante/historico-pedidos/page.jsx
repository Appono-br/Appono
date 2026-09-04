"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";
import { textoStatusPedido, textoStatusRepasse, textoStatusReserva } from "@/lib/formatadores-status";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";

const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestão de cardápio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatório financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Histórico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configurações", href: "/restaurante/configuracoes" },
];

const filtros = [
    { label: "Todos", value: "TODOS" },
    { label: "Entregues", value: "ENTREGUE" },
    { label: "Cancelados", value: "CANCELADO" },
    { label: "Removidos da cozinha", value: "REMOVIDOS" },
];

const filtrosReserva = [
    { label: "Todas", value: "TODOS" },
    { label: "Finalizadas", value: "CONCLUIDA" },
    { label: "Canceladas", value: "CANCELADA" },
    { label: "Com pedido", value: "COM_PEDIDO" },
    { label: "Somente reserva", value: "SOMENTE_RESERVA" },
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

function obterDataReserva(reserva) {
    return reserva.data_reserva ? new Date(`${reserva.data_reserva}T12:00:00`) : null;
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

function reservaPassaPeriodo(reserva, periodo) {
    if (periodo === "TODOS") {
        return true;
    }

    const dataReserva = obterDataReserva(reserva);
    if (!dataReserva) {
        return false;
    }

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    if (periodo === "HOJE") {
        return dataReserva.toDateString() === hoje.toDateString();
    }

    const dias = periodo === "7_DIAS" ? 7 : 30;
    const dataLimite = new Date(hoje);
    dataLimite.setDate(hoje.getDate() - dias + 1);
    return dataReserva >= dataLimite && dataReserva <= hoje;
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

function obterClasseStatusReserva(status) {
    if (status === "CANCELADA" || status === "RECUSADA") {
        return "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/30";
    }

    if (status === "CONCLUIDA") {
        return "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo";
    }

    if (status === "CHECK_IN") {
        return "bg-app-dourado-mel/15 text-app-cafe-profundo ring-app-dourado-mel/40";
    }

    return "bg-app-creme-suave text-app-cafe-profundo ring-app-baunilha-dourada/70";
}

function obterPedidosAtivos(reserva) {
    return (reserva.pedidos ?? []).filter((pedido) => pedido.status_pedido !== "CANCELADO");
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
function obterCamposPedidoHistórico(pedido) {
    const pagamento = obterPagamentoPrincipal(pedido);
    return [
        `pedido ${pedido.id_pedido}`,
        pedido.id_pedido,
        pedido.clientes?.nome,
        pedido.clientes?.telefone,
        pedido.reservas?.data_reserva,
        pedido.reservas?.horario_inicio,
        pedido.reservas?.horario_fim,
        pedido.reservas?.mesas?.numero_mesa ? `mesa ${pedido.reservas.mesas.numero_mesa}` : "",
        pedido.reservas?.quantidade_pessoas ? `${pedido.reservas.quantidade_pessoas} pessoas` : "",
        pedido.status_pedido,
        textoStatusPedido(pedido.status_pedido),
        pedido.observacoes,
        pedido.valor_total,
        pagamento?.status_pagamento,
        pagamento?.status_repasse,
        textoStatusRepasse(pagamento?.status_repasse ?? "NAO_APLICAVEL"),
        ...(pedido.itens_pedido ?? []).map((item) => textoBusca(
            item.produtos?.nome,
            item.produtos?.descricao,
            item.observacoes,
            item.quantidade ? `${item.quantidade}x` : "",
        )),
    ];
}
function obterCamposReservaHistórico(reserva) {
    const pedidosAtivos = obterPedidosAtivos(reserva);
    return [
        `reserva ${reserva.id_reserva}`,
        reserva.id_reserva,
        reserva.clientes?.nome,
        reserva.clientes?.telefone,
        reserva.data_reserva,
        reserva.horario_inicio,
        reserva.horario_fim,
        reserva.status_reserva,
        textoStatusReserva(reserva.status_reserva),
        reserva.mesas?.numero_mesa ? `mesa ${reserva.mesas.numero_mesa}` : "",
        reserva.quantidade_pessoas ? `${reserva.quantidade_pessoas} pessoas` : "",
        reserva.valor_minimo_total,
        ...pedidosAtivos.map((pedido) => textoBusca(
            `pedido ${pedido.id_pedido}`,
            pedido.status_pedido,
            textoStatusPedido(pedido.status_pedido),
            pedido.valor_total,
            ...(pedido.itens_pedido ?? []).map((item) => textoBusca(item.produtos?.nome, item.observacoes)),
        )),
    ];
}

function escaparCsv(valor) {
    const texto = String(valor ?? "");
    return `"${texto.replaceAll('"', '""')}"`;
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function gerarCsvHistórico(pedidos) {
    const linhas = [
        ["Pedido", "Cliente", "Data", "Horário", "Status", "Itens", "Valor total", "Valor pago", "Repasse"].map(escaparCsv).join(";"),
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

function gerarCsvReservas(reservas) {
    const linhas = [
        ["Reserva", "Cliente", "Data", "Horário", "Mesa", "Pessoas", "Status", "Tipo"].map(escaparCsv).join(";"),
        ...reservas.map((reserva) => {
            const pedidosAtivos = obterPedidosAtivos(reserva);
            return [
                reserva.id_reserva,
                reserva.clientes?.nome ?? "Cliente",
                formatarData(reserva.data_reserva),
                reserva.horario_inicio?.slice(0, 5) ?? "--:--",
                reserva.mesas?.numero_mesa ?? "-",
                reserva.quantidade_pessoas ?? "-",
                textoStatusReserva(reserva.status_reserva),
                pedidosAtivos.length ? "Com pedido antecipado" : "Somente reserva",
            ].map(escaparCsv).join(";");
        }),
    ];
    return linhas.join("\n");
}

function montarHtmlComanda(pedido) {
    const itens = pedido.itens_pedido ?? [];
    const pagamento = obterPagamentoPrincipal(pedido);
    const linhasItens = itens.map((item) => `
        <tr>
            <td>
                <strong>${escaparHtml(item.quantidade)}x ${escaparHtml(item.produtos?.nome ?? "Item")}</strong>
                ${item.observacoes ? `<small>Obs.: ${escaparHtml(item.observacoes)}</small>` : ""}
            </td>
            <td>${escaparHtml(formatarMoeda(calcularSubtotalItem(item)))}</td>
        </tr>
    `).join("");
    const fallbackItens = "<tr><td>Sem itens detalhados</td><td>-</td></tr>";

    return `
        <!doctype html>
        <html lang="pt-BR">
            <head>
                <meta charset="utf-8" />
                <title>Comanda Pedido #${escaparHtml(pedido.id_pedido)}</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        margin: 0;
                        padding: 24px;
                        color: #24130c;
                        font-family: Arial, Helvetica, sans-serif;
                        background: #fff;
                    }
                    .comanda {
                        width: 320px;
                        margin: 0 auto;
                        border: 1px solid #24130c;
                        padding: 18px;
                    }
                    h1 {
                        margin: 0;
                        font-size: 24px;
                        text-transform: uppercase;
                    }
                    h2 {
                        margin: 6px 0 0;
                        font-size: 15px;
                        font-weight: 700;
                    }
                    .meta {
                        margin-top: 14px;
                        padding: 10px 0;
                        border-top: 1px dashed #24130c;
                        border-bottom: 1px dashed #24130c;
                        font-size: 13px;
                        line-height: 1.55;
                    }
                    table {
                        width: 100%;
                        margin-top: 14px;
                        border-collapse: collapse;
                    }
                    td {
                        vertical-align: top;
                        border-bottom: 1px solid #e5d3bd;
                        padding: 9px 0;
                        font-size: 13px;
                    }
                    td:last-child {
                        width: 76px;
                        text-align: right;
                        font-weight: 700;
                    }
                    small {
                        display: block;
                        margin-top: 4px;
                        color: #6b5749;
                        font-size: 11px;
                    }
                    .total {
                        margin-top: 14px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 16px;
                        font-weight: 800;
                    }
                    .rodape {
                        margin-top: 14px;
                        border-top: 1px dashed #24130c;
                        padding-top: 10px;
                        font-size: 11px;
                        color: #6b5749;
                    }
                    @media print {
                        body { padding: 0; }
                        .comanda { border: 0; width: 100%; }
                    }
                </style>
            </head>
            <body>
                <section class="comanda">
                    <h1>Pedido #${escaparHtml(pedido.id_pedido)}</h1>
                    <h2>${escaparHtml(pedido.clientes?.nome ?? "Cliente")}</h2>
                    <div class="meta">
                        <div><strong>Status:</strong> ${escaparHtml(textoStatusPedido(pedido.status_pedido))}</div>
                        <div><strong>Data:</strong> ${escaparHtml(formatarData(pedido.reservas?.data_reserva))}</div>
                        <div><strong>Horário:</strong> ${escaparHtml(pedido.reservas?.horario_inicio?.slice(0, 5) ?? "--:--")}</div>
                        <div><strong>Mesa:</strong> ${escaparHtml(pedido.reservas?.mesas?.numero_mesa ?? "-")}</div>
                        <div><strong>Pessoas:</strong> ${escaparHtml(pedido.reservas?.quantidade_pessoas ?? "-")}</div>
                    </div>
                    <table>
                        <tbody>
                            ${linhasItens || fallbackItens}
                        </tbody>
                    </table>
                    <div class="total">
                        <span>Total</span>
                        <span>${escaparHtml(formatarMoeda(pagamento?.valor_pago ?? pedido.valor_total ?? 0))}</span>
                    </div>
                    ${pedido.observacoes ? `<div class="rodape"><strong>Obs. pedido:</strong> ${escaparHtml(pedido.observacoes)}</div>` : ""}
                    <div class="rodape">Impresso pela Appono em ${escaparHtml(new Date().toLocaleString("pt-BR"))}</div>
                </section>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
        </html>
    `;
}

function EmptyPanel() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[16px] bg-app-creme-leve px-6 py-10 text-center ring-1 ring-app-baunilha-dourada/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                <Icon type="receipt" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold">Nenhum pedido no histórico</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
                Pedidos entregues, cancelados ou removidos da cozinha aparecem aqui para consulta operacional.
            </p>
        </div>
    );
}

export default function RestaurantOrderHistoryPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState("PEDIDOS");
    const [pedidos, setPedidos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [filtro, setFiltro] = useState("TODOS");
    const [filtroReserva, setFiltroReserva] = useState("TODOS");
    const [periodo, setPeriodo] = useState("TODOS");
    const [busca, setBusca] = useState("");
    const [pedidosAbertos, setPedidosAbertos] = useState([]);
    const [mensagem, setMensagem] = useState("Carregando histórico operacional...");

    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }

        Promise.all([
            apiRequest("/pedidos/historico/restaurante"),
            apiRequest("/reservas"),
        ])
            .then(([respostaPedidos, respostaReservas]) => {
                setPedidos(respostaPedidos ?? []);
                setReservas(respostaReservas ?? []);
                setMensagem("");
            })
            .catch((erro) => setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar o histórico."));
    }, [sessao, sessaoCarregada]);

    const pedidosFiltrados = useMemo(() => {
        const pedidosPorFiltro = pedidos.filter((pedido) => {
            const passaFiltro = filtro === "TODOS" ||
                pedido.status_pedido === filtro ||
                (filtro === "REMOVIDOS" && pedido.ocultado_cozinha === true);
            const passaPeriodo = pedidoPassaPeriodo(pedido, periodo);
            return passaFiltro && passaPeriodo;
        });
        return filtrarOrdenarPorBusca(pedidosPorFiltro, busca, obterCamposPedidoHistórico);
    }, [busca, filtro, pedidos, periodo]);

    const reservasFiltradas = useMemo(() => {
        const reservasPorFiltro = reservas.filter((reserva) => {
            const pedidosAtivos = obterPedidosAtivos(reserva);
            const passaFiltro = filtroReserva === "TODOS" ||
                reserva.status_reserva === filtroReserva ||
                (filtroReserva === "COM_PEDIDO" && pedidosAtivos.length > 0) ||
                (filtroReserva === "SOMENTE_RESERVA" && pedidosAtivos.length === 0);
            const passaPeriodo = reservaPassaPeriodo(reserva, periodo);
            return passaFiltro && passaPeriodo;
        });
        return filtrarOrdenarPorBusca(reservasPorFiltro, busca, obterCamposReservaHistórico);
    }, [busca, filtroReserva, periodo, reservas]);

    const resumo = useMemo(() => {
        const resumoPedidos = pedidosFiltrados.reduce((acc, pedido) => {
            acc.total += 1;
            acc.entregues += pedido.status_pedido === "ENTREGUE" ? 1 : 0;
            acc.cancelados += pedido.status_pedido === "CANCELADO" ? 1 : 0;
            return acc;
        }, { total: 0, entregues: 0, cancelados: 0 });
        const resumoReservas = reservasFiltradas.reduce((acc, reserva) => {
            acc.total += 1;
            acc.concluidas += reserva.status_reserva === "CONCLUIDA" ? 1 : 0;
            acc.canceladas += reserva.status_reserva === "CANCELADA" ? 1 : 0;
            return acc;
        }, { total: 0, concluidas: 0, canceladas: 0 });

        return { pedidos: resumoPedidos, reservas: resumoReservas };
    }, [pedidosFiltrados, reservasFiltradas]);

    function alternarPedidoAberto(pedidoId) {
        setPedidosAbertos((atuais) => atuais.includes(pedidoId)
            ? atuais.filter((id) => id !== pedidoId)
            : [...atuais, pedidoId]);
    }

    function exportarCsv() {
        const csv = abaAtiva === "PEDIDOS"
            ? gerarCsvHistórico(pedidosFiltrados)
            : gerarCsvReservas(reservasFiltradas);
        const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `historico-${abaAtiva.toLowerCase()}-appono-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function imprimirPedido(pedido) {
        const janela = window.open("", "_blank", "width=420,height=680");
        if (!janela) {
            setMensagem("Não foi possível abrir a janela de impressao. Verifique o bloqueador de pop-ups.");
            return;
        }

        janela.document.open();
        janela.document.write(montarHtmlComanda(pedido));
        janela.document.close();
    }

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }

    if (sessao?.type !== "restaurant") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">Esta área é destinada a contas de restaurante.</p>
                    <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
                        Entrar
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
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
                        <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-history-menu">
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
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Histórico operacional</p>
                        <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">Histórico</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
                            Consulte pedidos e reservas em um único lugar, separando cozinha e recepção sem perder rastreabilidade.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={exportarCsv} disabled={abaAtiva === "PEDIDOS" ? !pedidosFiltrados.length : !reservasFiltradas.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-app-baunilha-dourada bg-app-creme-leve px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-app-cafe-profundo transition hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada disabled:cursor-not-allowed disabled:opacity-50">
                            <Icon type="download" className="h-4 w-4" />
                            CSV
                        </button>
                        <Link href={abaAtiva === "PEDIDOS" ? "/restaurante/pedidos" : "/restaurante/reservas"} className="inline-flex h-10 items-center justify-center rounded-[10px] bg-app-cafe-profundo px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                            {abaAtiva === "PEDIDOS" ? "Cozinha" : "Reservas"}
                        </Link>
                    </div>
                </div>

                <section className="mt-8 rounded-[14px] bg-app-creme-leve p-2 ring-1 ring-app-baunilha-dourada/65">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => setAbaAtiva("PEDIDOS")} className={`rounded-[11px] px-4 py-3 text-left transition ${abaAtiva === "PEDIDOS" ? "bg-app-cafe-profundo text-app-creme-leve shadow-sm" : "text-app-cafe-profundo hover:bg-app-chantilly"}`}>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Cozinha</span>
                            <strong className="mt-1 block text-lg">Pedidos</strong>
                        </button>
                        <button type="button" onClick={() => setAbaAtiva("RESERVAS")} className={`rounded-[11px] px-4 py-3 text-left transition ${abaAtiva === "RESERVAS" ? "bg-app-cafe-profundo text-app-creme-leve shadow-sm" : "text-app-cafe-profundo hover:bg-app-chantilly"}`}>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Recepção</span>
                            <strong className="mt-1 block text-lg">Reservas</strong>
                        </button>
                    </div>
                </section>

                <section className="mt-6 grid gap-3 md:grid-cols-3">
                    {(abaAtiva === "PEDIDOS"
                        ? [
                            ["Pedidos", resumo.pedidos.total],
                            ["Entregues", resumo.pedidos.entregues],
                            ["Cancelados", resumo.pedidos.cancelados],
                        ]
                        : [
                            ["Reservas", resumo.reservas.total],
                            ["Finalizadas", resumo.reservas.concluidas],
                            ["Canceladas", resumo.reservas.canceladas],
                        ]).map(([label, value]) => (
                            <article key={label} className="rounded-[12px] bg-app-creme-leve px-4 py-3 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/55">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-cinza">{label}</p>
                                <strong className="mt-2 block text-xl font-semibold">{value}</strong>
                            </article>
                        ))}
                </section>

                <section className="mt-6 rounded-[14px] bg-app-creme-leve p-4 ring-1 ring-app-baunilha-dourada/65">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                        <label className="campo-busca-app flex h-11 items-center gap-3 rounded-[10px] border border-app-baunilha-dourada/60 bg-white px-4 text-sm text-app-cinza transition">
                            <Icon type="search" className="h-4 w-4" />
                            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={abaAtiva === "PEDIDOS" ? "Buscar por cliente, pedido, data ou item..." : "Buscar por cliente, reserva, data ou mesa..."} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-app-cafe-profundo placeholder:text-app-cinza/60" />
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {(abaAtiva === "PEDIDOS" ? filtros : filtrosReserva).map((item) => {
                                const ativo = abaAtiva === "PEDIDOS" ? filtro === item.value : filtroReserva === item.value;
                                return (
                                    <button key={item.value} type="button" onClick={() => abaAtiva === "PEDIDOS" ? setFiltro(item.value) : setFiltroReserva(item.value)} className={`h-10 rounded-[8px] border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition ${ativo ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly" : "border-app-baunilha-dourada bg-app-creme-leve text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada"}`}>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-app-baunilha-dourada/55 pt-3">
                        {filtrosPeriodo.map((item) => (
                            <button key={item.value} type="button" onClick={() => setPeriodo(item.value)} className={`h-8 rounded-full border px-3 text-[10px] font-bold uppercase tracking-[0.12em] transition ${periodo === item.value ? "border-app-cafe-profundo bg-app-cafe-profundo text-app-creme-leve" : "border-app-baunilha-dourada bg-white text-app-cinza hover:border-app-caramelo-torrado hover:text-app-cafe-profundo"}`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                {mensagem ? <p className="mt-6 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

                <section className="mt-8">
                    {abaAtiva === "PEDIDOS" ? (
                        pedidosFiltrados.length ? (
                            <div className="grid gap-5">
                                {pedidosFiltrados.map((pedido) => {
                                    const pagamento = obterPagamentoPrincipal(pedido);
                                    const totalItens = (pedido.itens_pedido ?? []).reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
                                    return (
                                        <article key={pedido.id_pedido} className="rounded-[14px] bg-app-creme-leve p-4 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-5">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Pedido #{pedido.id_pedido}</span>
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${obterClasseStatus(pedido.status_pedido)}`}>{textoStatusPedido(pedido.status_pedido)}</span>
                                                        {pedido.ocultado_cozinha ? <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-app-cinza ring-1 ring-app-baunilha-dourada/60">Removido</span> : null}
                                                    </div>

                                                    <h2 className="mt-2 truncate text-xl font-semibold text-app-cafe-profundo">{pedido.clientes?.nome ?? "Cliente"}</h2>
                                                    <p className="mt-1 text-sm text-app-cinza">
                                                        {formatarData(pedido.reservas?.data_reserva)} - {pedido.reservas?.horario_inicio?.slice(0, 5) ?? "--:--"} - Mesa {pedido.reservas?.mesas?.numero_mesa ?? "-"} - {pedido.reservas?.quantidade_pessoas ?? "-"} pessoas
                                                    </p>
                                                    <p className="mt-2 truncate text-sm text-app-mocha">{obterItensResumo(pedido)}</p>
                                                </div>

                                                <div className="grid gap-2 text-left lg:min-w-72 lg:text-right">
                                                    <strong className="text-2xl font-semibold text-app-cafe-profundo">{formatarMoeda(pedido.valor_total)}</strong>
                                                    <span className="text-xs text-app-cinza">Pago {formatarMoeda(pagamento?.valor_pago ?? 0)} - {textoStatusRepasse(pagamento?.status_repasse ?? "NAO_APLICAVEL")}</span>
                                                    <div className="flex flex-wrap gap-2 lg:justify-end">
                                                        <button type="button" onClick={() => imprimirPedido(pedido)} className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-app-cafe-profundo px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                                                            <Icon type="print" className="h-4 w-4" />
                                                            Comanda
                                                        </button>
                                                        <button type="button" onClick={() => alternarPedidoAberto(pedido.id_pedido)} className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-app-cafe-profundo transition hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada">
                                                            {pedidosAbertos.includes(pedido.id_pedido) ? "Ocultar itens" : `Ver ${totalItens} itens`}
                                                            <Icon type="chevron" className={`h-4 w-4 transition ${pedidosAbertos.includes(pedido.id_pedido) ? "rotate-180" : ""}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {pedidosAbertos.includes(pedido.id_pedido) ? (
                                                <div className="mt-4 border-t border-app-baunilha-dourada/60 pt-4">
                                                    <div className="grid gap-2">
                                                        {(pedido.itens_pedido ?? []).map((item, indice) => (
                                                            <div key={`${pedido.id_pedido}-${item.produtos?.nome ?? indice}`} className="flex items-start justify-between gap-4 rounded-[10px] bg-white px-3 py-2 text-sm text-app-mocha ring-1 ring-app-baunilha-dourada/45">
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
                                                        <span>Comissão: <strong className="text-app-creme-leve">{formatarMoeda(pagamento?.valor_comissao_app ?? 0)}</strong></span>
                                                        <span>Data pagamento: <strong className="text-app-creme-leve">{pagamento?.data_pagamento ? new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR") : "Não informado"}</strong></span>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyPanel />
                        )
                    ) : reservasFiltradas.length ? (
                        <div className="grid gap-4">
                            {reservasFiltradas.map((reserva) => {
                                const pedidosAtivos = obterPedidosAtivos(reserva);
                                const pedidoPrincipal = pedidosAtivos[0];
                                return (
                                    <article key={reserva.id_reserva} className="rounded-[14px] bg-app-creme-leve p-4 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-5">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Reserva #{reserva.id_reserva}</span>
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${obterClasseStatusReserva(reserva.status_reserva)}`}>{textoStatusReserva(reserva.status_reserva)}</span>
                                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-app-cinza ring-1 ring-app-baunilha-dourada/60">
                                                        {pedidosAtivos.length ? "Com pedido" : "Somente reserva"}
                                                    </span>
                                                </div>
                                                <h2 className="mt-2 truncate text-xl font-semibold text-app-cafe-profundo">{reserva.clientes?.nome ?? "Cliente"}</h2>
                                                <p className="mt-1 text-sm text-app-cinza">
                                                    {formatarData(reserva.data_reserva)} - {reserva.horario_inicio?.slice(0, 5) ?? "--:--"} até {reserva.horario_fim?.slice(0, 5) ?? "--:--"} - Mesa {reserva.mesas?.numero_mesa ?? "-"}
                                                </p>
                                            </div>

                                            <div className="grid gap-2 text-sm text-app-mocha lg:min-w-72 lg:text-right">
                                                <strong className="text-lg text-app-cafe-profundo">{reserva.quantidade_pessoas} pessoa(s)</strong>
                                                <span>Consumo mínimo {formatarMoeda(reserva.valor_minimo_total)}</span>
                                                {pedidoPrincipal ? <span>Pedido #{pedidoPrincipal.id_pedido} - {textoStatusPedido(pedidoPrincipal.status_pedido)}</span> : <span>Sem pedido antecipado</span>}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center rounded-[16px] bg-app-creme-leve px-6 py-10 text-center ring-1 ring-app-baunilha-dourada/70">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                                <Icon type="calendar" />
                            </div>
                            <h3 className="mt-5 text-2xl font-semibold">Nenhuma reserva no histórico</h3>
                            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
                                Reservas finalizadas, canceladas e demais registros aparecem aqui para consulta da recepção.
                            </p>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}
