"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useInterface } from "@/lib/use-interface";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";

const itens = [
    ["Início", "/cliente/dashboard"],
    ["Appono Rotina", "/cliente/rotina"],
    ["Detalhes do pedido", "/cliente/detalhes-pedido"],
    ["Reservas", "/cliente/reservas"],
    ["Favoritos", "/cliente/favoritos"],
    ["Mensagens", "/cliente/mensagens"],
    ["Suporte", "/cliente/suporte"],
    ["Configurações", "/cliente/configuracoes"],
];
function HeaderIcon({ type }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        menu: "M4 7h16M4 12h16M4 17h16",
    };

    return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"><path d={paths[type]} /></svg>;
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
            <nav aria-label={ui("Navegação principal do cliente")} className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
                {itens.map(([label, href]) => <Link key={href} href={href} aria-current={estaAtivo(pathname, href) ? "page" : undefined} className="rounded-md px-1 py-2 outline-none transition hover:text-app-cafe-profundo focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado aria-[current=page]:text-app-cafe-profundo aria-[current=page]:underline aria-[current=page]:decoration-app-caramelo-torrado aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8">{ui(label)}</Link>)}
            </nav>
            <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
                <Link href="/cliente/detalhes-pedido" aria-label={ui("Sacola")} className="rounded-md outline-none transition hover:text-app-caramelo-torrado focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado focus-visible:ring-offset-2">
                    <HeaderIcon type="bag" />
                </Link>
                <ItemHeaderNotificacoes href="/cliente/notificacoes" />
                <button type="button" onClick={() => setMenuAberto((aberto) => !aberto)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white text-app-cafe-profundo outline-none transition hover:bg-app-chantilly focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado lg:hidden" aria-label={ui(menuAberto ? "Fechar menu" : "Abrir menu")} aria-expanded={menuAberto} aria-controls="cliente-menu-compartilhado">
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
