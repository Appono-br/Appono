"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { calcularTempoPreparoItens, formatarHorarioPreparo, preparoEstaLiberado } from "@/lib/tempo-preparo";

const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Pedidos", href: "/restaurante/pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];
const filtrosPedido = [
    { label: "Todos", value: "TODOS" },
    { label: "Com pedido", value: "COM_PEDIDO" },
    { label: "Confirmados", value: "CONFIRMADO" },
    { label: "Em preparo", value: "EM_PREPARO" },
    { label: "Prontos", value: "PRONTO" },
    { label: "Cancelados", value: "CANCELADO" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        filter: "M4 7h16M7 12h10M10 17h4",
        menu: "M4 7h16M4 12h16M4 17h16",
        plus: "M12 5v14M5 12h14",
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
    return (
        <div
            className={`flex min-h-52 flex-col justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/30 bg-app-creme-leve px-6 py-8 text-app-cafe-profundo ${className}`}
        >
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
                {description}
            </p>
        </div>
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
        CANCELADA: "Cancelada",
        RECUSADA: "Recusada",
    };
    return statusMap[status] ?? status;
}

export default function RestaurantReservationsPage() {
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
    const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
    const [cancelandoReserva, setCancelandoReserva] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const isRestaurant = session?.type === "restaurant";

    useEffect(() => {
        if (!isRestaurant) {
            return;
        }

        apiRequest("/reservas")
            .then(setReservas)
            .catch((erro) =>
                setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar as reservas."),
            );
    }, [isRestaurant]);

    async function cancelarReserva(id) {
        setCancelandoReserva(true);
        try {
            const atualizada = await apiRequest(`/reservas/${id}/cancelar`, {
                method: "PATCH",
            });

            setReservas((atuais) =>
                atuais.map((reserva) => (reserva.id_reserva === id ? { ...reserva, ...atualizada } : reserva)),
            );
            setMensagem("Reserva desmarcada.");
            setReservaParaCancelar(null);
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel desmarcar a reserva.");
        }
        finally {
            setCancelandoReserva(false);
        }
    }

    async function excluirReservaDaLista(id) {
        try {
            await apiRequest(`/reservas/${id}/ocultar`, { method: "PATCH" });
            setReservas((atuais) => atuais.filter((reserva) => reserva.id_reserva !== id));
            setMensagem("Reserva removida da lista.");
        } catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel remover a reserva.");
        }
    }

    const reservasFiltradas = useMemo(() => {
        if (filtroPedido === "TODOS") {
            return reservas;
        }
        if (filtroPedido === "COM_PEDIDO") {
            return reservas.filter((reserva) => (reserva.pedidos ?? []).length > 0);
        }
        return reservas.filter((reserva) => (reserva.pedidos ?? []).some((pedido) => pedido.status_pedido === filtroPedido));
    }, [filtroPedido, reservas]);

    if (!isRestaurant) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
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
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
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
                        {navItems.map((item, index) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={index === 5 ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
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
                            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden"
                            aria-label="Abrir menu"
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
                            {navItems.map((item, index) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={index === 5 ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
                                >
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
                        <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
                            Reservas
                        </p>
                        <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
                            Agendamentos do Dia
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
                            Gerencie as experiencias gastronomicas planejadas para hoje.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filtrosPedido.map((filtro) => (
                            <button
                                key={filtro.value}
                                type="button"
                                onClick={() => setFiltroPedido(filtro.value)}
                                className={`inline-flex h-10 items-center justify-center rounded-[8px] border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition ${filtroPedido === filtro.value
                                    ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly"
                                    : "border-app-baunilha-dourada bg-app-creme-leve text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada"}`}
                            >
                                {filtro.label}
                            </button>
                        ))}
                    </div>
                </div>

                <section className="mt-10">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                            Proximos clientes
                        </h2>
                        <p className="text-sm text-app-cinza">
                            {reservasFiltradas.length} de {reservas.length} agendamentos
                        </p>
                    </div>

                    {mensagem ? <p className="mb-4 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

                    {reservasFiltradas.length ? (
                        <div className="grid gap-4">
                            {reservasFiltradas.map((reserva) => (
                                <article
                                    key={reserva.id_reserva}
                                    className="rounded-[12px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70"
                                >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold uppercase text-app-caramelo-torrado">
                                                {reserva.data_reserva} - {reserva.horario_inicio} ate {reserva.horario_fim}
                                            </p>
                                            <h3 className="mt-2 text-lg font-semibold">
                                                {reserva.clientes?.nome ?? "Cliente"}
                                            </h3>
                                            <div className="mt-3 grid gap-2 text-sm text-app-mocha sm:grid-cols-3">
                                                <span>{reserva.quantidade_pessoas} pessoas</span>
                                                <span>Mesa {reserva.mesas?.numero_mesa ?? "-"}</span>
                                                <span>Consumo minimo: {formatarMoeda(reserva.valor_minimo_total)}</span>
                                            </div>
                                            <span className="mt-4 inline-flex rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold uppercase text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/70">
                                                Reserva {obterStatusReserva(reserva.status_reserva)}
                                            </span>

                                            {reserva.pedidos?.length ? (
                                                <div className="mt-5 grid gap-4">
                                                    {reserva.pedidos.map((pedido) => {
                                                        const pedidoCancelado = pedido.status_pedido === "CANCELADO";
                                                        const totalItensPedido = (pedido.itens_pedido ?? []).reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
                                                        const tempoEstimadoPedido = calcularTempoPreparoItens(pedido.itens_pedido ?? []);
                                                        const preparoLiberado = preparoEstaLiberado(pedido.iniciar_preparo_em);
                                                        const inicioPreparo = formatarHorarioPreparo(pedido.iniciar_preparo_em);

                                                        return (
                                                            <div
                                                                key={pedido.id_pedido}
                                                                className={`rounded-[12px] p-4 ring-1 ${pedidoCancelado ? "bg-app-creme-suave ring-app-vermelho-erro/30" : "bg-app-chantilly ring-app-baunilha-dourada/70"}`}
                                                            >
                                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                    <div>
                                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
                                                                            Pedido antecipado #{pedido.id_pedido}
                                                                        </p>
                                                                        <p className="mt-2 text-lg font-semibold text-app-cafe-profundo">
                                                                            {formatarMoeda(pedido.valor_total)}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${pedidoCancelado ? "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-1 ring-app-vermelho-erro/30" : "bg-app-cafe-profundo text-app-creme-leve"}`}>
                                                                        {obterStatusPedido(pedido.status_pedido)}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-4 grid gap-2 text-xs font-semibold text-app-mocha sm:grid-cols-3">
                                                                    <span className="rounded-[8px] bg-app-creme-leve px-3 py-2 ring-1 ring-app-baunilha-dourada/45">
                                                                        {totalItensPedido} itens
                                                                    </span>
                                                                    <span className="rounded-[8px] bg-app-creme-leve px-3 py-2 ring-1 ring-app-baunilha-dourada/45">
                                                                        Preparo estimado: {tempoEstimadoPedido || "--"} min
                                                                    </span>
                                                                    <span className="rounded-[8px] bg-app-creme-leve px-3 py-2 ring-1 ring-app-baunilha-dourada/45">
                                                                        Entrega: {pedido.horario_entrega_previsto ? String(pedido.horario_entrega_previsto).slice(11, 16) : reserva.horario_inicio?.slice(0, 5)}
                                                                    </span>
                                                                </div>
                                                                {pedido.iniciar_preparo_em ? (
                                                                    <p className={`mt-3 rounded-[8px] px-3 py-2 text-xs font-semibold ${preparoLiberado ? "bg-app-dourado-mel text-white" : "bg-app-cafe-profundo text-app-creme-leve"}`}>
                                                                        {preparoLiberado
                                                                            ? "Preparo liberado agora."
                                                                            : `Preparo bloqueado ate ${inicioPreparo}. O pedido deve ser iniciado nesse horario para ficar pronto perto da reserva.`}
                                                                    </p>
                                                                ) : null}

                                                                {pedidoCancelado ? (
                                                                    <p className="mt-4 rounded-[8px] bg-app-chantilly px-3 py-2 text-xs font-semibold text-app-vermelho-erro ring-1 ring-app-vermelho-erro/20">
                                                                        Pedido cancelado pelo cliente. A reserva permanece registrada separadamente.
                                                                    </p>
                                                                ) : null}

                                                                <div className="mt-4 grid gap-3">
                                                                    {pedido.itens_pedido?.map((item, indice) => (
                                                                        <div
                                                                            key={`${item.produtos?.nome ?? "item"}-${indice}`}
                                                                            className="flex items-start justify-between gap-4 rounded-[8px] bg-app-creme-leve px-3 py-2 text-sm text-app-mocha"
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
                                                                    <p className="mt-3 rounded-[8px] bg-app-creme-suave px-3 py-2 text-xs text-app-mocha">
                                                                        Observacao do cliente: {pedido.observacoes}
                                                                    </p>
                                                                ) : null}

                                                                {!pedidoCancelado ? (
                                                                    <Link
                                                                        href="/restaurante/pedidos"
                                                                        className="mt-4 inline-flex rounded-[8px] bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cacau-intenso"
                                                                    >
                                                                        Ver na cozinha
                                                                    </Link>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="mt-5 rounded-[10px] border border-dashed border-app-caramelo-torrado/30 bg-app-chantilly px-4 py-3 text-sm text-app-cinza">
                                                    Esta reserva ainda nao possui pedido antecipado.
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
                                            {["PENDENTE", "CONFIRMADA"].includes(reserva.status_reserva) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setReservaParaCancelar(reserva)}
                                                    className="h-9 rounded-[8px] border border-app-vermelho-erro/40 px-3 text-xs font-bold text-app-vermelho-erro transition hover:bg-app-vermelho-erro hover:text-white"
                                                >
                                                    Desmarcar
                                                </button>
                                            ) : null}

                                            {["CANCELADA", "RECUSADA"].includes(reserva.status_reserva) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => excluirReservaDaLista(reserva.id_reserva)}
                                                    className="h-9 rounded-[8px] border border-app-baunilha-dourada px-3 text-xs font-bold text-app-cinza transition hover:border-app-vermelho-erro/40 hover:text-app-vermelho-erro"
                                                >
                                                    Excluir da lista
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyPanel
                            title="Nenhum agendamento neste filtro"
                            description="Altere o filtro para visualizar outros status de pedidos e reservas."
                            className="min-h-[310px] bg-app-chantilly"
                        />
                    )}
                </section>
            </section>

            {reservaParaCancelar ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5 backdrop-blur-sm">
                    <section className="w-full max-w-md rounded-[16px] bg-app-creme-leve p-6 text-app-cafe-profundo shadow-xl ring-1 ring-app-baunilha-dourada/70">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                            Cancelamento de reserva
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold">
                            Deseja desmarcar esta reserva?
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-app-mocha">
                            Ao confirmar, esta reserva sera marcada como cancelada para o cliente e sairá do fluxo ativo de atendimento.
                        </p>
                        {reservaParaCancelar.pedidos?.some((pedido) => ["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido)) ? (
                            <p className="mt-3 rounded-[10px] bg-app-chantilly p-3 text-sm font-semibold leading-6 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">
                                Existe pedido antecipado vinculado. Se ele ainda nao entrou em preparo, o sistema tambem marcara o pedido como cancelado.
                            </p>
                        ) : null}
                        <div className="mt-6 rounded-[10px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/60">
                            <p className="text-sm font-semibold">
                                {reservaParaCancelar.clientes?.nome ?? "Cliente"}
                            </p>
                            <p className="mt-1 text-xs text-app-cinza">
                                {reservaParaCancelar.data_reserva} - {reservaParaCancelar.horario_inicio} ate {reservaParaCancelar.horario_fim} - {reservaParaCancelar.quantidade_pessoas} pessoas
                            </p>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setReservaParaCancelar(null)}
                                disabled={cancelandoReserva}
                                className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza"
                            >
                                Manter reserva
                            </button>
                            <button
                                type="button"
                                onClick={() => cancelarReserva(reservaParaCancelar.id_reserva)}
                                disabled={cancelandoReserva}
                                className="h-11 rounded-[8px] bg-app-vermelho-erro px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:cursor-not-allowed disabled:bg-app-cinza/50"
                            >
                                {cancelandoReserva ? "Cancelando..." : "Confirmar cancelamento"}
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}

            <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
                    <Image
                        src="/brand/appono-mark.svg"
                        alt="Appono"
                        width={80}
                        height={80}
                        className="h-14 w-14 brightness-0 invert"
                    />
                    <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
                        <Link href="#" className="transition hover:text-app-chantilly">
                            Politica de Privacidade
                        </Link>
                        <Link href="#" className="transition hover:text-app-chantilly">
                            Termos de Uso
                        </Link>
                        <Link href="#" className="transition hover:text-app-chantilly">
                            Contato
                        </Link>
                    </nav>
                    <p className="text-xs font-semibold text-app-creme-suave">
                        &copy; 2026 APPONO. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </main>
    );
}
