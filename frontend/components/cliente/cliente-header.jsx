"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useInterface } from "@/lib/use-interface";
import { LinkNotificacoes } from "@/components/notificacoes/contador-notificacoes";

const itens = [
    ["Início", "/cliente/dashboard"],
    ["Appono Rotina", "/cliente/rotina"],
    ["Reservas", "/cliente/reservas"],
    ["Favoritos", "/cliente/favoritos"],
    ["Mensagens", "/cliente/mensagens"],
    ["Ofertas", "/cliente/ofertas"],
];
function HeaderIcon({ type }) {
    const paths = {
        cart: "M3 3h2l2.2 12h10.6l2-8H7.2 M10 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M17 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
        settings: "M9.5 3h5l.5 2.2 1.6.9 2.1-.7 2.5 4.2-1.7 1.5v1.8l1.7 1.5-2.5 4.2-2.1-.7-1.6.9-.5 2.2h-5L9 18.8l-1.6-.9-2.1.7-2.5-4.2 1.7-1.5v-1.8L2.8 9.6l2.5-4.2 2.1.7L9 5.2 9.5 3Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
        menu: "M4 7h16M4 12h16M4 17h16",
    };

    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d={paths[type]} /></svg>;
}

function estaAtivo(pathname, href) {
    if (href === "/cliente/dashboard") return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
}

export function ClienteHeader() {
    const pathname = usePathname();
    const { ui } = useInterface();
    const [menuAberto, setMenuAberto] = useState(false);
    return <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
            <Link href="/cliente/dashboard" aria-label={ui("Ir para o início da Appono")} className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2">
                <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} priority className="h-11 w-11 lg:h-14 lg:w-14" />
            </Link>
            <nav aria-label={ui("Navegação principal do cliente")} className="hidden items-center justify-self-center gap-8 text-sm font-semibold text-app-cinza lg:flex">
                {itens.map(([label, href]) => <Link key={href} href={href} aria-current={estaAtivo(pathname, href) ? "page" : undefined} className="rounded-md px-2 py-3 outline-none transition hover:text-app-cafe-profundo focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado aria-[current=page]:text-app-cafe-profundo aria-[current=page]:underline aria-[current=page]:decoration-app-caramelo-torrado aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8">{ui(label)}</Link>)}
            </nav>
            <div className="col-start-3 flex items-center justify-self-end gap-4 text-app-cafe-profundo">
                <Link href="/cliente/detalhes-pedido" aria-label={ui("Carrinho")} aria-current={estaAtivo(pathname, "/cliente/detalhes-pedido") ? "page" : undefined} className="relative flex h-11 w-11 items-center justify-center rounded-md outline-none transition hover:text-app-caramelo-torrado focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2 aria-[current=page]:text-app-cafe-profundo aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-[var(--app-caramelo-torrado)]">
                    <HeaderIcon type="cart" />
                </Link>
                <Link href="/cliente/configuracoes" aria-label={ui("Configurações")} title={ui("Configurações")} aria-current={estaAtivo(pathname, "/cliente/configuracoes") ? "page" : undefined} onClick={() => setMenuAberto(false)} className="relative flex h-11 w-11 items-center justify-center rounded-md outline-none transition hover:text-app-caramelo-torrado focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2 aria-[current=page]:text-app-cafe-profundo aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:w-5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-[var(--app-caramelo-torrado)]">
                    <HeaderIcon type="settings" />
                </Link>
                <div className="flex h-11 w-11 items-center justify-center">
                    <LinkNotificacoes href="/cliente/notificacoes" iconeClassName="h-6 w-6" ariaCurrent={estaAtivo(pathname, "/cliente/notificacoes") ? "page" : undefined} />
                </div>
                <button type="button" onClick={() => setMenuAberto((aberto) => !aberto)} className="app-icon-button flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo outline-none transition hover:bg-app-chantilly focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado lg:hidden" aria-label={ui(menuAberto ? "Fechar menu" : "Abrir menu")} aria-expanded={menuAberto} aria-controls="cliente-menu-compartilhado">
                    <HeaderIcon type="menu" />
                </button>
            </div>
        </div>
        {menuAberto ? <nav id="cliente-menu-compartilhado" aria-label={ui("Navegação móvel do cliente")} className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-1 text-xs font-semibold text-app-cinza sm:grid-cols-2">
                {itens.map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuAberto(false)} aria-current={estaAtivo(pathname, href) ? "page" : undefined} className="rounded-[8px] px-3 py-3 outline-none transition hover:bg-app-chantilly hover:text-app-cafe-profundo focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado aria-[current=page]:bg-app-chantilly aria-[current=page]:text-app-cafe-profundo">{ui(label)}</Link>)}
            </div>
        </nav> : null}
    </header>;
}
