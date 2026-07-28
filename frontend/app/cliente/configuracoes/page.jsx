"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useState } from "react";
import { SeletorTema } from "@/components/configuracoes/seletor-tema";
import { encerrarSessao } from "@/lib/session";
const navItems = [
    { label: "Início", href: "/cliente/dashboard" },
    { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
    { label: "Reservas", href: "/cliente/reservas" },
    { label: "Mensagens", href: "/cliente/mensagens" },
    { label: "Configurações", href: "/cliente/configuracoes" },
];
const settingsItems = [
    {
        title: "Conta",
        description: "Atualize suas informações pessoais e foto de perfil",
        href: "/cliente/configuracoes/conta",
        icon: "user",
    },
    {
        title: "Pagamentos",
        description: "Gerencie formas de pagamento e dados de cobrança",
        href: "/cliente/configuracoes/pagamentos",
        icon: "card",
    },
    {
        title: "Idioma",
        description: "Escolha o idioma de uso da plataforma",
        href: "#",
        icon: "language",
    },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        card: "M4 7h16v10H4V7z M4 10h16M8 14h3",
        "chevron-right": "m9 18 6-6-6-6",
        edit: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z M13.5 7.5l3 3",
        language: "M5 5h8M9 3v2M7 17l4-10M5 17h8M15 19l2.5-6 2.5 6M16 17h3",
        "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
        menu: "M4 7h16M4 12h16M4 17h16",
        user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
export default function SettingsPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = window.localStorage.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    async function logout() {
        await encerrarSessao();
        window.location.assign("/");
    }
    const profileName = session?.name || "Perfil não identificado";
    const profileType = session?.type === "restaurant"
        ? "Conta de restaurante"
        : session?.type === "client"
            ? "Conta de cliente"
            : "Acesse sua conta para completar o perfil";
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div className="shrink-0" aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority/>
          </div>

          <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 4
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/cliente/notificacoes" />
            <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
              <Icon type="bag"/>
            </button>
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="settings-mobile-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="settings-mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 4
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:py-14">
        <div className="border-t border-app-baunilha-dourada/60 pt-10">
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
            Preferências e segurança
          </p>
          <h1 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
            Configurações
          </h1>
        </div>

        <section className="mt-8 rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[8px] bg-app-cafe-profundo text-app-creme-leve ring-4 ring-app-chantilly">
                <Icon type="user" className="h-9 w-9"/>
                <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-app-caramelo-torrado text-app-chantilly ring-4 ring-app-creme-leve">
                  <Icon type="edit" className="h-4 w-4"/>
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-medium text-app-cafe-profundo sm:text-3xl">
                  {profileName}
                </h2>
                <p className="mt-1 text-sm text-app-mocha">{profileType}</p>
              </div>
            </div>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-[8px] text-app-cinza transition hover:bg-app-baunilha-dourada hover:text-app-cafe-profundo" aria-label="Abrir perfil">
              <Icon type="chevron-right"/>
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-5">
          {settingsItems.map((item) => (<Link key={item.title} href={item.href} className="grid rounded-[8px] bg-app-chantilly p-6 text-left shadow-sm ring-1 ring-app-baunilha-dourada/45 transition hover:-translate-y-0.5 hover:bg-app-creme-leve sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6 sm:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                <Icon type={item.icon}/>
              </span>
              <span className="mt-4 sm:mt-0">
                <strong className="block text-xl text-app-cafe-profundo">
                  {item.title}
                </strong>
                <span className="mt-2 block text-sm leading-6 text-app-cinza">
                  {item.description}
                </span>
              </span>
              <Icon type="chevron-right" className="mt-4 h-5 w-5 text-app-baunilha-dourada sm:mt-0"/>
            </Link>))}
        </section>

        <SeletorTema />

        <div className="mx-auto mt-7 max-w-md border-t border-app-baunilha-dourada/60 pt-5 text-center">
          <button type="button" onClick={logout} className="inline-flex items-center gap-3 text-sm font-bold text-app-vermelho-erro transition hover:text-app-cafe-profundo">
            <Icon type="log-out"/>
            Sair da conta
          </button>
        </div>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
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
    </main>);
}
