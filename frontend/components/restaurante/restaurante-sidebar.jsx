"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LinkNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useInterface } from "@/lib/use-interface";
import { encerrarSessao } from "@/lib/session";
import "./restaurante-sidebar.css";

const itens = [
    ["Dashboard", "dashboard", "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
    ["Gestão de cardápio", "cardapio", "M4 3h16v18H4zM8 7h8M8 12h8M8 17h5"],
    ["Desempenho", "desempenho", "M4 20h16M7 16v-5M12 16V4M17 16V8"],
    ["Relatório financeiro", "financeiro", "M4 5h16v14H4zM4 9h16M8 14h3M15 14h1"],
    ["Reservas", "reservas", "M4 5h16v16H4zM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2"],
    ["Cozinha", "pedidos", "M4 3v7h6V3M7 3v18M17 3v18M17 3c5 3 5 9 0 9"],
    ["Histórico", "historico-pedidos", "M3 11a9 9 0 1 1 3 8M3 4v7h7M12 7v5l3 2"],
    ["Mensagens", "mensagens", "M4 4h16v13H9l-5 4zM8 8h8M8 12h5"],
    ["Suporte", "suporte", "M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v6h4v-6zM20 12h2v6h-4v-6zM20 18v3h-7"],
    ["Configurações", "configuracoes", "M4 7h16M4 17h16M8 4v6M16 14v6"],
];

function Icone({ caminho }) {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d={caminho} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function RestauranteSidebar() {
    const { ui } = useInterface();
    const pathname = usePathname();
    const [aberto, setAberto] = useState(false);
    const [saindo, setSaindo] = useState(false);
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!aberto) return;
        const dialog = dialogRef.current;
        dialog.showModal();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const media = window.matchMedia("(min-width: 1024px)");
        const fecharNoDesktop = () => { if (media.matches) setAberto(false); };
        media.addEventListener("change", fecharNoDesktop);
        return () => {
            dialog.close();
            document.body.style.overflow = overflow;
            media.removeEventListener("change", fecharNoDesktop);
        };
    }, [aberto]);

    async function sairDaConta() {
        if (saindo) return;
        setSaindo(true);
        await encerrarSessao();
        window.location.assign("/");
    }

    function conteudo(mobile = false) {
        return <>
            <div className="restaurant-sidebar-brand">
                <Link href="/restaurante/dashboard" onClick={() => setAberto(false)} aria-label={ui("Dashboard")}>
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} priority />
                </Link>
                {mobile ? <button type="button" onClick={() => setAberto(false)} aria-label={ui("Fechar menu")}><Icone caminho="M6 6l12 12M18 6 6 18" /></button> : null}
            </div>
            <nav aria-label={ui("Menu do restaurante")} className="restaurant-sidebar-nav">
                {itens.map(([label, rota, caminho]) => {
                    const href = `/restaurante/${rota}`;
                    const ativo = pathname === href || pathname.startsWith(`${href}/`);
                    return <Link key={rota} href={href} aria-current={ativo ? "page" : undefined} onClick={() => setAberto(false)}>
                        <Icone caminho={caminho} /><span>{ui(label)}</span>
                    </Link>;
                })}
            </nav>
            <div className="restaurant-sidebar-notifications" onClick={() => setAberto(false)}>
                <LinkNotificacoes href="/restaurante/notificacoes" />
                <Link href="/restaurante/notificacoes" aria-current={pathname === "/restaurante/notificacoes" ? "page" : undefined}>{ui("Notificações")}</Link>
            </div>
            <button type="button" className="restaurant-sidebar-logout" onClick={sairDaConta} disabled={saindo} aria-busy={saindo}>
                <Icone caminho="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                <span>{ui(saindo ? "Saindo..." : "Sair da conta")}</span>
            </button>
        </>;
    }

    return <>
        <aside className="restaurant-sidebar">{conteudo()}</aside>
        <button type="button" className="restaurant-menu-trigger" onClick={() => setAberto(true)} aria-expanded={aberto} aria-controls="restaurant-mobile-sidebar">
            <Icone caminho="M4 6h16M4 12h16M4 18h16" /><span>{ui("Menu")}</span>
        </button>
        {aberto ? <dialog ref={dialogRef} id="restaurant-mobile-sidebar" className="restaurant-sidebar-dialog" aria-label={ui("Menu do restaurante")} onCancel={() => setAberto(false)} onClick={(event) => { if (event.target === event.currentTarget) setAberto(false); }}>
            <div className="restaurant-sidebar-mobile-content">{conteudo(true)}</div>
        </dialog> : null}
    </>;
}
