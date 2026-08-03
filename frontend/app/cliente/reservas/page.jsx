"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
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
    if (status === "CANCELADA") {
        return { texto: "Cancelada", classe: "bg-app-vermelho-erro/10 text-app-vermelho-erro" };
    }
    return { texto: status.toLowerCase(), classe: "bg-app-creme-suave text-app-mocha" };
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
function obterDescricaoFluxoReserva(reservation) {
    if (reservaJaIniciou(reservation)) {
        return "Esta reserva ja passou do horario de inicio. O pedido antecipado nao pode mais ser adicionado.";
    }
    if (reservation.activeOrder?.status === "PENDENTE") {
        return "Reserva confirmada. O pedido antecipado ainda aguarda pagamento para ser enviado a cozinha.";
    }
    if (reservation.activeOrder) {
        return "Reserva com pedido antecipado vinculado. Acompanhe o status do preparo pelos detalhes do pedido.";
    }
    if (reservation.status === "CONFIRMADA") {
        return "Reserva simples confirmada. Voce ainda pode adicionar um pedido antecipado para reduzir sua espera.";
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
    return (<section className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="plus" className="h-6 w-6"/>
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-app-cafe-profundo">
        Planeje sua proxima visita
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-app-cinza sm:text-base">
        Voce ainda nao possui reservas em aberto neste periodo.
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
    const [cancelandoReserva, setCancelandoReserva] = useState(false);
    const [period, setPeriod] = useState({
        month: today.getMonth(),
        year: today.getFullYear(),
    });
    const calendarDays = useMemo(() => getCalendarDays(period.month, period.year), [period.month, period.year]);
    const reservationDates = useMemo(() => new Set(reservations
        .filter((reservation) => reservation.status === "CONFIRMADA")
        .map((reservation) => reservation.date)), [reservations]);
    const reservasConfirmadas = useMemo(() => reservations.filter((reservation) => reservation.status === "CONFIRMADA"), [reservations]);
    useEffect(() => {
        async function loadReservations() {
            try {
                const data = await apiRequest("/reservas");
                setReservations(data.map((reservation) => {
                    const activeOrder = reservation.pedidos?.find((order) => ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(order.status_pedido));
                    const canceledOrder = reservation.pedidos?.find((order) => order.status_pedido === "CANCELADO");
                    return {
                        id: String(reservation.id_reserva),
                        date: reservation.data_reserva,
                        time: reservation.horario_inicio,
                        status: reservation.status_reserva,
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
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
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
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="reservations-mobile-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="reservations-mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden">
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

          <div className="flex w-fit items-center gap-5 rounded-[8px] bg-app-creme-leve px-5 py-4 text-app-cafe-profundo shadow-sm ring-1 ring-app-baunilha-dourada/60">
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
          <aside className="h-fit rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-10">
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
              Voce possui{" "}
              <span className="font-bold text-app-caramelo-torrado">
                {reservasConfirmadas.length}
              </span>{" "}
              reservas confirmadas neste periodo.
            </p>
          </aside>

          <section className="grid content-start gap-6 self-start">
            {reservations.length ? (<div className="grid auto-rows-max content-start gap-4">
                {reservations.map((reservation) => (<article key={reservation.id} className="overflow-hidden rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/70 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="grid sm:grid-cols-[112px_1fr_auto]">
                      <div className="flex items-center gap-4 border-b border-app-baunilha-dourada/60 bg-app-creme-suave px-5 py-4 sm:flex-col sm:justify-center sm:border-b-0 sm:border-r sm:px-4 sm:text-center">
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

                      <div className="min-w-0 bg-app-creme-leve p-5">
                        <h2 className="truncate text-xl font-semibold text-app-cafe-profundo">
                          {reservation.restaurant}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-app-cinza">
                          {obterDescricaoFluxoReserva(reservation)}
                        </p>
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
                            Consumo minimo{" "}
                            {formatarMoeda(reservation.minimumTotal)}
                          </span>
                        </div>
                        {reservation.activeOrder ? (<div className="mt-5 rounded-[10px] border border-app-caramelo-torrado/25 bg-app-creme-suave px-4 py-3">
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
                                    {item.quantidade}x {item.produtos?.nome ?? "Item do cardapio"}
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
                        {!reservation.activeOrder && reservation.canceledOrder ? (<div className="mt-5 rounded-[10px] border border-app-caramelo-torrado/25 bg-app-chantilly px-4 py-3">
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
                      </div>

                      <div className="flex flex-col items-center justify-center gap-4 border-t border-app-baunilha-dourada/60 bg-app-creme-suave/55 p-5 text-center sm:min-w-40 sm:border-l sm:border-t-0">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${obterStatusReserva(reservation.status).classe}`}>
                          {obterStatusReserva(reservation.status).texto}
                        </span>
                        {["PENDENTE", "CONFIRMADA"].includes(reservation.status) ? (<button type="button" onClick={() => setReservaParaCancelar(reservation)} className="text-xs font-bold text-app-vermelho-erro transition hover:text-app-cafe-profundo">
                            Desmarcar reserva
                          </button>) : null}
                        {reservation.status === "CONFIRMADA" && reservation.activeOrder?.status === "PENDENTE" ? (<Link href={`/cliente/pagamentos/pedido/${reservation.activeOrder.id}`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">
                            Pagar pedido
                          </Link>) : null}
                        {reservation.status === "CONFIRMADA" && reservation.activeOrder && reservation.activeOrder.status !== "PENDENTE" ? (<Link href="/cliente/detalhes-pedido" className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">
                            Acompanhar pedido
                          </Link>) : null}
                        {reservation.status === "CONFIRMADA" && !reservation.activeOrder && !reservaJaIniciou(reservation) ? (<Link href={`/cliente/reservas/${reservation.id}/pedido`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">
                            Adicionar pedido antecipado
                          </Link>) : null}
                        {["CANCELADA", "RECUSADA"].includes(reservation.status) ? (<button type="button" onClick={() => excluirReservaDaLista(reservation.id)} className="text-xs font-bold text-app-cinza transition hover:text-app-vermelho-erro">
                            Excluir da lista
                          </button>) : null}
                      </div>
                    </div>
                  </article>))}
              </div>) : (<EmptyReservationPanel />)}
          </section>
        </div>
      </section>

      {reservaParaCancelar ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-[16px] bg-app-creme-leve p-6 text-app-cafe-profundo shadow-xl ring-1 ring-app-baunilha-dourada/70">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
              Cancelamento de reserva
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Deseja desmarcar esta reserva?
            </h2>
            <p className="mt-3 text-sm leading-6 text-app-mocha">
              Ao confirmar, a mesa e o horario reservados serao cancelados. O restaurante passara a ver esta reserva como cancelada.
            </p>
            {reservaParaCancelar.activeOrder ? (<p className="mt-3 rounded-[10px] bg-app-chantilly p-3 text-sm font-semibold leading-6 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">
                Esta reserva possui pedido antecipado ativo. Se o preparo ainda nao tiver iniciado, o pedido tambem sera cancelado pelo sistema.
              </p>) : null}
            <div className="mt-6 rounded-[10px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/60">
              <p className="text-sm font-semibold">{reservaParaCancelar.restaurant}</p>
              <p className="mt-1 text-xs text-app-cinza">
                {formatarDataReserva(reservaParaCancelar.date).dia} {formatarDataReserva(reservaParaCancelar.date).mes} - {formatarHorario(reservaParaCancelar.time)} - {reservaParaCancelar.people} {reservaParaCancelar.people === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setReservaParaCancelar(null)} disabled={cancelandoReserva} className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza">
                Manter reserva
              </button>
              <button type="button" onClick={() => cancelarReserva(reservaParaCancelar.id)} disabled={cancelandoReserva} className="h-11 rounded-[8px] bg-app-vermelho-erro px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:cursor-not-allowed disabled:bg-app-cinza/50">
                {cancelandoReserva ? "Cancelando..." : "Confirmar cancelamento"}
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
