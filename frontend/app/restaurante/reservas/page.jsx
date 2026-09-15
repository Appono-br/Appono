"use client";

import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { filtrarOrdenarPorBusca, textoBusca } from "@/lib/busca-avancada";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const navItems = [
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestão de cardápio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatório financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Histórico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Suporte", href: "/restaurante/suporte" },
    { label: "Configurações", href: "/restaurante/configuracoes" },
];
const filtrosPedido = [
    { label: "Todos", value: "TODOS" },
    { label: "Somente reserva", value: "SOMENTE_RESERVA" },
    { label: "Pedido aguardando pagamento", value: "PEDIDO_PENDENTE" },
    { label: "Pedido pago", value: "PEDIDO_PAGO" },
    { label: "Em atendimento", value: "EM_ATENDIMENTO" },
    { label: "Finalizadas", value: "CONCLUIDA" },
    { label: "Não compareceu", value: "NAO_COMPARECEU" },
    { label: "Cancelados", value: "CANCELADO" },
];
const ordenacoesReserva = [
    { label: "Próximos horários", value: "HORARIO" },
    { label: "Check-in primeiro", value: "CHECK_IN" },
    { label: "Status operacional", value: "STATUS" },
    { label: "Maior grupo", value: "PESSOAS" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        filter: "M4 7h16M7 12h10M10 17h4",
        menu: "M4 7h16M4 12h16M4 17h16",
        message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
        plus: "M12 5v14M5 12h14",
        search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
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

function EmptyPanel({ title, description, className = "" }) {
    const { ui } = useInterface();
    return (
        <div
            className={`flex min-h-52 flex-col justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/30 bg-app-creme-leve px-6 py-8 text-app-cafe-profundo ${className}`}
        >
            <h3 className="text-xl font-semibold">{ui(title)}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
                {ui(description)}
            </p>
        </div>
    );
}

function formatarMoeda(valor, localeUI = "pt-BR") {
    return new Intl.NumberFormat(localeUI, {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function obterStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };

    return statusMap[status] ?? status;
}

function obterStatusReserva(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        CONFIRMADA: "Confirmada",
        CHECK_IN: "Check-in realizado",
        CANCELADA: "Cancelada",
        RECUSADA: "Recusada",
        CONCLUIDA: "Finalizada",
        NAO_COMPARECEU: "Não compareceu",
    };
    return statusMap[status] ?? status;
}
function obterClasseStatusReserva(status) {
    if (["CANCELADA", "RECUSADA", "NAO_COMPARECEU"].includes(status)) {
        return "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/25";
    }
    if (status === "CHECK_IN") {
        return "bg-app-dourado-mel/20 text-app-cafe-profundo ring-app-dourado-mel/40";
    }
    if (status === "CONCLUIDA") {
        return "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo";
    }
    return "bg-app-creme-suave text-app-cafe-profundo ring-app-baunilha-dourada/70";
}
function obterStatusConfirmacaoPresenca(status) {
    const statusMap = {
        PENDENTE: "Aguardando cliente",
        CONFIRMADA: "Presença confirmada",
        RECUSADA: "Ausência informada",
        EXPIRADA: "Prazo expirado",
    };
    return statusMap[status] ?? "Aguardando cliente";
}
function obterClasseConfirmacaoPresenca(status) {
    if (status === "CONFIRMADA") {
        return "bg-app-dourado-mel/20 text-app-cafe-profundo ring-app-dourado-mel/40";
    }
    if (status === "RECUSADA" || status === "EXPIRADA") {
        return "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/25";
    }
    return "bg-app-creme-suave text-app-mocha ring-app-baunilha-dourada/70";
}
function obterPedidosAtivos(reserva) {
    return (reserva.pedidos ?? []).filter((pedido) => pedido.status_pedido !== "CANCELADO");
}
function obterPedidoPrincipal(reserva) {
    return obterPedidosAtivos(reserva)[0] ?? null;
}
function podeFinalizarReserva(reserva) {
    return obterPedidosAtivos(reserva).every((pedido) => pedido.status_pedido === "ENTREGUE");
}
function reservaTemPedidoPago(reserva) {
    return obterPedidosAtivos(reserva).some((pedido) => ["CONFIRMADO", "EM_PREPARO", "PRONTO", "ENTREGUE"].includes(pedido.status_pedido));
}
function reservaEstaEmAtendimento(reserva) {
    return reserva.status_reserva === "CHECK_IN" || obterPedidosAtivos(reserva).some((pedido) => ["EM_PREPARO", "PRONTO"].includes(pedido.status_pedido));
}
function obterJanelaCheckIn(reserva) {
    const dataHoraReserva = new Date(`${reserva.data_reserva}T${reserva.horario_inicio}`);
    const inicioJanela = new Date(dataHoraReserva.getTime() - 15 * 60 * 1000);
    return {
        liberado: new Date() >= inicioJanela,
        horario: inicioJanela.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
}
function reservaJaTerminou(reserva) {
    const fim = new Date(`${reserva.data_reserva}T${reserva.horario_fim}`);
    return !Number.isNaN(fim.getTime()) && new Date() >= fim;
}
function obterDataHoraReserva(reserva) {
    const dataHora = new Date(`${reserva.data_reserva}T${reserva.horario_inicio}`);
    return Number.isNaN(dataHora.getTime()) ? Number.POSITIVE_INFINITY : dataHora.getTime();
}
function obterPrioridadeReserva(reserva) {
    const prioridade = {
        CHECK_IN: 0,
        CONFIRMADA: 1,
        PENDENTE: 2,
        CONCLUIDA: 3,
        NAO_COMPARECEU: 4,
        CANCELADA: 5,
        RECUSADA: 6,
    };
    return prioridade[reserva.status_reserva] ?? 7;
}
function ordenarReservas(reservas, ordenacao) {
    const lista = [...reservas];
    if (ordenacao === "CHECK_IN") {
        return lista.sort((a, b) => {
            const janelaA = obterJanelaCheckIn(a);
            const janelaB = obterJanelaCheckIn(b);
            return Number(janelaB.liberado) - Number(janelaA.liberado) || obterDataHoraReserva(a) - obterDataHoraReserva(b);
        });
    }
    if (ordenacao === "STATUS") {
        return lista.sort((a, b) => obterPrioridadeReserva(a) - obterPrioridadeReserva(b) || obterDataHoraReserva(a) - obterDataHoraReserva(b));
    }
    if (ordenacao === "PESSOAS") {
        return lista.sort((a, b) => Number(b.quantidade_pessoas ?? 0) - Number(a.quantidade_pessoas ?? 0) || obterDataHoraReserva(a) - obterDataHoraReserva(b));
    }
    return lista.sort((a, b) => obterDataHoraReserva(a) - obterDataHoraReserva(b));
}
function obterCamposReserva(reserva) {
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
        obterStatusReserva(reserva.status_reserva),
        obterStatusConfirmacaoPresenca(reserva.status_confirmacao_presenca),
        reserva.mesas?.numero_mesa ? `mesa ${reserva.mesas.numero_mesa}` : "",
        reserva.quantidade_pessoas ? `${reserva.quantidade_pessoas} pessoas` : "",
        ...pedidosAtivos.map((pedido) => textoBusca(
            `pedido ${pedido.id_pedido}`,
            pedido.status_pedido,
            obterStatusPedido(pedido.status_pedido),
            pedido.observacoes,
            ...(pedido.itens_pedido ?? []).map((item) => textoBusca(item.produtos?.nome, item.observacoes)),
        )),
    ];
}

export default function RestaurantReservationsPage() {
    const { ui , localeUI } = useInterface();
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
    const [ordenacaoReserva, setOrdenacaoReserva] = useState("HORARIO");
    const [busca, setBusca] = useState("");
    const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
    const [reservaParaExcluir, setReservaParaExcluir] = useState(null);
    const [cancelandoReserva, setCancelandoReserva] = useState(false);
    const [excluindoReserva, setExcluindoReserva] = useState(false);
    const [registrandoCheckIn, setRegistrandoCheckIn] = useState(null);
    const [finalizandoReserva, setFinalizandoReserva] = useState(null);
    const [abrindoChatReservaId, setAbrindoChatReservaId] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const isRestaurant = session?.type === "restaurant";

    useEffect(() => {
        if (!isRestaurant) {
            return;
        }

        apiRequest("/reservas?fila=operacional")
            .then(setReservas)
            .catch((erro) =>
                setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar as reservas."),
            );
    }, [isRestaurant]);

    async function cancelarReserva(id) {
        setCancelandoReserva(true);
        try {
            const atualizada = await apiRequest(`/reservas/${id}/cancelar-restaurante`, {
                method: "PATCH",
            });

            setReservas((atuais) =>
                atuais.map((reserva) => (reserva.id_reserva === id ? { ...reserva, ...atualizada } : reserva)),
            );
            setMensagem("Reserva desmarcada.");
            setReservaParaCancelar(null);
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Não foi possível desmarcar a reserva.");
        }
        finally {
            setCancelandoReserva(false);
        }
    }

    async function registrarCheckIn(id) {
        setRegistrandoCheckIn(id);
        try {
            const atualizada = await apiRequest(`/reservas/${id}/check-in`, {
                method: "PATCH",
            });

            setReservas((atuais) =>
                atuais.map((reserva) => (reserva.id_reserva === id ? { ...reserva, ...atualizada, pedidos: reserva.pedidos } : reserva)),
            );
            setMensagem("Check-in registrado. A reserva entrou em atendimento.");
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Não foi possível registrar o check-in.");
        }
        finally {
            setRegistrandoCheckIn(null);
        }
    }

    async function finalizarReserva(id) {
        setFinalizandoReserva(id);
        try {
            const atualizada = await apiRequest(`/reservas/${id}/concluir`, {
                method: "PATCH",
            });

            setReservas((atuais) =>
                atuais.map((reserva) => (reserva.id_reserva === id ? { ...reserva, ...atualizada, pedidos: reserva.pedidos } : reserva)),
            );
            setMensagem("Reserva finalizada com sucesso.");
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Não foi possível finalizar a reserva.");
        }
        finally {
            setFinalizandoReserva(null);
        }
    }

    async function excluirReservaDaLista(id) {
        setExcluindoReserva(true);
        try {
            await apiRequest(`/reservas/${id}/ocultar`, { method: "PATCH" });
            setReservas((atuais) => atuais.filter((reserva) => reserva.id_reserva !== id));
            setMensagem("Reserva removida da lista.");
            setReservaParaExcluir(null);
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Não foi possível remover a reserva.");
        } finally {
            setExcluindoReserva(false);
        }
    }

    async function abrirChatReserva(reserva) {
        const pedidoPrincipal = obterPedidoPrincipal(reserva);
        setAbrindoChatReservaId(reserva.id_reserva);
        setMensagem("");
        try {
            const conversa = await apiRequest("/mensagens/conversas", {
                method: "POST",
                body: JSON.stringify({
                    id_reserva: reserva.id_reserva,
                    id_pedido: pedidoPrincipal?.id_pedido,
                    assunto: pedidoPrincipal?.id_pedido ? `Pedido #${pedidoPrincipal.id_pedido}` : `Reserva #${reserva.id_reserva}`,
                }),
            });
            window.location.assign(`/restaurante/mensagens/${conversa.id_conversa}`);
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Não foi possível iniciar o chat.");
        } finally {
            setAbrindoChatReservaId(null);
        }
    }

    const reservasPorFiltro = useMemo(() => {
        if (filtroPedido === "TODOS") {
            return reservas;
        }
        if (filtroPedido === "SOMENTE_RESERVA") {
            return reservas.filter((reserva) => !obterPedidosAtivos(reserva).length && ["CONFIRMADA", "CHECK_IN"].includes(reserva.status_reserva));
        }
        if (filtroPedido === "PEDIDO_PENDENTE") {
            return reservas.filter((reserva) => obterPedidosAtivos(reserva).some((pedido) => pedido.status_pedido === "PENDENTE"));
        }
        if (filtroPedido === "PEDIDO_PAGO") {
            return reservas.filter(reservaTemPedidoPago);
        }
        if (filtroPedido === "EM_ATENDIMENTO") {
            return reservas.filter(reservaEstaEmAtendimento);
        }
        if (filtroPedido === "CONCLUIDA") {
            return reservas.filter((reserva) => reserva.status_reserva === "CONCLUIDA");
        }
        if (filtroPedido === "NAO_COMPARECEU") {
            return reservas.filter((reserva) => reserva.status_reserva === "NAO_COMPARECEU");
        }
        if (filtroPedido === "CANCELADO") {
            return reservas.filter((reserva) => reserva.status_reserva === "CANCELADA" || (reserva.pedidos ?? []).some((pedido) => pedido.status_pedido === "CANCELADO"));
        }
        return reservas;
    }, [filtroPedido, reservas]);
    const reservasFiltradas = useMemo(() => {
        return ordenarReservas(filtrarOrdenarPorBusca(reservasPorFiltro, busca, obterCamposReserva), ordenacaoReserva);
    }, [busca, ordenacaoReserva, reservasPorFiltro]);

    if (!isRestaurant) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image
                        src="/brand/appono-mark.svg"
                        alt={ui("Appono")}
                        width={88}
                        height={88}
                        className="mx-auto h-20 w-20"
                        priority
                    />
                    <h1 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
                    <Link
                        href="/login"
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado"
                    >{ui("Entrar")}</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
                    <div aria-label={ui("Appono")}>
                        <Image
                            src="/brand/appono-mark.svg"
                            alt={ui("Appono")}
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
                                className={item.href === "/restaurante/reservas" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
                            >
                                {ui(item.label)}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center justify-end gap-3 justify-self-end">
                        <Link
                            href="/restaurante/notificacoes"
                            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-app-cafe-profundo transition hover:bg-app-chantilly hover:text-app-caramelo-torrado"
                            aria-label={ui("Notificações")}
                        >
                            <Icon type="bell" />
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((current) => !current)}
                            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden"
                            aria-label={ui("Abrir menu")}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="restaurant-reservations-menu"
                        >
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <nav id="restaurant-reservations-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={item.href === "/restaurante/reservas" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
                                >
                                    {ui(item.label)}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
                <div className="border-t border-app-baunilha-dourada/60 pt-10">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">{ui("Reservas")}</p>
                        <h1 className="mt-2 whitespace-nowrap text-3xl font-medium leading-tight text-app-cafe-profundo sm:text-4xl lg:text-5xl">{ui("Agendamentos do Dia")}</h1>
                    </div>

                    <div className="mt-6 rounded-[16px] border border-app-baunilha-dourada/65 bg-white p-4 shadow-sm">
                        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                            <label className="campo-busca-app flex h-11 items-center gap-3 rounded-[10px] border border-app-baunilha-dourada/70 bg-white px-4 text-app-mocha shadow-sm transition">
                                <Icon type="search" className="h-4 w-4 shrink-0" />
                                <span className="sr-only">{ui("Buscar reservas")}</span>
                                <input
                                    value={busca}
                                    onChange={(event) => setBusca(event.target.value)}
                                    placeholder={ui("Buscar por cliente, mesa, reserva, pedido, status ou data...")}
                                    className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo placeholder:text-app-cinza/60"
                                />
                            </label>

                            <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado sm:min-w-56">{ui("Ordenar por")}<select value={ordenacaoReserva} onChange={(event) => setOrdenacaoReserva(event.target.value)} className="h-11 rounded-[10px] border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-caramelo-torrado/15">
                                    {ordenacoesReserva.map((item) => <option key={item.value} value={item.value}>{ui(item.label)}</option>)}
                                </select>
                            </label>
                        </div>

                        <div className="mt-4 flex gap-2 overflow-x-auto border-t border-app-baunilha-dourada/45 pt-4">
                            {filtrosPedido.map((filtro) => (
                                <button
                                    key={filtro.value}
                                    type="button"
                                    onClick={() => setFiltroPedido(filtro.value)}
                                    className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-[11px] font-bold uppercase tracking-[0.12em] ring-1 transition ${filtroPedido === filtro.value
                                        ? "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo"
                                        : "bg-white text-app-mocha ring-app-baunilha-dourada/70 hover:bg-app-chantilly hover:text-app-cafe-profundo hover:ring-app-caramelo-torrado/45"}`}
                                >
                                    {ui(filtro.label)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <section className="mt-10">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">{ui("Próximos clientes")}</h2>
                        <p className="text-sm text-app-cinza">
                            {reservasFiltradas.length}{ui(" de ")}{reservas.length}{ui(" agendamentos")}</p>
                    </div>

                    {mensagem ? <p className="mb-4 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagem)}</p> : null}

                    {reservasFiltradas.length ? (
                        <div className="grid gap-4">
                            {reservasFiltradas.map((reserva) => {
                                const janelaCheckIn = obterJanelaCheckIn(reserva);
                                const pedidoPrincipal = obterPedidoPrincipal(reserva);
                                const totalPedidosAtivos = obterPedidosAtivos(reserva).length;

                                return (
                                    <article
                                        key={reserva.id_reserva}
                                        className="overflow-hidden rounded-[14px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/75"
                                    >
                                    <div className="grid lg:grid-cols-[140px_1fr_220px]">
                                        <div className="flex items-center gap-4 border-b border-app-baunilha-dourada/55 bg-white px-5 py-4 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Data")}</p>
                                                <p className="mt-1 text-lg font-semibold text-app-cafe-profundo">
                                                    {reserva.data_reserva}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Horário")}</p>
                                                <p className="mt-1 text-lg font-semibold text-app-cafe-profundo">
                                                    {reserva.horario_inicio}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="min-w-0 px-5 py-5">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Reserva #")}{reserva.id_reserva}
                                                    </p>
                                                    <h3 className="mt-2 text-xl font-semibold text-app-cafe-profundo">
                                                        {reserva.clientes?.nome ?? ui("Cliente")}
                                                    </h3>
                                                </div>
                                                <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ring-1 ${obterClasseStatusReserva(reserva.status_reserva)}`}>
                                                    {ui(obterStatusReserva(reserva.status_reserva))}
                                                </span>
                                                {reserva.status_reserva === "CONFIRMADA" ? (
                                                    <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ring-1 ${obterClasseConfirmacaoPresenca(reserva.status_confirmacao_presenca)}`}>
                                                        {ui(obterStatusConfirmacaoPresenca(reserva.status_confirmacao_presenca))}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="mt-5 grid gap-3 text-sm text-app-mocha sm:grid-cols-3">
                                                <div className="rounded-[10px] bg-white px-4 py-3 ring-1 ring-app-baunilha-dourada/55">
                                                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Pessoas")}</span>
                                                    <strong className="mt-1 block text-app-cafe-profundo">{reserva.quantidade_pessoas}</strong>
                                                </div>
                                                <div className="rounded-[10px] bg-white px-4 py-3 ring-1 ring-app-baunilha-dourada/55">
                                                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Mesa")}</span>
                                                    <strong className="mt-1 block text-app-cafe-profundo">{ui(reserva.mesas?.numero_mesa ?? "-")}</strong>
                                                </div>
                                                <div className="rounded-[10px] bg-white px-4 py-3 ring-1 ring-app-baunilha-dourada/55">
                                                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Consumo mínimo")}</span>
                                                    <strong className="mt-1 block text-app-cafe-profundo">{formatarMoeda(reserva.valor_minimo_total, localeUI)}</strong>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3 rounded-[10px] border border-app-baunilha-dourada/60 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-app-cafe-profundo">
                                                        {pedidoPrincipal ? ui("Pedido antecipado #{0}", [pedidoPrincipal.id_pedido]) : ui("Reserva simples")}
                                                    </p>
                                                    <p className="mt-1 text-xs text-app-cinza">
                                                        {pedidoPrincipal ? ui("{0}{1}", [obterStatusPedido(pedidoPrincipal.status_pedido), totalPedidosAtivos > 1 ? ` + ${totalPedidosAtivos - 1} pedido(s)` : ""]) : ui("Sem pedido vinculado para a cozinha.")}
                                                    </p>
                                                </div>
                                                {pedidoPrincipal ? (
                                                    <Link
                                                        href="/restaurante/pedidos"
                                                        className="inline-flex h-9 items-center justify-center rounded-[8px] bg-app-cafe-profundo px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado"
                                                    >{ui("Ver na cozinha")}</Link>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2 border-t border-app-baunilha-dourada/55 bg-white px-5 py-4 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0">
                                            <button
                                                type="button"
                                                onClick={() => abrirChatReserva(reserva)}
                                                disabled={abrindoChatReservaId === reserva.id_reserva}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-app-caramelo-torrado px-3 text-xs font-bold text-app-caramelo-torrado transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Icon type="message" className="h-4 w-4" />
                                                {ui(abrindoChatReservaId === reserva.id_reserva ? "Abrindo..." : "Falar")}
                                            </button>

                                            {reserva.status_reserva === "CONFIRMADA" && !reservaJaTerminou(reserva) ? (
                                                <div className="grid gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => registrarCheckIn(reserva.id_reserva)}
                                                        disabled={!janelaCheckIn.liberado || registrandoCheckIn === reserva.id_reserva}
                                                        className="h-9 rounded-[8px] bg-app-cafe-profundo px-3 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:bg-app-cinza/50"
                                                    >
                                                        {ui(registrandoCheckIn === reserva.id_reserva ? "Registrando..." : "Registrar check-in")}
                                                    </button>
                                                    {!janelaCheckIn.liberado ? (
                                                        <span className="text-center text-[11px] font-semibold text-app-cinza lg:text-left">{ui("Libera as ")}{janelaCheckIn.horario}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            {reserva.status_reserva === "CHECK_IN" ? (
                                                <div className="grid gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => finalizarReserva(reserva.id_reserva)}
                                                        disabled={!podeFinalizarReserva(reserva) || finalizandoReserva === reserva.id_reserva}
                                                        className="h-9 rounded-[8px] bg-app-dourado-mel px-3 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:bg-app-cinza/50"
                                                    >
                                                        {ui(finalizandoReserva === reserva.id_reserva ? "Finalizando..." : "Finalizar atendimento")}
                                                    </button>
                                                    {!podeFinalizarReserva(reserva) ? (
                                                        <span className="text-[11px] font-semibold text-app-cinza">{ui("Entregue ou cancele os pedidos antes de finalizar.")}</span>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            {["PENDENTE", "CONFIRMADA"].includes(reserva.status_reserva) && !reservaJaTerminou(reserva) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setReservaParaCancelar(reserva)}
                                                    className="h-9 rounded-[8px] border border-app-vermelho-erro/40 px-3 text-xs font-bold text-app-vermelho-erro transition hover:bg-app-vermelho-erro hover:text-white"
                                                >{ui("Desmarcar")}</button>
                                            ) : null}

                                            {["CANCELADA", "RECUSADA", "CONCLUIDA", "NAO_COMPARECEU"].includes(reserva.status_reserva) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setReservaParaExcluir(reserva)}
                                                    className="h-9 rounded-[8px] border border-app-baunilha-dourada px-3 text-xs font-bold text-app-cinza transition hover:border-app-vermelho-erro/40 hover:text-app-vermelho-erro"
                                                >{ui("Excluir da lista")}</button>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyPanel
                            title={ui("Nenhum agendamento neste filtro")}
                            description={ui("Altere o filtro para visualizar outros agendamentos.")}
                            className="min-h-[310px] bg-white"
                        />
                    )}
                </section>
            </section>

            {reservaParaCancelar ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]">
                    <section className="w-full max-w-md rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Cancelamento de reserva")}</p>
                        <h2 className="mt-3 text-2xl font-semibold">{ui("Deseja desmarcar esta reserva?")}</h2>
                        <p className="mt-3 text-sm leading-6 text-app-mocha">{ui("Ao confirmar, a reserva será cancelada para o cliente. Se houver pagamento aprovado, o Mercado Pago fará o estorno antes do cancelamento.")}</p>
                        {reservaParaCancelar.pedidos?.some((pedido) => ["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido)) ? (
                            <p className="mt-3 rounded-[10px] bg-white p-3 text-sm font-semibold leading-6 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">{ui("Existe pedido antecipado vinculado. Se estiver pago, o cancelamento só será concluído após o estorno; se estiver pendente, ele será cancelado.")}</p>
                        ) : null}
                        <div className="mt-6 rounded-[10px] bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
                            <p className="text-sm font-semibold">
                                {reservaParaCancelar.clientes?.nome ?? ui("Cliente")}
                            </p>
                            <p className="mt-1 text-xs text-app-cinza">
                                {reservaParaCancelar.data_reserva} - {reservaParaCancelar.horario_inicio}{ui(" até ")}{reservaParaCancelar.horario_fim} - {reservaParaCancelar.quantidade_pessoas}{ui(" pessoas")}</p>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setReservaParaCancelar(null)}
                                disabled={cancelandoReserva}
                                className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza"
                            >{ui("Manter reserva")}</button>
                            <button
                                type="button"
                                onClick={() => cancelarReserva(reservaParaCancelar.id_reserva)}
                                disabled={cancelandoReserva}
                                className="botao-acao-critica h-11 rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:bg-app-cinza/50"
                            >
                                {ui(cancelandoReserva ? "Cancelando..." : "Confirmar cancelamento")}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}

            <ConfirmationDialog
                open={Boolean(reservaParaExcluir)}
                eyebrow={ui("Excluir da lista")}
                title={ui("Remover esta reserva da lista?")}
                description={ui("A reserva será ocultada da tela operacional do restaurante. O histórico e os registros financeiros continuam preservados.")}
                confirmLabel={ui("Excluir")}
                cancelLabel={ui("Manter")}
                loading={excluindoReserva}
                onCancel={() => setReservaParaExcluir(null)}
                onConfirm={() => excluirReservaDaLista(reservaParaExcluir.id_reserva)}
                details={reservaParaExcluir ? (
                    <div>
                        <p className="font-semibold">{reservaParaExcluir.clientes?.nome ?? ui("Cliente")}</p>
                        <p className="mt-1 text-xs text-app-cinza">
                            {reservaParaExcluir.data_reserva} - {reservaParaExcluir.horario_inicio}
                        </p>
                    </div>
                ) : null}
            />

            <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
                    <Image
                        src="/brand/appono-mark.svg"
                        alt={ui("Appono")}
                        width={80}
                        height={80}
                        className="h-14 w-14 brightness-0 invert"
                    />
                    <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
                        <Link href="#" className="transition hover:text-app-chantilly">{ui("Política de Privacidade")}</Link>
                        <Link href="#" className="transition hover:text-app-chantilly">{ui("Termos de Uso")}</Link>
                        <Link href="#" className="transition hover:text-app-chantilly">{ui("Contato")}</Link>
                    </nav>
                    <p className="text-xs font-semibold text-app-creme-suave">{ui("© 2026 APPONO. Todos os direitos reservados.")}</p>
                </div>
            </footer>
        </main>
    );
}
