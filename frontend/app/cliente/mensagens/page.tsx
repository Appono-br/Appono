"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Conversation = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
};

const conversations: Conversation[] = [];

const navItems = [
  { label: "Início", href: "/cliente/dashboard" },
  { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
  { label: "Reservas", href: "/cliente/reservas" },
  { label: "Mensagens", href: "/cliente/mensagens" },
  { label: "Configurações", href: "/cliente/configuracoes" },
];

function Icon({
  type,
  className = "h-5 w-5",
}: {
  type: "bag" | "bell" | "chevron-right" | "menu" | "message";
  className?: string;
}) {
  const paths = {
    bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    "chevron-right": "m9 18 6-6-6-6",
    menu: "M4 7h16M4 12h16M4 17h16",
    message:
      "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
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

export default function MessagesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                  index === 3
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
              aria-controls="messages-mobile-menu"
            >
              <Icon type="menu" />
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="messages-mobile-menu"
            className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    index === 3
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
        <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
          Conversas
        </p>
        <h1 className="mt-2 text-5xl font-medium text-app-cafe-profundo sm:text-6xl">
          Mensagens
        </h1>

        <div className="mt-12 overflow-hidden rounded-[8px] bg-app-chantilly shadow-sm ring-1 ring-app-baunilha-dourada/45">
          {conversations.length ? (
            <div className="divide-y divide-app-baunilha-dourada/45">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/cliente/mensagens/${conversation.id}`}
                  className="grid gap-4 p-6 transition hover:bg-app-creme-leve sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
                >
                  <span>
                    <strong className="block text-2xl font-medium text-app-cafe-profundo">
                      {conversation.title}
                    </strong>
                    <span className="mt-2 block text-sm leading-6 text-app-cinza">
                      {conversation.preview}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 text-sm text-app-cinza">
                    {conversation.updatedAt}
                    <Icon type="chevron-right" className="h-5 w-5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
                <Icon type="message" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-app-cafe-profundo">
                Nenhuma conversa disponível
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
                As mensagens trocadas com restaurantes aparecerão aqui.
              </p>
            </div>
          )}
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
