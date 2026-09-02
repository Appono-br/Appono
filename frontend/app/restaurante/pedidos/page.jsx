"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";

const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Historico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];

const filtrosPedido = [
    { label: "Todos", value: "TODOS" },
    { label: "A fazer", value: "CONFIRMADO" },
    { label: "Em preparo", value: "EM_PREPARO" },
    { label: "Prontos", value: "PRONTO" },
    { label: "Entregues", value: "ENTREGUE" },
    { label: "Cancelados", value: "CANCELADO" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        menu: "M4 7h16M4 12h16M4 17h16",
        clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
        receipt: "M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z",
        search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
        user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
        trash: "M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3",
    };

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path
                d={paths[type]}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function calcularSubtotalItem(item) {
    return Number(item.subtotal ?? 0) || Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);
}
function formatarHoraPrevista(valor, fallback) {
    if (valor) {
        return String(valor).slice(11, 16);
    }
    return fallback?.slice(0, 5) ?? "--";
}

function obterStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        CONFIRMADO: "Aguardando preparo",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto para servir",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };

    return statusMap[status] ?? status;
}

function obterClasseStatus(status) {
    if (status === "CANCELADO") {
        return "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/30";
    }
    if (status === "PRONTO" || status === "ENTREGUE") {
        return "bg-app-dourado-mel/15 text-app-cafe-profundo ring-app-dourado-mel/40";
    }
    if (status === "EM_PREPARO") {
        return "bg-app-caramelo-torrado/15 text-app-caramelo-torrado ring-app-caramelo-torrado/35";
    }
    return "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo";
}

function obterProximaAcaoPedido(status) {
    if (status === "CONFIRMADO") {
        return {
            texto: "Iniciar preparo",
            status: "EM_PREPARO",
            classe: "bg-app-dourado-mel hover:bg-app-caramelo-torrado",
        };
    }

    if (status === "EM_PREPARO") {
        return {
            texto: "Marcar como pronto",
            status: "PRONTO",
            classe: "bg-app-cafe-profundo hover:bg-app-cacau-intenso",
        };
    }

    if (status === "PRONTO") {
        return {
            texto: "Marcar como entregue",
            status: "ENTREGUE",
            classe: "bg-app-dourado-mel hover:bg-app-caramelo-torrado",
        };
    }

    return null;
}

function pedidoPodeSairDaCozinha(status) {
    return ["PRONTO", "ENTREGUE", "CANCELADO"].includes(status);
}

function agruparPedidosPorReserva(pedidos = []) {
    const reservasPorId = new Map();

    pedidos.forEach((pedido) => {
        const reservaOrigem = pedido.reservas ?? {};
        const idReserva = pedido.id_reserva ?? reservaOrigem.id_reserva ?? `pedido-${pedido.id_pedido}`;
        const reserva = reservasPorId.get(idReserva) ?? {
            ...reservaOrigem,
            id_reserva: idReserva,
            clientes: pedido.clientes,
            pedidos: [],
        };

        reserva.clientes = reserva.clientes ?? pedido.clientes;
        reserva.pedidos.push(pedido);
        reservasPorId.set(idReserva, reserva);
    });

    return Array.from(reservasPorId.values());
}
function obterCamposPedido(pedido) {
    const reserva = pedido.reserva ?? pedido.reservas ?? {};
    return [
        `pedido ${pedido.id_pedido}`,
        pedido.id_pedido,
        pedido.status_pedido,
        obterStatusPedido(pedido.status_pedido),
        pedido.observacoes,
        pedido.valor_total,
        reserva.clientes?.nome,
        reserva.clientes?.telefone,
        pedido.clientes?.nome,
        pedido.clientes?.telefone,
        reserva.id_reserva ? `reserva ${reserva.id_reserva}` : "",
        reserva.data_reserva,
        reserva.horario_inicio,
        reserva.horario_fim,
        reserva.mesas?.numero_mesa ? `mesa ${reserva.mesas.numero_mesa}` : "",
        reserva.quantidade_pessoas ? `${reserva.quantidade_pessoas} pessoas` : "",
        ...(pedido.itens_pedido ?? []).map((item) => textoBusca(
            item.produtos?.nome,
            item.produtos?.descricao,
            item.observacoes,
            item.quantidade ? `${item.quantidade}x` : "",
        )),
    ];
}

function EmptyPanel({ title, description }) {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[16px] bg-app-creme-leve px-6 py-10 text-center ring-1 ring-app-baunilha-dourada/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                <Icon type="receipt" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">{description}</p>
        </div>
    );
}

export default function RestaurantOrdersPage() {
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }

        const storedSession = window.localStorage.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reservas, setReservas] = useState([]);
    const [filtroPedido, setFiltroPedido] = useState("TODOS");
    const [busca, setBusca] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [pedidoParaRemover, setPedidoParaRemover] = useState(null);
    const [removendoPedido, setRemovendoPedido] = useState(false);
    const isRestaurant = session?.type === "restaurant";

    useEffect(() => {
        if (!isRestaurant) {
            return;
        }

        apiRequest("/pedidos/historico/restaurante?fila=cozinha")
            .then((pedidosOperacionais) => setReservas(agruparPedidosPorReserva(pedidosOperacionais ?? [])))
            .catch((erro) =>
                setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar os pedidos."),
            );
    }, [isRestaurant]);

    const pedidos = useMemo(() => {
        return reservas.flatMap((reserva) =>
            (reserva.pedidos ?? [])
                .filter((pedido) => pedido.ocultado_cozinha !== true)
                .filter((pedido) => pedido.status_pedido !== "PENDENTE")
                .map((pedido) => ({
                    ...pedido,
                    reserva,
                })),
        );
    }, [reservas]);

    const pedidosPorFiltro = useMemo(() => {
        if (filtroPedido === "TODOS") {
            return pedidos;
        }

        return pedidos.filter((pedido) => pedido.status_pedido === filtroPedido);
    }, [filtroPedido, pedidos]);
    const pedidosFiltrados = useMemo(() => {
        return filtrarOrdenarPorBusca(pedidosPorFiltro, busca, obterCamposPedido);
    }, [busca, pedidosPorFiltro]);

    async function atualizarStatusPedido(idPedido, statusPedido) {
        try {
            const atualizado = await apiRequest(`/pedidos/${idPedido}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status_pedido: statusPedido }),
            });

            setReservas((atuais) =>
                atuais.map((reserva) => ({
                    ...reserva,
                    pedidos: reserva.pedidos?.map((pedido) =>
                        pedido.id_pedido === idPedido ? { ...pedido, ...atualizado } : pedido,
                    ),
                })),
            );
            setMensagem("Status do pedido atualizado.");
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel atualizar o pedido.");
        }
    }

    async function removerPedidoDaCozinha() {
        if (!pedidoParaRemover) {
            return;
        }

        setRemovendoPedido(true);
        try {
            await apiRequest(`/pedidos/${pedidoParaRemover.id_pedido}/ocultar-cozinha`, {
                method: "PATCH",
            });

            setReservas((atuais) =>
                atuais.map((reserva) => ({
                    ...reserva,
                    pedidos: (reserva.pedidos ?? []).filter(
                        (pedido) => pedido.id_pedido !== pedidoParaRemover.id_pedido,
                    ),
                })),
            );
            setMensagem("Pedido removido da fila da cozinha. O historico continua preservado.");
            setPedidoParaRemover(null);
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel remover o pedido da cozinha.");
        } finally {
            setRemovendoPedido(false);
        }
    }

    if (!isRestaurant) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image
                        src="/brand/appono-mark.svg"
                        alt="Appono"
                        width={88}
                        height={88}
                        className="mx-auto h-20 w-20"
                        priority
                    />
                    <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">
                        Esta area e destinada a contas de restaurante.
                    </p>
                    <Link
                        href="/login"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado"
                    >
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
                        <Image
                            src="/brand/appono-mark.svg"
                            alt="Appono"
                            width={88}
                            height={88}
                            className="h-11 w-11 lg:h-14 lg:w-14"
                            priority
                        />
                    </div>

                    <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={item.href === "/restaurante/pedidos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center justify-end gap-3 justify-self-end">
                        <Link
                            href="/restaurante/notificacoes"
                            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-app-cafe-profundo transition hover:bg-app-chantilly hover:text-app-caramelo-torrado"
                            aria-label="Notificacoes"
                        >
                            <Icon type="bell" />
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((current) => !current)}
                            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden"
                            aria-label="Abrir menu"
                            aria-expanded={mobileMenuOpen}
                            aria-controls="restaurant-orders-menu"
                        >
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <nav id="restaurant-orders-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={item.href === "/restaurante/pedidos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
                <div className="border-t border-app-baunilha-dourada/60 pt-10">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
                            Cozinha Appono
                        </p>
                        <h1 className="mt-2 whitespace-nowrap text-3xl font-medium leading-tight text-app-cafe-profundo sm:text-4xl lg:text-5xl">
                            Cozinha
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
                            Acompanhe os pedidos pagos, a ordem das reservas e as entregas vinculadas ao atendimento.
                        </p>
                    </div>

                    <label className="campo-busca-app mt-6 flex h-11 w-full max-w-2xl items-center gap-3 rounded-[10px] border border-app-baunilha-dourada/70 bg-white px-4 text-app-mocha shadow-sm transition">
                        <Icon type="search" className="h-4 w-4 shrink-0" />
                        <span className="sr-only">Buscar pedidos na cozinha</span>
                        <input
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                            placeholder="Buscar por cliente, pedido, mesa, status, item ou horario..."
                            className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo placeholder:text-app-cinza/60"
                        />
                    </label>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        {filtrosPedido.map((filtro) => (
                            <button
                                key={filtro.value}
                                type="button"
                                onClick={() => setFiltroPedido(filtro.value)}
                                className={`inline-flex h-10 shrink-0 items-center justify-center rounded-[8px] border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition ${filtroPedido === filtro.value
                                    ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly"
                                    : "border-app-baunilha-dourada bg-app-creme-leve text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada"}`}
                            >
                                {filtro.label}
                            </button>
                        ))}
                    </div>
                </div>

                {mensagem ? <p className="mt-6 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

                <section className="mt-10">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                            Fila de preparo
                        </h2>
                        <p className="text-sm text-app-cinza">
                            {pedidosFiltrados.length} de {pedidos.length} pedidos
                        </p>
                    </div>

                    {pedidosFiltrados.length ? (
                        <div className="grid gap-5">
                            {pedidosFiltrados.map((pedido) => {
                                const reserva = pedido.reserva;
                                const acao = obterProximaAcaoPedido(pedido.status_pedido);
                                const totalItensPedido = (pedido.itens_pedido ?? []).reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
                                const podeRemoverDaCozinha = pedidoPodeSairDaCozinha(pedido.status_pedido);

                                return (
                                    <article
                                        key={pedido.id_pedido}
                                        className="overflow-hidden rounded-[14px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/75"
                                    >
                                        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_250px]">
                                            <div className="flex items-center justify-between gap-4 border-b border-app-baunilha-dourada/55 bg-white px-5 py-4 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                                                        Pedido
                                                    </p>
                                                    <p className="mt-1 text-2xl font-semibold text-app-cafe-profundo">
                                                        #{pedido.id_pedido}
                                                    </p>
                                                </div>
                                                <span className={`w-full whitespace-nowrap rounded-full px-3 py-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] ring-1 sm:w-fit lg:w-full ${obterClasseStatus(pedido.status_pedido)}`}>
                                                    {obterStatusPedido(pedido.status_pedido)}
                                                </span>
                                            </div>

                                            <div className="min-w-0 px-5 py-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
                                                            Reserva vinculada
                                                        </p>
                                                        <h3 className="mt-2 text-xl font-semibold text-app-cafe-profundo">
                                                            {reserva.clientes?.nome ?? "Cliente"}
                                                        </h3>
                                                    </div>
                                                    <strong className="text-xl text-app-cafe-profundo">
                                                        {formatarMoeda(pedido.valor_total)}
                                                    </strong>
                                                </div>

                                                <div className="mt-5 grid gap-3 text-sm text-app-mocha sm:grid-cols-3">
                                                    <div className="rounded-[10px] bg-white px-3 py-3 ring-1 ring-app-baunilha-dourada/45">
                                                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">Reserva</span>
                                                        <strong className="mt-1 block text-app-cafe-profundo">{reserva.data_reserva} as {reserva.horario_inicio?.slice(0, 5)}</strong>
                                                    </div>
                                                    <div className="rounded-[10px] bg-white px-3 py-3 ring-1 ring-app-baunilha-dourada/45">
                                                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">Mesa</span>
                                                        <strong className="mt-1 block text-app-cafe-profundo">{reserva.mesas?.numero_mesa ?? "-"}</strong>
                                                    </div>
                                                    <div className="rounded-[10px] bg-white px-3 py-3 ring-1 ring-app-baunilha-dourada/45">
                                                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">Pessoas</span>
                                                        <strong className="mt-1 block text-app-cafe-profundo">{reserva.quantidade_pessoas}</strong>
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid gap-3">
                                                    {pedido.itens_pedido?.map((item, indice) => (
                                                        <div
                                                            key={`${item.produtos?.nome ?? "item"}-${indice}`}
                                                            className="flex items-start justify-between gap-4 rounded-[10px] bg-white px-4 py-3 text-sm text-app-mocha ring-1 ring-app-baunilha-dourada/45"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-app-cafe-profundo">
                                                                    {item.quantidade}x {item.produtos?.nome ?? "Item"}
                                                                </p>
                                                                {item.observacoes ? (
                                                                    <p className="mt-1 text-xs text-app-cinza">
                                                                        Obs.: {item.observacoes}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                            <strong className="shrink-0 text-app-cafe-profundo">
                                                                {formatarMoeda(calcularSubtotalItem(item))}
                                                            </strong>
                                                        </div>
                                                    ))}
                                                </div>

                                                {pedido.observacoes ? (
                                                    <p className="mt-4 rounded-[10px] bg-app-creme-suave px-4 py-3 text-sm text-app-mocha">
                                                        Observacao geral: {pedido.observacoes}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <aside className="flex flex-col justify-between border-t border-app-baunilha-dourada/55 bg-white px-5 py-4 text-app-cafe-profundo lg:border-l lg:border-t-0">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">
                                                        Entrega
                                                    </p>
                                                    <p className="mt-2 text-2xl font-semibold">
                                                        {formatarHoraPrevista(pedido.horario_entrega_previsto, reserva.horario_inicio)}
                                                    </p>
                                                    <div className="mt-4 grid gap-2 text-sm text-app-mocha">
                                                        <span className="rounded-[8px] bg-app-creme-leve px-3 py-2 ring-1 ring-app-baunilha-dourada/45">
                                                            {totalItensPedido} item(ns)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-6 grid gap-3">
                                                    {acao ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => atualizarStatusPedido(pedido.id_pedido, acao.status)}
                                                            className={`h-11 rounded-[9px] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:bg-app-cinza/45 disabled:text-app-creme-suave ${acao.classe}`}
                                                        >
                                                            {acao.texto}
                                                        </button>
                                                    ) : (
                                                        <p className="rounded-[10px] bg-app-creme-leve px-4 py-3 text-sm font-semibold text-app-cinza ring-1 ring-app-baunilha-dourada/45">
                                                            Nenhuma acao pendente para este pedido.
                                                        </p>
                                                    )}

                                                    {podeRemoverDaCozinha ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPedidoParaRemover(pedido)}
                                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition hover:-translate-y-0.5 hover:border-app-caramelo-torrado hover:bg-app-caramelo-torrado hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-app-baunilha-dourada/70"
                                                        >
                                                            <Icon type="trash" className="h-4 w-4" />
                                                            Remover da cozinha
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </aside>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyPanel
                            title="Nenhum pedido neste filtro"
                            description="Pedidos pagos aparecem aqui em ordem de reserva. Os mais proximos ficam primeiro para orientar a cozinha."
                        />
                    )}
                </section>
            </section>

            {pedidoParaRemover ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 py-8 backdrop-blur-[2px]">
                    <section className="w-full max-w-md rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                            <Icon type="trash" />
                        </div>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                            Remover da cozinha
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold">
                            Tirar pedido #{pedidoParaRemover.id_pedido} da fila?
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-app-cinza">
                            Esta acao remove o pedido apenas da tela operacional da cozinha. O registro continua salvo no historico, no financeiro e nas reservas.
                        </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setPedidoParaRemover(null)}
                                disabled={removendoPedido}
                                className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-transparent px-4 text-xs font-bold uppercase tracking-[0.14em] text-app-cafe-profundo transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Manter pedido
                            </button>
                            <button
                                type="button"
                                onClick={removerPedidoDaCozinha}
                                disabled={removendoPedido}
                                className="botao-acao-critica h-11 rounded-[10px] px-4 text-xs font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {removendoPedido ? "Removendo..." : "Remover"}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
        </main>
    );
}
