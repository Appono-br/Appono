"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useInterface } from "@/lib/use-interface";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";

const itens = [
    ["Início", "/cliente/dashboard"],
    ["Appono Rotina", "/cliente/rotina"],
    ["Busca", "/cliente/busca"],
    ["Pedidos", "/cliente/detalhes-pedido"],
    ["Reservas", "/cliente/reservas"],
    ["Favoritos", "/cliente/favoritos"],
    ["Mensagens", "/cliente/mensagens"],
    ["Suporte", "/cliente/suporte"],
];
const paginasComHeader = new Set(["/cliente/dashboard", "/cliente/busca", "/cliente/reservas", "/cliente/mensagens", "/cliente/configuracoes", "/cliente/rotina"]);

export function ClienteHeader() {
    const pathname = usePathname();
    const { ui } = useInterface();
    if (paginasComHeader.has(pathname?.replace(/\/$/, ""))) return null;
    return <header className="border-b border-app-baunilha-dourada/50 bg-white text-app-cafe-profundo">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
            <Link href="/cliente/dashboard" aria-label={ui("Appono")}><Image src="/brand/appono-mark.svg" alt="Appono" width={48} height={48} className="h-11 w-11" /></Link>
            <nav aria-label={ui("Navegação do cliente")} className="order-last flex w-full items-center gap-5 overflow-x-auto py-2 text-sm font-semibold xl:order-none xl:w-auto">
                {itens.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href || (href === "/cliente/rotina" && pathname?.startsWith(`${href}/`)) ? "page" : undefined} className="shrink-0 rounded-md px-1 py-2 text-app-mocha transition hover:bg-app-chantilly aria-[current=page]:text-app-caramelo-torrado">{ui(label)}</Link>)}
            </nav>
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
        </div>
    </header>;
}
