"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useState } from "react";
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
const scoreCategories = [
    "Qualidade da comida",
    "Servico & atendimento",
    "Ambiente & clima",
    "Custo-beneficio",
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        alert: "M12 9v5M12 18h.01M10.3 3.9 2.1 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
        menu: "M4 7h16M4 12h16M4 17h16",
        smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
        star: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function EmptyPanel({ title, description, tone = "light", }) {
    return (<div className={`rounded-[8px] border border-dashed border-app-caramelo-torrado/30 px-6 py-8 ${tone === "warm" ? "bg-app-creme-suave" : "bg-app-chantilly"}`}>
      <h3 className="text-lg font-semibold text-app-cafe-profundo">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
        {description}
      </p>
    </div>);
}
function ScoreCategory({ label }) {
    return (<article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
        {label}
      </p>
      <strong className="mt-5 block text-3xl font-medium text-app-cafe-profundo">
        --
      </strong>
      <div className="mt-5 h-2 rounded-full bg-app-baunilha-dourada/45">
        <div className="h-2 w-0 rounded-full bg-app-caramelo-torrado"/>
      </div>
    </article>);
}
export default function RestaurantPerformancePage() {
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = window.localStorage.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isRestaurant = session?.type === "restaurant";
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
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 3
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-performance-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-performance-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 3
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="border-t border-app-baunilha-dourada/60 pt-10">
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
            Avaliacoes
          </p>
          <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Desempenho & Avaliacoes
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
            Acompanhe a experiencia dos clientes e os principais indicadores de
            atendimento.
          </p>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.42fr_1fr]">
          <article className="rounded-[8px] bg-app-chantilly p-7 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
              Media geral
            </p>
            <div className="mt-8 flex items-end gap-3">
              <strong className="text-6xl font-medium leading-none text-app-cafe-profundo">
                --
              </strong>
              <span className="pb-2 text-2xl text-app-mocha">/ 5.0</span>
            </div>
            <div className="mt-6 flex gap-1 text-app-caramelo-torrado">
              {Array.from({ length: 5 }).map((_, index) => (<Icon key={index} type="star" className="h-6 w-6"/>))}
            </div>
            <div className="mt-10 rounded-[8px] bg-app-creme-leve p-5">
              <p className="text-sm text-app-cinza">
                A media geral aparecera neste painel.
              </p>
            </div>
          </article>

          <article className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
                Volume de avaliacoes
              </p>
              <div className="flex gap-4 text-sm font-semibold text-app-cinza">
                <button type="button" className="text-app-caramelo-torrado">
                  Mensal
                </button>
                <button type="button">Semanal</button>
              </div>
            </div>

            <div className="mt-10 flex min-h-[280px] items-end gap-3 rounded-[8px] border border-dashed border-app-caramelo-torrado/25 bg-app-creme-leve px-5 py-6 sm:gap-5">
              {Array.from({ length: 6 }).map((_, index) => (<div key={index} className="h-20 flex-1 rounded-t-[8px] bg-app-baunilha-dourada/45"/>))}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <h2 className="text-2xl font-medium text-app-cafe-profundo">
            O que dizem os frequentadores
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <section>
              <div className="flex items-center gap-2 text-sm font-bold uppercase text-app-cafe-profundo">
                <Icon type="smile" className="h-5 w-5 text-green-700"/>
                Destaques positivos
              </div>
              <div className="mt-5">
                <EmptyPanel title="Nenhum destaque registrado" description="Os principais elogios aparecerao aqui."/>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 text-sm font-bold uppercase text-app-cafe-profundo">
                <Icon type="alert" className="h-5 w-5 text-app-caramelo-torrado"/>
                Pontos de atencao
              </div>
              <div className="mt-5">
                <EmptyPanel title="Nenhum ponto de atencao" description="Observacoes importantes aparecerao aqui."/>
              </div>
            </section>
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {scoreCategories.map((category) => (<ScoreCategory key={category} label={category}/>))}
        </section>
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
