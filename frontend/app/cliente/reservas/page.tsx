"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

type Reservation = {
  id: string;
  date: string;
  time: string;
  status: string;
  restaurant: string;
  people: number;
  minimumTotal: number;
};

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

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type:
    | "bag"
    | "bell"
    | "chevron-left"
    | "chevron-right"
    | "clock"
    | "people"
    | "menu"
    | "plus"
    | "wallet";
  className?: string;
}) {
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

function formatarDataReserva(data: string) {
  const dataLocal = new Date(`${data}T12:00:00`);
  return {
    dia: String(dataLocal.getDate()).padStart(2, "0"),
    mes: dataLocal.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    semana: dataLocal.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
  };
}

function formatarHorario(horario: string) {
  return horario.slice(0, 5);
}

function obterStatusReserva(status: string) {
  if (status === "CONFIRMADA") {
    return { texto: "Confirmada", classe: "bg-app-baunilha-dourada text-app-cafe-profundo" };
  }

  if (status === "CANCELADA") {
    return { texto: "Cancelada", classe: "bg-app-vermelho-erro/10 text-app-vermelho-erro" };
  }

  return { texto: status.toLowerCase(), classe: "bg-app-creme-suave text-app-mocha" };
}

function getCalendarDays(month: number, year: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const leadingDays = firstDay.getDay();
  const days: Array<{ day: number; currentMonth: boolean; date: string }> = [];

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
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type="plus" className="h-6 w-6" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-app-cafe-profundo">
        Planeje sua próxima visita
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-app-cinza sm:text-base">
        Você ainda não possui reservas confirmadas neste período.
      </p>
      <Link
        href="/cliente/dashboard"
        className="mt-8 rounded-[8px] bg-app-dourado-mel px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado"
      >
        Reservar agora
      </Link>
    </section>
  );
}

export default function ReservationsPage() {
  const today = new Date();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [period, setPeriod] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
  });

  const calendarDays = useMemo(
    () => getCalendarDays(period.month, period.year),
    [period.month, period.year],
  );

  const reservationDates = useMemo(
    () =>
      new Set(
        reservations
          .filter((reservation) => ["PENDENTE", "CONFIRMADA"].includes(reservation.status))
          .map((reservation) => reservation.date),
      ),
    [reservations],
  );
  const reservasAtivas = useMemo(
    () => reservations.filter((reservation) => ["PENDENTE", "CONFIRMADA"].includes(reservation.status)),
    [reservations],
  );

  useEffect(() => {
    async function loadReservations() {
      try {
        const data = await apiRequest<
          Array<{
            id_reserva: number;
            data_reserva: string;
            horario_inicio: string;
            status_reserva: string;
            quantidade_pessoas: number;
            valor_minimo_total: number;
            restaurantes?: { nome?: string } | null;
          }>
        >("/reservas");

        setReservations(
          data.map((reservation) => ({
            id: String(reservation.id_reserva),
            date: reservation.data_reserva,
            time: reservation.horario_inicio,
            status: reservation.status_reserva,
            restaurant: reservation.restaurantes?.nome ?? "Restaurante",
            people: reservation.quantidade_pessoas,
            minimumTotal: reservation.valor_minimo_total,
          })),
        );
      } catch {
        setReservations([]);
      }
    }

    loadReservations();
  }, []);

  function changeMonth(direction: -1 | 1) {
    setPeriod((current) => {
      const date = new Date(current.year, current.month + direction, 1);
      return { month: date.getMonth(), year: date.getFullYear() };
    });
  }

  async function cancelarReserva(id: string) {
    try {
      const atualizada = await apiRequest<{ status_reserva: string }>(
        `/reservas/${id}/cancelar`,
        { method: "PATCH" },
      );
      setReservations((atuais) =>
        atuais.map((reserva) =>
          reserva.id === id ? { ...reserva, status: atualizada.status_reserva } : reserva,
        ),
      );
    } catch {
      return;
    }
  }

  async function excluirReservaDaLista(id: string) {
    try {
      await apiRequest(`/reservas/${id}/ocultar`, { method: "PATCH" });
      setReservations((atuais) => atuais.filter((reserva) => reserva.id !== id));
    } catch {
      return;
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={88}
              height={88}
              className="h-11 w-11 lg:h-14 lg:w-14"
              priority
            />
          </div>

          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  index === 2
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <button
              type="button"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Notificações"
            >
              <Icon type="bell" />
            </button>
            <button
              type="button"
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Sacola"
            >
              <Icon type="bag" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="reservations-mobile-menu"
            >
              <Icon type="menu" />
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="reservations-mobile-menu"
            className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    index === 2
                      ? "text-app-cafe-profundo"
                      : "transition hover:text-app-cafe-profundo"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
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
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Período anterior"
            >
              <Icon type="chevron-left" />
            </button>
            <div className="min-w-36 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-cinza">
                Período
              </p>
              <p className="mt-1 text-xl">
                {monthNames[period.month]} {period.year}
              </p>
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="transition hover:text-app-caramelo-torrado"
              aria-label="Próximo período"
            >
              <Icon type="chevron-right" />
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.78fr_1.62fr]">
          <aside className="h-fit rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-10">
            <h2 className="text-2xl font-medium text-app-cafe-profundo">
              Calendário do Mês
            </h2>
            <div className="mt-8 grid grid-cols-7 gap-2 text-center text-sm text-app-cinza">
              {weekDays.map((day, index) => (
                <span key={`${day}-${index}`} className="font-medium">
                  {day}
                </span>
              ))}
              {calendarDays.map((day) => {
                const hasReservation = reservationDates.has(day.date);

                return (
                  <span
                    key={day.date}
                    className={`flex h-10 items-center justify-center rounded-[8px] text-sm ${
                      hasReservation
                        ? "bg-app-baunilha-dourada font-bold text-app-caramelo-torrado"
                        : day.currentMonth
                          ? "text-app-cafe-profundo"
                          : "text-app-cinza/40"
                    }`}
                  >
                    {day.day}
                  </span>
                );
              })}
            </div>

            <p className="mt-8 text-base leading-7 text-app-mocha">
              Você possui{" "}
              <span className="font-bold text-app-caramelo-torrado">
                {reservasAtivas.length}
              </span>{" "}
              reservas confirmadas neste período.
            </p>
          </aside>

          <section className="grid content-start gap-6 self-start">
            {reservations.length ? (
              <div className="grid auto-rows-max content-start gap-4">
                {reservations.map((reservation) => (
                  <article
                    key={reservation.id}
                    className="overflow-hidden rounded-[12px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/70 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
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
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-app-mocha">
                          <span className="flex items-center gap-2">
                            <Icon type="clock" className="h-4 w-4 text-app-caramelo-torrado" />
                            {formatarHorario(reservation.time)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Icon type="people" className="h-4 w-4 text-app-caramelo-torrado" />
                            {reservation.people} {reservation.people === 1 ? "pessoa" : "pessoas"}
                          </span>
                          <span className="flex items-center gap-2">
                            <Icon type="wallet" className="h-4 w-4 text-app-caramelo-torrado" />
                            Consumo minimo{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(reservation.minimumTotal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center gap-4 border-t border-app-baunilha-dourada/60 bg-app-creme-suave/55 p-5 text-center sm:min-w-40 sm:border-l sm:border-t-0">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${obterStatusReserva(reservation.status).classe}`}>
                          {obterStatusReserva(reservation.status).texto}
                        </span>
                        {["PENDENTE", "CONFIRMADA"].includes(reservation.status) ? (
                          <button
                            type="button"
                            onClick={() => cancelarReserva(reservation.id)}
                            className="text-xs font-bold text-app-vermelho-erro transition hover:text-app-cafe-profundo"
                          >
                            Desmarcar reserva
                          </button>
                        ) : null}
                        {["CANCELADA", "RECUSADA"].includes(reservation.status) ? (
                          <button
                            type="button"
                            onClick={() => excluirReservaDaLista(reservation.id)}
                            className="text-xs font-bold text-app-cinza transition hover:text-app-vermelho-erro"
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
              <EmptyReservationPanel />
            )}
          </section>
        </div>
      </section>

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
    </main>
  );
}
