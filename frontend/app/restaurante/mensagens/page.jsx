"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
const conversations = [];
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
const filterItems = [
    { id: "all", label: "Todas" },
    { id: "unread", label: "Nao lidas" },
    { id: "archived", label: "Arquivadas" },
];
function getStorage() {
    if (typeof window === "undefined" || !window.localStorage) {
        return null;
    }
    return window.localStorage;
}
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "chevron-right": "m9 18 6-6-6-6",
        menu: "M4 7h16M4 12h16M4 17h16",
        message: "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z",
        plus: "M12 5v14M5 12h14",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function StatusBadge({ status }) {
    const label = {
        vip: "VIP",
        reserva: "Reserva",
        duvida: "Duvida",
    }[status];
    return (<span className="rounded-[4px] bg-app-creme-suave px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-app-mocha">
      {label}
    </span>);
}
export default function RestaurantMessagesPage() {
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = getStorage()?.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const isRestaurant = session?.type === "restaurant";
    const visibleConversations = useMemo(() => {
        if (filter === "unread") {
            return conversations.filter((conversation) => conversation.unread);
        }
        if (filter === "archived") {
            return conversations.filter((conversation) => conversation.archived);
        }
        return conversations.filter((conversation) => !conversation.archived);
    }, [filter]);
    if (!isRestaurant) {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
            Entrar
          </Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 6
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-messages-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-messages-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 6
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-5xl font-medium leading-tight text-app-cafe-profundo sm:text-6xl">
              Mensagens Recebidas
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-app-cinza sm:text-lg">
              Gerencie as interacoes com seus clientes. Acompanhe pedidos,
              reservas e feedbacks em tempo real.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-[8px] bg-app-creme-leve p-1 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:grid-cols-3">
            {filterItems.map((item) => (<button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`h-10 rounded-[8px] px-7 text-[10px] font-bold uppercase tracking-[0.22em] transition ${filter === item.id
                ? "bg-app-cafe-profundo text-app-creme-leve"
                : "text-app-mocha hover:bg-app-baunilha-dourada/45"}`}>
                {item.label}
              </button>))}
          </div>
        </div>

        <section className="mt-10 grid gap-5">
          {visibleConversations.length ? (visibleConversations.map((conversation) => (<Link key={conversation.id} href={`/restaurante/mensagens/${conversation.id}`} className="grid gap-5 rounded-[8px] bg-app-chantilly p-5 shadow-sm ring-1 ring-app-baunilha-dourada/40 transition hover:-translate-y-0.5 hover:bg-app-creme-leve sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:p-7">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-[8px] bg-app-creme-suave text-lg font-bold text-app-mocha ring-1 ring-app-baunilha-dourada">
                  {conversation.initials}
                  {conversation.online ? (<span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-app-chantilly bg-emerald-500"/>) : null}
                </span>
                <span>
                  <span className="flex flex-wrap items-center gap-4">
                    <strong className="text-2xl font-semibold text-app-cafe-profundo">
                      {conversation.customer}
                    </strong>
                    <StatusBadge status={conversation.status}/>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-app-cinza">
                    &quot;{conversation.preview}&quot;
                  </span>
                </span>
                <span className="flex items-center justify-between gap-5 text-sm font-semibold text-app-cinza sm:block sm:text-right">
                  <span className={conversation.unread
                ? "text-app-caramelo-torrado"
                : "text-app-cinza"}>
                    {conversation.time}
                  </span>
                  {conversation.unread ? (<span className="mt-2 block h-2.5 w-2.5 rounded-full bg-app-caramelo-torrado sm:ml-auto"/>) : (<span className="mt-2 block text-app-baunilha-dourada">
                      <Icon type="chevron-right" className="h-5 w-5"/>
                    </span>)}
                </span>
              </Link>))) : (<div className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] bg-app-chantilly px-6 text-center shadow-sm ring-1 ring-app-baunilha-dourada/45">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
                <Icon type="message"/>
              </span>
              <h2 className="mt-5 text-xl font-semibold text-app-cafe-profundo">
                Nenhuma conversa recebida
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">
                Quando o backend estiver conectado, as interacoes reais com
                clientes aparecerao aqui por prioridade e status.
              </p>
            </div>)}
        </section>

        <button type="button" className="fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-[8px] bg-app-areia-quente text-app-cafe-profundo shadow-lg transition hover:-translate-y-0.5 hover:bg-app-dourado-mel hover:text-white" aria-label="Nova conversa">
          <Icon type="plus" className="h-8 w-8"/>
        </button>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
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
    </main>);
}
