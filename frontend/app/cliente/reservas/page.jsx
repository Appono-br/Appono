"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { reservaAceitaPagamento } from "@/lib/elegibilidade-pagamento";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
const navItems = [
    { label: "Início", href: "/cliente/dashboard" },
    { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
    { label: "Reservas", href: "/cliente/reservas" },
    { label: "Mensagens", href: "/cliente/mensagens" },
    { label: "Configurações", href: "/cliente/configuracoes" },
];
const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        "chevron-left": "m15 18-6-6 6-6",
        "chevron-right": "m9 18 6-6-6-6",
        clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        people: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9",
        menu: "M4 7h16M4 12h16M4 17h16",
        plus: "M12 5v14M5 12h14",
        wallet: "M4 7h16v12H4V7z M4 7l12-3v3M15 12h5",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function formatarDataReserva(data) {
    const dataLocal = new Date(`${data}T12:00:00`);
    return {
        dia: String(dataLocal.getDate()).padStart(2, "0"),
        mes: dataLocal.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        semana: dataLocal.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    };
}
function formatarHorario(horario) {
    return horario.slice(0, 5);
}
function obterStatusReserva(status) {
    if (status === "PENDENTE") {
        return { texto: "Pendente", classe: "bg-app-cafe-profundo text-app-creme-leve" };
    }
    if (status === "CONFIRMADA") {
        return { texto: "Confirmada", classe: "bg-app-baunilha-dourada text-app-cafe-profundo" };
    }
    if (status === "CHECK_IN") {
        return { texto: "Check-in realizado", classe: "bg-app-cafe-profundo text-app-creme-leve" };
    }
    if (status === "CONCLUIDA") {
        return { texto: "Atendimento finalizado", classe: "bg-white text-app-mocha" };
    }
    if (status === "CANCELADA") {
        return { texto: "Cancelada", classe: "bg-app-vermelho-erro/10 text-app-vermelho-erro" };
    }
    if (status === "NAO_COMPARECEU") {
        return { texto: "Não compareceu", classe: "bg-app-vermelho-erro/10 text-app-vermelho-erro" };
    }
    return { texto: status.toLowerCase(), classe: "bg-white text-app-mocha" };
}
function obterStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Aguardando pagamento",
        CONFIRMADO: "Pedido confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto para retirada",
        ENTREGUE: "Entregue",
        CANCELADO: "Pedido cancelado",
    };
    return statusMap[status] ?? status;
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
function reservaJaIniciou(reservation) {
    return new Date(`${reservation.date}T${reservation.time}`) <= new Date();
}
function podeExcluirReservaDaLista(reservation) {
    return reservaJaIniciou(reservation) ||
        ["CANCELADA", "RECUSADA", "CONCLUIDA", "NAO_COMPARECEU"].includes(reservation.status);
}
function obterPrazoConfirmacaoPresenca(reservation) {
    return new Date(new Date(`${reservation.date}T${reservation.time}`).getTime() - 60 * 60 * 1000);
}
function podeResponderPresenca(reservation) {
    return reservation.status === "CONFIRMADA" &&
        reservation.attendanceStatus !== "RECUSADA" &&
        new Date() <= obterPrazoConfirmacaoPresenca(reservation);
}
function formatarPrazoPresenca(reservation) {
    const prazo = reservation.attendanceDeadline
        ? new Date(reservation.attendanceDeadline)
        : obterPrazoConfirmacaoPresenca(reservation);
    return prazo.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}
function obterTextoConfirmacaoPresenca(status) {
    const statusMap = {
        PENDENTE: "Aguardando confirmação",
        CONFIRMADA: "Presença confirmada",
        RECUSADA: "Ausência avisada",
        EXPIRADA: "Prazo encerrado",
    };
    return statusMap[status] ?? "Aguardando confirmação";
}
function obterDescricaoFluxoReserva(reservation) {
    if (reservation.attendanceStatus === "CONFIRMADA" && reservation.status === "CONFIRMADA") {
        return "Presença confirmada. O restaurante pode organizar sua experiência com mais segurança.";
    }
    if (reservation.attendanceStatus === "RECUSADA") {
        return "Você informou que não irá comparecer. A reserva e pedidos vinculados foram cancelados.";
    }
    if (reservation.status === "CHECK_IN") {
        return "Check-in registrado pelo restaurante. Sua experiência está em atendimento.";
    }
    if (reservation.status === "CONCLUIDA") {
        return "Atendimento finalizado. Esta reserva permanece disponível no histórico.";
    }
    if (reservation.status === "NAO_COMPARECEU") {
        return "O horário da reserva terminou sem check-in. A reserva e pedidos pendentes foram encerrados.";
    }
    if (reservaJaIniciou(reservation)) {
        return "Esta reserva já passou do horário de início. O pedido antecipado não pode mais ser adicionado.";
    }
    if (reservation.activeOrder?.status === "PENDENTE") {
        return "Reserva confirmada. O pedido antecipado ainda aguarda pagamento para ser enviado a cozinha.";
    }
    if (reservation.activeOrder) {
        return "Reserva com pedido antecipado vinculado. Acompanhe o status do preparo pelos detalhes do pedido.";
    }
    if (reservation.status === "CONFIRMADA") {
        return podeResponderPresenca(reservation)
            ? `Confirme sua presença até ${formatarPrazoPresenca(reservation)} para manter o restaurante alinhado.`
            : "Reserva confirmada. O prazo de confirmação de presença encerra 1 hora antes do horário.";
    }
    return "Acompanhe aqui o status da sua reserva.";
}
function getCalendarDays(month, year) {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const leadingDays = firstDay.getDay();
    const days = [];
    for (let index = leadingDays - 1; index >= 0; index -= 1) {
        const day = previousMonthDays - index;
        const date = new Date(year, month - 1, day);
        days.push({
            day,
            currentMonth: false,
            date: date.toISOString().slice(0, 10),
        });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        days.push({
            day,
            currentMonth: true,
            date: date.toISOString().slice(0, 10),
        });
    }
    while (days.length % 7 !== 0) {
        const day = days.length - leadingDays - daysInMonth + 1;
        const date = new Date(year, month + 1, day);
        days.push({
            day,
            currentMonth: false,
            date: date.toISOString().slice(0, 10),
        });
    }
    return days;
}
function EmptyReservationPanel() {
    return (<section className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="plus" className="h-6 w-6"/>
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-app-cafe-profundo">
        Planeje sua próxima visita
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-app-cinza sm:text-base">
        Você ainda não possui reservas em aberto neste período.
      </p>
      <Link href="/cliente/dashboard" className="mt-8 rounded-[8px] bg-app-dourado-mel px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado">
        Reservar agora
      </Link>
    </section>);
}
export default function ReservationsPage() {
    const today = new Date();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
    const [reservaParaConfirmarPresenca, setReservaParaConfirmarPresenca] = useState(null);
    const [reservaParaRecusarPresenca, setReservaParaRecusarPresenca] = useState(null);
    const [reservaParaExcluir, setReservaParaExcluir] = useState(null);
    const [cancelandoReserva, setCancelandoReserva] = useState(false);
    const [processandoPresenca, setProcessandoPresenca] = useState(false);
    const [mensagemPresenca, setMensagemPresenca] = useState("");
    const [period, setPeriod] = useState({
        month: today.getMonth(),
        year: today.getFullYear(),
    });
    const calendarDays = useMemo(() => getCalendarDays(period.month, period.year), [period.month, period.year]);
    const reservationDates = useMemo(() => new Set(reservations
        .filter((reservation) => ["CONFIRMADA", "CHECK_IN"].includes(reservation.status))
        .map((reservation) => reservation.date)), [reservations]);
    const reservasConfirmadas = useMemo(() => reservations.filter((reservation) => ["CONFIRMADA", "CHECK_IN"].includes(reservation.status)), [reservations]);
    useEffect(() => {
        async function loadReservations() {
            try {
                const data = await apiRequest("/reservas");
                setReservations(data.map((reservation) => {
                    const activeOrder = reservation.pedidos?.find((order) => ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(order.status_pedido));
                    const canceledOrder = reservation.pedidos?.find((order) => order.status_pedido === "CANCELADO");
                    return {
                        id: String(reservation.id_reserva),
                        restaurantId: reservation.id_restaurante,
                        date: reservation.data_reserva,
                        time: reservation.horario_inicio,
                        status: reservation.status_reserva,
                        attendanceStatus: reservation.status_confirmacao_presenca ?? "PENDENTE",
                        attendanceConfirmedAt: reservation.confirmacao_presenca_em,
                        attendanceDeadline: reservation.prazo_confirmacao_presenca,
                        attendanceRefundValue: Number(reservation.valor_reembolso_ausencia ?? 0),
                        attendanceRetainedValue: Number(reservation.valor_retido_ausencia ?? 0),
                        attendanceCommissionPercent: Number(reservation.percentual_comissao_ausencia ?? 13),
                        restaurant: reservation.restaurantes?.nome ?? "Restaurante",
                        people: reservation.quantidade_pessoas,
                        minimumTotal: reservation.valor_minimo_total,
                        activeOrder: activeOrder
                            ? {
                                id: activeOrder.id_pedido,
                                status: activeOrder.status_pedido,
                                total: Number(activeOrder.valor_total),
                                itens: activeOrder.itens_pedido ?? [],
                            }
                            : undefined,
                        canceledOrder: canceledOrder
                            ? {
                                id: canceledOrder.id_pedido,
                                total: Number(canceledOrder.valor_total),
                            }
                            : undefined,
                    };
                }));
            }
            catch {
                setReservations([]);
            }
        }
        loadReservations();
    }, []);
    function changeMonth(direction) {
        setPeriod((current) => {
            const date = new Date(current.year, current.month + direction, 1);
            return { month: date.getMonth(), year: date.getFullYear() };
        });
    }
    async function cancelarReserva(id) {
        setCancelandoReserva(true);
        try {
            const atualizada = await apiRequest(`/reservas/${id}/cancelar`, { method: "PATCH" });
            setReservations((atuais) => atuais.map((reserva) => reserva.id === id ? { ...reserva, status: atualizada.status_reserva } : reserva));
            setReservaParaCancelar(null);
        }
        catch {
            return;
        }
        finally {
            setCancelandoReserva(false);
        }
    }
    async function excluirReservaDaLista(id) {
        try {
            await apiRequest(`/reservas/${id}/ocultar`, { method: "PATCH" });
            setReservations((atuais) => atuais.filter((reserva) => reserva.id !== id));
        }
        catch {
            return;
        }
    }
    function aplicarReservaAtualizada(reservaAtualizada) {
        setReservations((atuais) => atuais.map((reserva) => reserva.id === String(reservaAtualizada.id_reserva)
            ? {
                ...reserva,
                status: reservaAtualizada.status_reserva,
                attendanceStatus: reservaAtualizada.status_confirmacao_presenca ?? reserva.attendanceStatus,
                attendanceConfirmedAt: reservaAtualizada.confirmacao_presenca_em,
                attendanceDeadline: reservaAtualizada.prazo_confirmacao_presenca,
                attendanceRefundValue: Number(reservaAtualizada.valor_reembolso_ausencia ?? 0),
                attendanceRetainedValue: Number(reservaAtualizada.valor_retido_ausencia ?? reserva.attendanceRetainedValue ?? 0),
                attendanceCommissionPercent: Number(reservaAtualizada.percentual_comissao_ausencia ?? reserva.attendanceCommissionPercent ?? 13),
                activeOrder: reservaAtualizada.status_reserva === "CANCELADA" ? undefined : reserva.activeOrder,
                canceledOrder: reservaAtualizada.status_reserva === "CANCELADA" && reserva.activeOrder
                    ? { id: reserva.activeOrder.id, total: reserva.activeOrder.total }
                    : reserva.canceledOrder,
            }
            : reserva));
    }
    async function confirmarPresenca(id) {
        setProcessandoPresenca(true);
        setMensagemPresenca("");
        try {
            const resposta = await apiRequest(`/reservas/${id}/presenca`, {
                method: "PATCH",
                body: JSON.stringify({ acao: "CONFIRMAR" }),
            });
            aplicarReservaAtualizada(resposta.reserva);
            setReservaParaConfirmarPresenca(null);
            setMensagemPresenca("Presença confirmada com sucesso.");
        }
        catch (error) {
            setMensagemPresenca(error instanceof Error ? error.message : "Não foi possível confirmar presença.");
        }
        finally {
            setProcessandoPresenca(false);
        }
    }
    async function recusarPresenca() {
        if (!reservaParaRecusarPresenca) return;
        setProcessandoPresenca(true);
        setMensagemPresenca("");
        try {
            const resposta = await apiRequest(`/reservas/${reservaParaRecusarPresenca.id}/presenca`, {
                method: "PATCH",
                body: JSON.stringify({ acao: "NAO_COMPARECEREI" }),
            });
            aplicarReservaAtualizada(resposta.reserva);
            setReservaParaRecusarPresenca(null);
            const valor = Number(resposta.reembolso?.valor ?? 0);
            setMensagemPresenca(valor > 0
                ? `Reserva cancelada. Reembolso parcial registrado: ${formatarMoeda(valor)}.`
                : "Reserva cancelada.");
        }
        catch (error) {
            setMensagemPresenca(error instanceof Error ? error.message : "Não foi possível cancelar a presença.");
        }
        finally {
            setProcessandoPresenca(false);
        }
    }
    async function confirmarExclusaoReserva() {
        if (!reservaParaExcluir) return;
        setCancelandoReserva(true);
        try {
            await excluirReservaDaLista(reservaParaExcluir.id);
            setReservaParaExcluir(null);
        } finally {
            setCancelandoReserva(false);
        }
    }
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 2
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
              <Icon type="bag"/>
            </button>
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white lg:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="reservations-mobile-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="reservations-mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 2
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Reservas
            </p>
            <h1 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
              Meus Agendamentos
            </h1>
            <p className="mt-3 text-sm leading-6 text-app-mocha sm:text-base">
              Gerencie suas próximas experiências gastronômicas.
            </p>
          </div>

          <div className="flex w-fit items-center gap-5 rounded-[8px] bg-white px-5 py-4 text-app-cafe-profundo shadow-sm ring-1 ring-app-baunilha-dourada/60">
            <button type="button" onClick={() => changeMonth(-1)} className="transition hover:text-app-caramelo-torrado" aria-label="Período anterior">
              <Icon type="chevron-left"/>
            </button>
            <div className="min-w-36 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-cinza">
                Período
              </p>
              <p className="mt-1 text-xl">
                {monthNames[period.month]} {period.year}
              </p>
            </div>
            <button type="button" onClick={() => changeMonth(1)} className="transition hover:text-app-caramelo-torrado" aria-label="Próximo período">
              <Icon type="chevron-right"/>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.78fr_1.62fr]">
          <aside className="h-fit rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-10">
            <h2 className="text-2xl font-medium text-app-cafe-profundo">
              Calendário do Mês
            </h2>
            <div className="mt-8 grid grid-cols-7 gap-2 text-center text-sm text-app-cinza">
              {weekDays.map((day, index) => (<span key={`${day}-${index}`} className="font-medium">
                  {day}
                </span>))}
              {calendarDays.map((day) => {
            const hasReservation = reservationDates.has(day.date);
            return (<span key={day.date} className={`flex h-10 items-center justify-center rounded-[8px] text-sm ${hasReservation
                    ? "bg-app-baunilha-dourada font-bold text-app-caramelo-torrado"
                    : day.currentMonth
                        ? "text-app-cafe-profundo"
                        : "text-app-cinza/40"}`}>
                    {day.day}
                  </span>);
        })}
            </div>

            <p className="mt-8 text-base leading-7 text-app-mocha">
              Você possui{" "}
              <span className="font-bold text-app-caramelo-torrado">
                {reservasConfirmadas.length}
              </span>{" "}
              reservas confirmadas neste periodo.
            </p>
          </aside>

          <section className="grid content-start gap-6 self-start">
            {mensagemPresenca ? (
              <p className="rounded-[10px] bg-white px-4 py-3 text-sm font-semibold text-app-cafe-profundo ring-1 ring-app-baunilha-dourada">
                {mensagemPresenca}
              </p>
            ) : null}
                {reservations.length ? (<div className="grid auto-rows-max content-start gap-4">
                {reservations.map((reservation) => (<article key={reservation.id} className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/70 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="grid lg:grid-cols-[86px_minmax(0,1fr)]">
                      <div className="flex items-center gap-4 border-b border-app-baunilha-dourada/60 bg-white px-5 py-4 lg:flex-col lg:justify-center lg:border-b-0 lg:border-r lg:px-4 lg:text-center">
                        <span className="text-3xl font-semibold leading-none text-app-cafe-profundo">
                          {formatarDataReserva(reservation.date).dia}
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase text-app-caramelo-torrado">
                            {formatarDataReserva(reservation.date).mes}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-app-cinza">
                            {formatarDataReserva(reservation.date).semana}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 bg-white p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-semibold text-app-cafe-profundo">
                              {reservation.restaurant}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-app-cinza">
                              {obterDescricaoFluxoReserva(reservation)}
                            </p>
                          </div>
                          <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${obterStatusReserva(reservation.status).classe}`}>
                            {obterStatusReserva(reservation.status).texto}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-app-mocha">
                          <span className="flex items-center gap-2">
                            <Icon type="clock" className="h-4 w-4 text-app-caramelo-torrado"/>
                            {formatarHorario(reservation.time)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Icon type="people" className="h-4 w-4 text-app-caramelo-torrado"/>
                            {reservation.people} {reservation.people === 1 ? "pessoa" : "pessoas"}
                          </span>
                          <span className="flex items-center gap-2">
                            <Icon type="wallet" className="h-4 w-4 text-app-caramelo-torrado"/>
                            Consumo mínimo{" "}
                            {formatarMoeda(reservation.minimumTotal)}
                          </span>
                        </div>
                        {["CONFIRMADA", "CANCELADA"].includes(reservation.status) ? (<div className="mt-5 rounded-[12px] border border-app-baunilha-dourada/60 bg-white px-4 py-3 text-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
                                  Confirmação de presença
                                </p>
                                <p className="mt-1 text-app-mocha">
                                  {reservation.attendanceStatus === "RECUSADA"
                                      ? "Você avisou que não irá comparecer. Restaurante e Appono foram notificados."
                                      : `Prazo: até ${formatarPrazoPresenca(reservation)}`}
                                </p>
                              </div>
                              <span className="w-fit rounded-full bg-app-cafe-profundo px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-app-creme-leve">
                                {obterTextoConfirmacaoPresenca(reservation.attendanceStatus)}
                              </span>
                            </div>
                            {reservation.attendanceStatus === "RECUSADA" ? (
                              <div className="mt-4 grid gap-3 border-t border-app-baunilha-dourada/60 pt-4 text-xs sm:grid-cols-2">
                                <p className="rounded-[8px] bg-white px-3 py-2 ring-1 ring-app-baunilha-dourada/60">
                                  <span className="block font-bold uppercase tracking-[0.12em] text-app-cinza">Retido</span>
                                  <strong className="mt-1 block text-base text-app-cafe-profundo">{formatarMoeda(reservation.attendanceRetainedValue)}</strong>
                                </p>
                                <p className="rounded-[8px] bg-white px-3 py-2 ring-1 ring-app-baunilha-dourada/60">
                                  <span className="block font-bold uppercase tracking-[0.12em] text-app-cinza">Reembolso</span>
                                  <strong className="mt-1 block text-base text-app-cafe-profundo">{formatarMoeda(reservation.attendanceRefundValue)}</strong>
                                </p>
                              </div>
                            ) : null}
                          </div>) : null}
                        {reservation.activeOrder ? (<div className="mt-4 rounded-[12px] border border-app-caramelo-torrado/25 bg-white px-4 py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
                                Pedido antecipado
                              </p>
                              <span className="w-fit rounded-full bg-app-cafe-profundo px-3 py-1 text-[11px] font-bold text-app-creme-leve">
                                {obterStatusPedido(reservation.activeOrder.status)}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-app-mocha">
                              {reservation.activeOrder.itens.slice(0, 3).map((item, indice) => (<p key={`${item.produtos?.nome ?? "item"}-${indice}`} className="flex items-center justify-between gap-3">
                                  <span className="truncate">
                                    {item.quantidade}x {item.produtos?.nome ?? "Item do cardápio"}
                                  </span>
                                  <strong className="shrink-0 text-app-cafe-profundo">
                                    {formatarMoeda(calcularSubtotalItem(item))}
                                  </strong>
                                </p>))}
                              {reservation.activeOrder.itens.length > 3 ? (<p className="text-xs font-semibold text-app-caramelo-torrado">
                                  + {reservation.activeOrder.itens.length - 3} itens no pedido
                                </p>) : null}
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-app-baunilha-dourada/60 pt-3 text-sm">
                              <span className="font-semibold text-app-mocha">Total do pedido</span>
                              <strong className="text-app-cafe-profundo">
                                {formatarMoeda(reservation.activeOrder.total)}
                              </strong>
                            </div>
                          </div>) : null}
                        {!reservation.activeOrder && reservation.canceledOrder ? (<div className="mt-5 rounded-[10px] border border-app-caramelo-torrado/25 bg-white px-4 py-3">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
                              Pedido cancelado
                            </p>
                            <p className="mt-2 text-sm leading-6 text-app-mocha">
                              O pedido antecipado foi cancelado, mas sua reserva continua {obterStatusReserva(reservation.status).texto.toLowerCase()}.
                            </p>
                            <p className="mt-2 text-xs font-semibold text-app-cinza">
                              Pedido #{reservation.canceledOrder.id} - {formatarMoeda(reservation.canceledOrder.total)}
                            </p>
                          </div>) : null}
                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-app-baunilha-dourada/60 pt-4">
                          {podeResponderPresenca(reservation) ? (<>
                            {reservation.attendanceStatus !== "CONFIRMADA" ? (<button type="button" disabled={processandoPresenca} onClick={() => setReservaParaConfirmarPresenca(reservation)} className="rounded-[8px] bg-app-cafe-profundo px-4 py-2 text-xs font-bold text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                                Confirmar presença
                              </button>) : null}
                            <button type="button" disabled={processandoPresenca} onClick={() => setReservaParaRecusarPresenca(reservation)} className="rounded-[8px] border border-app-vermelho-erro/40 px-4 py-2 text-xs font-bold text-app-vermelho-erro transition hover:bg-app-vermelho-erro hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                              {reservation.attendanceStatus === "CONFIRMADA" ? "Alterar para ausência" : "Não vou comparecer"}
                            </button>
                          </>) : null}
                        {["PENDENTE", "CONFIRMADA"].includes(reservation.status) && !reservaJaIniciou(reservation) ? (<button type="button" onClick={() => setReservaParaCancelar(reservation)} className="text-xs font-bold text-app-vermelho-erro transition hover:text-app-cafe-profundo">
                            Desmarcar reserva
                          </button>) : null}
                        {reservation.activeOrder?.status === "PENDENTE" && reservaAceitaPagamento(reservation) ? (<Link href={`/cliente/pagamentos/pedido/${reservation.activeOrder.id}`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">
                            Pagar pedido
                          </Link>) : null}
                        {reservation.status === "CONFIRMADA" && reservation.activeOrder && reservation.activeOrder.status !== "PENDENTE" ? (<Link href={`/cliente/pedidos/${reservation.activeOrder.id}`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">
                            Acompanhar pedido
                          </Link>) : null}
                        {reservation.status === "CONFIRMADA" && !reservation.activeOrder && !reservaJaIniciou(reservation) ? (<Link href={`/cliente/reservas/${reservation.id}/pedido`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">
                            Adicionar pedido antecipado
                          </Link>) : null}
                        {podeExcluirReservaDaLista(reservation) ? (<button type="button" onClick={() => setReservaParaExcluir(reservation)} className="text-xs font-bold text-app-cinza transition hover:text-app-vermelho-erro">
                            Excluir da lista
                          </button>) : null}
                        </div>
                      </div>
                    </div>
                  </article>))}
              </div>) : (<EmptyReservationPanel />)}
          </section>
        </div>
      </section>

      <ConfirmationDialog
        open={Boolean(reservaParaConfirmarPresenca)}
        eyebrow="Confirmação de presença"
        title="Confirmar sua presença?"
        description="O restaurante será avisado que você pretende comparecer e poderá organizar a reserva e o pedido vinculado."
        confirmLabel="Confirmar presença"
        cancelLabel="Voltar"
        variant="default"
        loading={processandoPresenca}
        onCancel={() => setReservaParaConfirmarPresenca(null)}
        onConfirm={() => confirmarPresenca(reservaParaConfirmarPresenca.id)}
        details={reservaParaConfirmarPresenca ? (
          <div>
            <p className="font-semibold">{reservaParaConfirmarPresenca.restaurant}</p>
            <p className="mt-1 text-xs text-app-cinza">
              {formatarDataReserva(reservaParaConfirmarPresenca.date).dia} {formatarDataReserva(reservaParaConfirmarPresenca.date).mes} - {formatarHorario(reservaParaConfirmarPresenca.time)} - {reservaParaConfirmarPresenca.people} {reservaParaConfirmarPresenca.people === 1 ? "pessoa" : "pessoas"}
            </p>
          </div>
        ) : null}
      />

      <ConfirmationDialog
        open={Boolean(reservaParaExcluir)}
        eyebrow="Excluir da lista"
        title="Remover esta reserva do histórico?"
        description="A reserva será ocultada apenas da sua lista. Os registros operacionais e financeiros continuam preservados para auditoria."
        confirmLabel="Excluir"
        cancelLabel="Manter"
        loading={cancelandoReserva}
        onCancel={() => setReservaParaExcluir(null)}
        onConfirm={confirmarExclusaoReserva}
        details={reservaParaExcluir ? (
          <div>
            <p className="font-semibold">{reservaParaExcluir.restaurant}</p>
            <p className="mt-1 text-xs text-app-cinza">
              {formatarDataReserva(reservaParaExcluir.date).dia} {formatarDataReserva(reservaParaExcluir.date).mes} - {formatarHorario(reservaParaExcluir.time)}
            </p>
          </div>
        ) : null}
      />

      {reservaParaCancelar ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]">
          <section className="w-full max-w-md rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
              Cancelamento de reserva
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Deseja desmarcar esta reserva?
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Ao confirmar, a mesa e o horário reservados serão cancelados. O restaurante passará a ver esta reserva como cancelada.
            </p>
            {reservaParaCancelar.activeOrder ? (<p className="mt-3 rounded-[10px] bg-white p-3 text-sm font-semibold leading-6 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">
                Esta reserva possui pedido antecipado ativo. Se o preparo ainda não tiver iniciado, o pedido também será cancelado pelo sistema.
              </p>) : null}
            <div className="mt-6 rounded-[10px] bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
              <p className="text-sm font-semibold">{reservaParaCancelar.restaurant}</p>
              <p className="mt-1 text-xs text-app-cinza">
                {formatarDataReserva(reservaParaCancelar.date).dia} {formatarDataReserva(reservaParaCancelar.date).mes} - {formatarHorario(reservaParaCancelar.time)} - {reservaParaCancelar.people} {reservaParaCancelar.people === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setReservaParaCancelar(null)} disabled={cancelandoReserva} className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza">
                Manter reserva
              </button>
              <button type="button" onClick={() => cancelarReserva(reservaParaCancelar.id)} disabled={cancelandoReserva} className="botao-acao-critica h-11 rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:bg-app-cinza/50">
                {cancelandoReserva ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </section>
        </div>) : null}

      {reservaParaRecusarPresenca ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-5 backdrop-blur-[2px]">
          <section className="w-full max-w-lg rounded-[18px] bg-white p-6 text-app-cafe-profundo shadow-2xl ring-1 ring-black/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
              Confirmar ausência
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Você não irá comparecer?
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Ao confirmar, sua reserva será cancelada, o pedido antecipado vinculado também será cancelado e o restaurante será avisado para não preparar a comanda.
            </p>
            {reservaParaRecusarPresenca.activeOrder ? (<p className="mt-3 rounded-[10px] bg-white p-3 text-sm font-semibold leading-6 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">
                Como existe pedido pago ou vinculado, o reembolso será calculado pelo excedente: valor pago menos consumo mínimo da reserva e comissão Appono de {reservaParaRecusarPresenca.attendanceCommissionPercent}%.
              </p>) : null}
            {reservaParaRecusarPresenca.activeOrder ? (
              <div className="mt-4 grid gap-3 rounded-[10px] bg-white p-4 text-sm ring-1 ring-app-baunilha-dourada/60 sm:grid-cols-3">
                <p>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-app-cinza">Pedido</span>
                  <strong className="mt-1 block text-app-cafe-profundo">{formatarMoeda(reservaParaRecusarPresenca.activeOrder.total)}</strong>
                </p>
                <p>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-app-cinza">Mínimo</span>
                  <strong className="mt-1 block text-app-cafe-profundo">{formatarMoeda(reservaParaRecusarPresenca.minimumTotal)}</strong>
                </p>
                <p>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-app-cinza">Taxa</span>
                  <strong className="mt-1 block text-app-cafe-profundo">{reservaParaRecusarPresenca.attendanceCommissionPercent}%</strong>
                </p>
              </div>
            ) : null}
            <div className="mt-6 rounded-[10px] bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
              <p className="text-sm font-semibold">{reservaParaRecusarPresenca.restaurant}</p>
              <p className="mt-1 text-xs text-app-cinza">
                {formatarDataReserva(reservaParaRecusarPresenca.date).dia} {formatarDataReserva(reservaParaRecusarPresenca.date).mes} - {formatarHorario(reservaParaRecusarPresenca.time)} - {reservaParaRecusarPresenca.people} {reservaParaRecusarPresenca.people === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setReservaParaRecusarPresenca(null)} disabled={processandoPresenca} className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza">
                Voltar
              </button>
              <button type="button" onClick={recusarPresenca} disabled={processandoPresenca} className="botao-acao-critica h-11 rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:bg-app-cinza/50">
                {processandoPresenca ? "Processando..." : "Confirmar ausência"}
              </button>
            </div>
          </section>
        </div>) : null}

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Política de Privacidade
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
    </main>);
}
