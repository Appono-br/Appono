"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  BarChart3,
  Megaphone,
  CreditCard,
  Receipt,
  CalendarDays,
  ChefHat,
  History,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react";

import { LinkNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useInterface } from "@/lib/use-interface";
import { encerrarSessao } from "@/lib/session";
import "./restaurante-sidebar.css";

const itens = [
  ["Dashboard", "dashboard", LayoutDashboard],
  ["Gestão de cardápio", "cardapio", UtensilsCrossed],
  ["Desempenho", "desempenho", BarChart3],
  ["Campanhas Inteligentes", "campanhas", Megaphone],
  ["Plano e faturamento", "plano", CreditCard],
  ["Relatório financeiro", "financeiro", Receipt],
  ["Reservas", "reservas", CalendarDays],
  ["Cozinha", "pedidos", ChefHat],
  ["Histórico", "historico-pedidos", History],
  ["Mensagens", "mensagens", MessageSquare],
  ["Configurações", "configuracoes", Settings],
];

export function RestauranteSidebar() {
  const { ui } = useInterface();
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 1024px)");
    const fecharNoDesktop = () => {
      if (media.matches) setAberto(false);
    };
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
    return (
      <>
        <div className="restaurant-sidebar-brand">
          <Link
            href="/restaurante/dashboard"
            onClick={() => setAberto(false)}
            aria-label={ui("Dashboard")}
          >
            <Image
              src="/brand/appono-mark.svg"
              alt="Appono"
              width={72}
              height={72}
              priority
            />
          </Link>
          {mobile ? (
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label={ui("Fechar menu")}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <nav
          aria-label={ui("Menu do restaurante")}
          className="restaurant-sidebar-nav"
        >
          {itens.map(([label, rota, Icone]) => {
            const href = `/restaurante/${rota}`;
            const ativo =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={rota}
                href={href}
                aria-current={ativo ? "page" : undefined}
                onClick={() => setAberto(false)}
              >
                <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{ui(label)}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="restaurant-sidebar-notifications"
          onClick={() => setAberto(false)}
        >
          <LinkNotificacoes
            href="/restaurante/notificacoes"
            iconeClassName="h-6 w-6"
            ariaCurrent={
              pathname === "/restaurante/notificacoes" ? "page" : undefined
            }
          />
          <Link
            href="/restaurante/notificacoes"
            aria-current={
              pathname === "/restaurante/notificacoes" ? "page" : undefined
            }
          >
            {ui("Notificações")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setConfirmandoSaida(true)}
          disabled={saindo}
          className="restaurant-sidebar-logout"
          aria-label={ui("Sair da conta")}
          aria-busy={saindo}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{ui(saindo ? "Saindo..." : "Sair da conta")}</span>
        </button>
      </>
    );
  }

  return (
    <>
      <aside className="restaurant-sidebar">{conteudo()}</aside>
      <button
        type="button"
        className="restaurant-menu-trigger"
        onClick={() => setAberto(true)}
        aria-expanded={aberto}
        aria-controls="restaurant-mobile-sidebar"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span>{ui("Menu")}</span>
      </button>
      {aberto ? (
        <dialog
          ref={dialogRef}
          id="restaurant-mobile-sidebar"
          className="restaurant-sidebar-dialog"
          aria-label={ui("Menu do restaurante")}
          onCancel={() => setAberto(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setAberto(false);
          }}
        >
          <div className="restaurant-sidebar-mobile-content">
            {conteudo(true)}
          </div>
        </dialog>
      ) : null}
      <ConfirmationDialog
        open={confirmandoSaida}
        title={ui("Sair da conta")}
        description={ui(
          "Você será desconectado. Deseja continuar?"
        )}
        confirmLabel={saindo ? ui("Saindo...") : ui("Sair da conta")}
        cancelLabel={ui("Cancelar")}
        onConfirm={sairDaConta}
        onCancel={() => setConfirmandoSaida(false)}
        loading={saindo}
      />
    </>
  );
}
