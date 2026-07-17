"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
const reservation = null;
const navItems = [
    { label: "Início", href: "/cliente/dashboard" },
    { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
    { label: "Reservas", href: "/cliente/reservas" },
    { label: "Mensagens", href: "/cliente/mensagens" },
    { label: "Configurações", href: "/cliente/configuracoes" },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
        clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
        help: "M12 18h.01M9.2 9a3 3 0 1 1 4.9 2.3c-1.2.8-2.1 1.5-2.1 3",
        map: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
        menu: "M4 7h16M4 12h16M4 17h16",
        receipt: "M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3z M9 8h6M9 12h6M9 16h4",
        shield: "M12 21s7-3.2 7-9.8V5l-7-3-7 3v6.2C5 17.8 12 21 12 21z M9.5 12l1.7 1.7 3.8-4",
        users: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
        x: "M18 6 6 18M6 6l12 12",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function EmptyDataBlock({ title, description, icon = "receipt", }) {
    return (<div className="rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
        <Icon type={icon} className="h-5 w-5"/>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-app-cafe-profundo">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-cinza">
        {description}
      </p>
    </div>);
}
function DetailSlot({ icon, label, value, }) {
    return (<div className="flex gap-4">
      <Icon type={icon} className="mt-7 h-5 w-5 shrink-0 text-app-caramelo-torrado"/>
      <div>
        <p className="text-[10px] font-bold uppercase text-app-cinza">
          {label}
        </p>
        <p className="mt-5 text-xl text-app-mocha">
          {value ?? "Não informado"}
        </p>
      </div>
    </div>);
}
export default function OrderDetailsPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const hasReservation = Boolean(reservation);
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 1
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Notificações">
              <Icon type="bell"/>
            </button>
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
              <Icon type="bag"/>
            </button>
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="order-mobile-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="order-mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 1
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      {!hasReservation ? (<section className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-16">
          <EmptyDataBlock icon="shield" title="Nenhum pedido registrado" description="Você ainda não possui uma reserva ou pedido confirmado para visualizar nesta página."/>
        </section>) : (<>
      <section className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
          {reservation?.code ? `Reserva #${reservation.code}` : "Reserva"}
        </p>
        <div className="mt-12 flex flex-col gap-8 border-b border-app-baunilha-dourada pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-medium text-app-cafe-profundo sm:text-6xl lg:text-7xl">
              Detalhes do pedido
            </h1>
            <p className="mt-8 flex items-center gap-2 text-lg text-app-cinza">
              <Icon type="shield" className="h-5 w-5 text-app-caramelo-torrado"/>
              {reservation?.status ?? "Nenhuma reserva selecionada"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:pb-2">
            <button type="button" disabled={!hasReservation} className="h-12 rounded-[8px] bg-app-caramelo-torrado px-10 text-xs font-bold uppercase text-app-chantilly transition hover:bg-app-cafe-profundo disabled:cursor-not-allowed disabled:bg-app-cinza/35 disabled:text-app-chantilly">
              Ver recibo
            </button>
            <button type="button" disabled={!hasReservation} className="h-12 rounded-[8px] border border-app-mocha px-10 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-creme-leve disabled:cursor-not-allowed disabled:border-app-cinza/40 disabled:text-app-cinza">
              Entrar em contato
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-24 lg:grid-cols-[1fr_0.46fr]">
        <div className="grid gap-8">
          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-10">
            <h2 className="text-2xl font-medium text-app-cafe-profundo">
              Quando e Onde
            </h2>
            <div className="mt-5 h-px bg-app-baunilha-dourada/60"/>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <DetailSlot icon="calendar" label="Data" value={reservation?.date}/>
              <DetailSlot icon="clock" label="Horário" value={reservation?.time}/>
              <DetailSlot icon="users" label="Pessoas" value={reservation?.guests
                ? `${reservation.guests} convidado${reservation.guests > 1 ? "s" : ""}`
                : undefined}/>
            </div>
          </article>

          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-10">
            <h2 className="text-2xl font-medium text-app-cafe-profundo">
              Detalhes do Pedido
            </h2>
            <div className="mt-5 h-px bg-app-baunilha-dourada/60"/>

            {reservation?.items.length ? (<div className="mt-8 grid gap-6">
                {reservation.items.map((item) => (<article key={item.id} className="grid gap-4 border-b border-app-baunilha-dourada/60 pb-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="text-xl font-medium text-app-mocha">
                        {item.name}
                      </h3>
                      {item.description ? (<p className="mt-2 text-sm leading-6 text-app-cinza">
                          {item.description}
                        </p>) : null}
                    </div>
                    <p className="text-lg font-medium text-app-cafe-profundo">
                      Valor será calculado
                    </p>
                  </article>))}
              </div>) : (<div className="mt-8">
                <EmptyDataBlock title="Pedido ainda não carregado" description="Nenhum item foi registrado para esta reserva."/>
              </div>)}

            <div className="mt-10 grid gap-4 border-t border-app-baunilha-dourada/60 pt-8 text-app-cinza">
              <div className="flex items-center justify-between gap-4">
                <span>Subtotal</span>
                <span>Não informado</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Taxa de Reserva</span>
                <span>Não informado</span>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-app-baunilha-dourada/60 pt-8 text-app-cafe-profundo sm:flex-row sm:items-center sm:justify-between">
                <span className="text-3xl font-medium">Total Pago</span>
                <span className="text-3xl font-medium">Não informado</span>
              </div>
            </div>
          </article>
        </div>

        <aside className="grid h-fit gap-4">
          <article className="overflow-hidden rounded-[8px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/60">
            <div className="flex aspect-[1.65] items-center justify-center bg-app-baunilha-dourada text-app-cafe-profundo">
              <Icon type="map" className="h-12 w-12"/>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
                Localização
              </p>
              <p className="mt-6 text-xl leading-8 text-app-cafe-profundo">
                Endereço não informado.
              </p>
              <button type="button" disabled={!reservation?.restaurant?.mapsUrl} className="mt-8 h-12 w-full rounded-[8px] border border-app-mocha text-xs font-bold uppercase text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:border-app-cinza/40 disabled:text-app-cinza">
                Abrir no Google Maps
              </button>
            </div>
          </article>

          <article className="rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada/60">
            <Icon type="help" className="mx-auto h-6 w-6 text-app-caramelo-torrado"/>
            <p className="mt-4 text-app-cinza">Dúvidas sobre sua reserva?</p>
            <Link href="#" className="mt-3 inline-block font-bold text-app-cafe-profundo underline underline-offset-4">
              Visite nossa Central de Ajuda
            </Link>
          </article>

          <button type="button" disabled={!hasReservation} className="mx-auto mt-4 flex items-center gap-3 text-xs font-bold uppercase text-app-vermelho-erro transition hover:text-app-cafe-profundo disabled:cursor-not-allowed disabled:text-app-cinza">
            <Icon type="x" className="h-4 w-4"/>
            Cancelar reserva
          </button>
        </aside>
      </section>
        </>)}

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
