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

const summaryCards = [
  "Total de itens",
  "Mais vendido",
  "Categorias ativas",
  "Itens em falta",
];

const sections = ["Entradas", "Pratos Principais"];

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type: "category" | "edit" | "menu" | "plus" | "utensils";
  className?: string;
}) {
  const paths = {
    category:
      "M5 5h6v6H5V5z M13 5h6v6h-6V5z M5 13h6v6H5v-6z M13 13h6v6h-6v-6z",
    edit: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z M13.5 7.5l3 3",
    menu: "M4 7h16M4 12h16M4 17h16",
    plus: "M12 5v14M5 12h14",
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

function EmptyMenuSection({ title }: { title: string }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-medium text-app-cafe-profundo">{title}</h2>
        <div className="h-px flex-1 bg-app-baunilha-dourada/60" />
        <span className="rounded-full bg-app-creme-suave px-4 py-2 text-xs font-bold uppercase text-app-mocha">
          -- itens
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Link
          href="/restaurante/cardapio/editar"
          className="flex min-h-[280px] flex-col items-center justify-center rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-chantilly px-6 py-10 text-center transition hover:-translate-y-0.5 hover:bg-app-creme-leve"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-creme-suave text-app-caramelo-torrado">
            <Icon type="plus" className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-xl font-semibold text-app-cafe-profundo">
            Novo item em {title}
          </h3>
          <p className="mt-3 max-w-xs text-sm leading-6 text-app-cinza">
            Adicione nome, descricao, preco e disponibilidade do prato.
          </p>
        </Link>
      </div>
    </section>
  );
}

export default function RestaurantMenuManagementPage() {
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="restaurant-menu-management"
          >
            <Icon type="menu" />
          </button>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="restaurant-menu-management"
            className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden"
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
        <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Cardapio
            </p>
            <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
              Gestao de Cardapio
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
              Organize pratos, categorias, precos e disponibilidade.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-app-creme-suave px-6 text-sm font-semibold text-app-mocha transition hover:bg-app-baunilha-dourada"
            >
              <Icon type="category" className="h-5 w-5" />
              Categorias
            </button>
            <Link
              href="/restaurante/cardapio/editar"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-app-dourado-mel px-7 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado"
            >
              <Icon type="plus" className="h-4 w-4" />
              Adicionar item
            </Link>
          </div>
        </div>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item, index) => (
            <article
              key={item}
              className={`min-h-36 rounded-[8px] p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 ${
                index === 2 ? "bg-app-creme-suave" : "bg-app-creme-leve"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
                {item}
              </p>
              <strong className="mt-6 block text-3xl font-medium text-app-cafe-profundo">
                --
              </strong>
            </article>
          ))}
        </section>

        {sections.map((section) => (
          <EmptyMenuSection key={section} title={section} />
        ))}

        <section className="mt-10 rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
              <Icon type="utensils" />
            </span>
            <div>
              <h2 className="text-2xl font-medium text-app-cafe-profundo">
                Cardapio sem itens cadastrados
              </h2>
              <p className="mt-1 text-sm text-app-cinza">
                Use o botao de adicionar item para iniciar a organizacao.
              </p>
            </div>
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
