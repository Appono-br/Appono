"use client";
import Image from "next/image";
import Link from "next/link";
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
const financeCards = [
    { label: "Vendas brutas" },
    { label: "Ticket medio" },
    { label: "A receber" },
];
const tableHeaders = ["Periodo", "Status", "Valor bruto", "Liquido"];
const feeItems = ["Plano Marketplace", "Processamento", "Logistica"];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
        download: "M12 3v12M7 10l5 5 5-5M5 21h14",
        menu: "M4 7h16M4 12h16M4 17h16",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function FinanceCard({ label, featured = false, }) {
    return (<article className={`min-h-48 rounded-[8px] p-7 shadow-sm ${featured
            ? "bg-app-cafe-profundo text-app-creme-leve"
            : "bg-app-chantilly text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/45"}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${featured ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>
        {label}
      </p>
      <strong className="mt-8 block text-4xl font-medium">--</strong>
      <div className={`mt-8 h-2 max-w-56 rounded-full ${featured ? "bg-app-mocha" : "bg-app-baunilha-dourada/45"}`}>
        <div className="h-2 w-0 rounded-full bg-app-caramelo-torrado"/>
      </div>
    </article>);
}
function EmptyTable() {
    return (<div className="overflow-hidden rounded-[8px] bg-app-chantilly shadow-sm ring-1 ring-app-baunilha-dourada/45">
      <div className="grid grid-cols-4 gap-4 bg-app-creme-suave px-6 py-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha">
        {tableHeaders.map((header) => (<span key={header}>{header}</span>))}
      </div>
      <div className="flex min-h-56 flex-col justify-center border-t border-app-baunilha-dourada/45 px-6 py-10">
        <h3 className="text-xl font-semibold text-app-cafe-profundo">
          Nenhum repasse registrado
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
          Os ciclos financeiros aparecerao nesta tabela.
        </p>
      </div>
    </div>);
}
export default function RestaurantFinancialReportPage() {
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
            {navItems.map((item, index) => (<Link key={item.label} href={item.href} className={index === 4
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-finance-menu">
            <Icon type="menu"/>
          </button>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-finance-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item, index) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={index === 4
                    ? "text-app-cafe-profundo"
                    : "transition hover:text-app-cafe-profundo"}>
                  {item.label}
                </Link>))}
            </div>
          </nav>) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
              Financeiro
            </p>
            <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
              Relatorio Financeiro
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
              Veja a performance, os repasses e a saude financeira da operacao.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-app-creme-suave px-5 text-sm font-semibold text-app-mocha transition hover:bg-app-baunilha-dourada">
              <Icon type="calendar" className="h-5 w-5"/>
              Periodo
            </button>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado">
              <Icon type="download" className="h-4 w-4"/>
              Exportar PDF
            </button>
          </div>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_0.7fr_0.7fr]">
          {financeCards.map((card, index) => (<FinanceCard key={card.label} label={card.label} featured={index === 0}/>))}
        </section>

        <section className="mt-10">
          <div className="mb-6 flex justify-center gap-8 text-xs font-bold uppercase tracking-[0.14em] text-app-cinza">
            <button type="button" className="text-app-caramelo-torrado">
              Todos
            </button>
            <button type="button">Concluidos</button>
            <button type="button">Pendentes</button>
          </div>
          <EmptyTable />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
              Detalhamento de taxas
            </p>
            <div className="mt-6 grid gap-5">
              {feeItems.map((item) => (<div key={item} className="flex items-center justify-between gap-5 text-sm">
                  <span className="text-app-mocha">{item}</span>
                  <strong className="text-app-cafe-profundo">--</strong>
                </div>))}
            </div>
          </article>

          <article className="rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <h2 className="text-2xl font-medium italic text-app-cafe-profundo">
              Crescimento Mensal
            </h2>
            <div className="mt-8 flex min-h-44 items-end gap-4 rounded-[8px] border border-dashed border-app-caramelo-torrado/25 bg-app-creme-leve px-5 py-6">
              {Array.from({ length: 5 }).map((_, index) => (<div key={index} className="h-16 flex-1 rounded-t-[8px] bg-app-baunilha-dourada/45"/>))}
            </div>
            <p className="mt-5 text-sm leading-6 text-app-cinza">
              O crescimento mensal aparecera neste painel.
            </p>
          </article>
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
