"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Settings,
  Heart,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";

import { useInterface } from "@/lib/use-interface";
import { LinkNotificacoes } from "@/components/notificacoes/contador-notificacoes";

const itens = [
  ["Início", "/cliente/dashboard"],
  ["Appono Rotina", "/cliente/rotina"],
  ["Agenda", "/cliente/agenda"],
  ["Favoritos", "/cliente/favoritos"],
  ["Mensagens", "/cliente/mensagens"],
];

function estaAtivo(pathname, href) {
  if (href === "/cliente/dashboard") return pathname === href;
  if (href === "/cliente/agenda") {
    return [
      "/cliente/agenda",
      "/cliente/reservas",
      "/cliente/pedidos",
      "/cliente/detalhes-pedido",
      "/cliente/pagamentos/pedido",
      "/cliente/pagamentos/reserva",
    ].some((rota) => pathname === rota || pathname?.startsWith(`${rota}/`));
  }
  return pathname === href || pathname?.startsWith(`${href}/`);
}

export function ClienteHeader() {
  const pathname = usePathname();
  const { ui } = useInterface();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
        {/* Logo */}
        <Link
          href="/cliente/dashboard"
          aria-label={ui("Ir para o início da Appono")}
          className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2"
        >
          <Image
            src="/brand/appono-mark.svg"
            alt={ui("Appono")}
            width={88}
            height={88}
            priority
            className="h-11 w-11 lg:h-14 lg:w-14"
          />
        </Link>

        {/* Nav Desktop */}
        <nav
          aria-label={ui("Navegação principal do cliente")}
          className="hidden items-center justify-self-center gap-8 text-sm font-semibold text-app-cinza lg:flex"
        >
          {itens
            .filter(([label]) => !["Favoritos", "Mensagens"].includes(label))
            .map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={estaAtivo(pathname, href) ? "page" : undefined}
                className="rounded-md px-2 py-3 outline-none transition hover:text-app-cafe-profundo focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado aria-[current=page]:text-app-cafe-profundo aria-[current=page]:underline aria-[current=page]:decoration-app-caramelo-torrado aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
              >
                {ui(label)}
              </Link>
            ))}
        </nav>

        {/* Ações do Header */}
        <div className="col-start-3 flex items-center justify-self-end gap-3 text-app-cafe-profundo">
          {/* Favoritos */}
          <Link
            href="/cliente/favoritos"
            aria-label={ui("Favoritos")}
            title={ui("Favoritos")}
            aria-current={estaAtivo(pathname, "/cliente/favoritos") ? "page" : undefined}
            onClick={() => setMenuAberto(false)}
            className="relative flex h-10 w-10 items-center justify-center rounded-md outline-none transition hover:text-app-caramelo-torrado focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2"
          >
            <Heart className="h-6 w-6" aria-hidden="true" />
          </Link>

          {/* Mensagens */}
          <Link
            href="/cliente/mensagens"
            aria-label={ui("Mensagens")}
            title={ui("Mensagens")}
            aria-current={estaAtivo(pathname, "/cliente/mensagens") ? "page" : undefined}
            onClick={() => setMenuAberto(false)}
            className="relative flex h-10 w-10 items-center justify-center rounded-md outline-none transition hover:text-app-caramelo-torrado focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2"
          >
            <MessageSquare className="h-6 w-6" aria-hidden="true" />
          </Link>

          {/* Configurações */}
          <Link
            href="/cliente/configuracoes"
            aria-label={ui("Configurações")}
            title={ui("Configurações")}
            aria-current={estaAtivo(pathname, "/cliente/configuracoes") ? "page" : undefined}
            onClick={() => setMenuAberto(false)}
            className="relative flex h-10 w-10 items-center justify-center rounded-md outline-none transition hover:text-app-caramelo-torrado focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2"
          >
            <Settings className="h-6 w-6" aria-hidden="true" />
          </Link>

          {/* Notificações */}
          <div className="flex h-10 w-10 items-center justify-center">
            <LinkNotificacoes
              href="/cliente/notificacoes"
              iconeClassName="h-6 w-6"
              ariaCurrent={estaAtivo(pathname, "/cliente/notificacoes") ? "page" : undefined}
            />
          </div>

          {/* Botão Menu Mobile */}
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className="app-icon-button flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo outline-none transition hover:bg-app-chantilly focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado lg:hidden"
            aria-label={ui(menuAberto ? "Fechar menu" : "Abrir menu")}
            aria-expanded={menuAberto}
            aria-controls="cliente-menu-compartilhado"
          >
            {menuAberto ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile Expandido */}
      {menuAberto ? (
        <nav
          id="cliente-menu-compartilhado"
          aria-label={ui("Navegação móvel do cliente")}
          className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-3 lg:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-1 text-xs font-semibold text-app-cinza sm:grid-cols-2">
            {itens.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                aria-current={estaAtivo(pathname, href) ? "page" : undefined}
                className="rounded-[8px] px-3 py-3 outline-none transition hover:bg-app-chantilly hover:text-app-cafe-profundo focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado aria-[current=page]:bg-app-chantilly aria-[current=page]:text-app-cafe-profundo"
              >
                {ui(label)}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
