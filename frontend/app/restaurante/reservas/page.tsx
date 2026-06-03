"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type RestaurantSession = {
  type?: "client" | "restaurant";
  name?: string;
};

const navItems = [
  { label: "Home", href: "/restaurante/home" },
  { label: "Dashboard", href: "/restaurante/dashboard" },
  { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
  { label: "Desempenho", href: "/restaurante/desempenho" },
  { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
  { label: "Reservas", href: "/restaurante/reservas" },
  { label: "Mensagens", href: "/restaurante/mensagens" },
  { label: "Configuracoes", href: "/restaurante/configuracoes" },
];

const periodSummary = [
  { label: "Total de capas" },
  { label: "Mesas VIP" },
];

const compactMetrics = [
  { label: "Ocupacao", icon: "users" },
  { label: "Avaliacao media", icon: "star" },
];

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type: "filter" | "menu" | "plus" | "star" | "users" | "utensils";
  className?: string;
}) {
  const paths = {
    filter: "M4 7h16M7 12h10M10 17h4",
    menu: "M4 7h16M4 12h16M4 17h16",
    plus: "M12 5v14M5 12h14",
    star:
      "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3z",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    utensils:
      "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
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

function EmptyPanel({
  title,
  description,
  className = "",
}: {
  title: string;
  description: string;
  className?: string;
}) {
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

export default function RestaurantReservationsPage() {
  const [session] = useState<RestaurantSession | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedSession = window.localStorage.getItem("appono:session");
    return storedSession ? (JSON.parse(storedSession) as RestaurantSession) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isRestaurant = session?.type === "restaurant";

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
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-transparent text-app-cafe-profundo backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:h-24">
          <Link href="/restaurante/home" aria-label="Home do restaurante">
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={88}
              height={88}
              className="h-14 w-14 lg:h-20 lg:w-20"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-app-cinza xl:flex">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  index === 5
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="restaurant-reservations-menu"
          >
            <Icon type="menu" />
          </button>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="restaurant-reservations-menu"
            className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-4 xl:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-3 text-sm font-semibold text-app-cinza">
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    index === 5
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-app-creme-leve px-5 text-xs font-bold uppercase tracking-[0.18em] text-app-mocha transition hover:bg-app-baunilha-dourada"
            >
              <Icon type="filter" className="h-4 w-4" />
              Filtrar
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado"
            >
              <Icon type="plus" className="h-4 w-4" />
              Nova reserva
            </button>
          </div>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.45fr_1fr]">
          <aside className="h-fit rounded-[8px] bg-app-creme-suave p-7 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
              Resumo do periodo
            </p>
            <h2 className="mt-5 text-3xl font-medium italic text-app-mocha">
              Manha & Almoco
            </h2>

            <div className="mt-8 grid gap-5">
              {periodSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-5 text-sm"
                >
                  <span className="text-app-cinza">{item.label}</span>
                  <strong className="text-lg text-app-cafe-profundo">--</strong>
                </div>
              ))}
            </div>

            <div className="mt-9 h-px bg-app-baunilha-dourada/70" />
          </aside>

          <section>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                Proximos clientes
              </h2>
              <p className="text-sm text-app-cinza">-- agendamentos restantes</p>
            </div>

            <EmptyPanel
              title="Nenhum agendamento para exibir"
              description="Os agendamentos do dia aparecerao nesta lista."
              className="min-h-[310px] bg-app-chantilly"
            />
          </section>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.52fr]">
          <article className="relative min-h-[320px] overflow-hidden rounded-[8px] bg-app-cafe-profundo p-8 text-app-creme-leve shadow-sm">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(47,27,16,0.96),rgba(138,85,42,0.58))]" />
            <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-end">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-app-baunilha-dourada">
                Prato destaque do dia
              </p>
              <h2 className="mt-4 text-3xl font-medium italic text-app-chantilly">
                Nenhum destaque selecionado
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-app-creme-suave">
                Escolha um prato para destacar nas reservas de hoje.
              </p>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {compactMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-[8px] bg-app-creme-suave p-7 shadow-sm ring-1 ring-app-baunilha-dourada/60"
              >
                <Icon
                  type={metric.icon as "users" | "star"}
                  className="h-6 w-6 text-app-caramelo-torrado"
                />
                <strong className="mt-5 block text-4xl font-medium text-app-cafe-profundo">
                  --
                </strong>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                  {metric.label}
                </p>
              </article>
            ))}
          </div>
        </section>
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
