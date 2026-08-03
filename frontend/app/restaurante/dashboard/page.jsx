"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Cozinha", href: "/restaurante/pedidos" },
    { label: "Historico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];
const overviewMetrics = [
    { label: "Pedidos hoje", icon: "orders" },
    { label: "Mesas reservadas", icon: "seat", highlighted: true },
    { label: "Ticket medio", icon: "money" },
    { label: "Novos clientes", icon: "user" },
];
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-right": "M5 12h14M13 6l6 6-6 6",
        menu: "M4 7h16M4 12h16M4 17h16",
        money: "M4 7h16v10H4V7z M7 10h.01M17 14h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
        orders: "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
        seat: "M7 13V7a4 4 0 0 1 8 0v6M5 13h14v5H5v-5z M8 18v3M16 18v3",
        user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M19 8v6M22 11h-6",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function MetricCard({ metric }) {
    return (<article className={`min-h-44 rounded-[8px] p-7 shadow-sm ring-1 ring-app-baunilha-dourada/45 ${metric.highlighted ? "bg-app-creme-suave" : "bg-app-chantilly"}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">
          {metric.label}
        </p>
        <Icon type={metric.icon} className="h-6 w-6 text-app-caramelo-torrado"/>
      </div>

      <strong className="mt-12 block text-4xl font-medium text-app-cafe-profundo">
        {metric.value ?? "--"}
      </strong>

      {metric.helper ? (<p className="mt-2 text-sm text-app-mocha">{metric.helper}</p>) : (<div className="mt-4 h-2 w-full max-w-48 rounded-full bg-app-baunilha-dourada/45">
          <div className="h-2 w-0 rounded-full bg-app-caramelo-torrado"/>
        </div>)}
    </article>);
}
function EmptyPanel({ title, description, dark = false, }) {
    return (<div className={`flex min-h-52 flex-col justify-center rounded-[8px] border border-dashed px-6 py-8 ${dark
            ? "border-app-baunilha-dourada/25 bg-app-cafe-profundo text-app-creme-leve"
            : "border-app-caramelo-torrado/30 bg-app-creme-leve text-app-cafe-profundo"}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className={`mt-3 max-w-md text-sm leading-6 ${dark ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>
        {description}
      </p>
    </div>);
}
function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}
function obterStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Pendente",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };
    return statusMap[status] ?? status;
}
export default function RestaurantDashboardPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reservas, setReservas] = useState([]);
    useEffect(() => {
        if (sessao?.type !== "restaurant") {
            return;
        }
        apiRequest("/reservas")
            .then(setReservas)
            .catch(() => setReservas([]));
    }, [sessao?.type]);
    const proximosPedidos = useMemo(() => reservas
        .flatMap((reserva) => (reserva.pedidos ?? [])
        .filter((pedido) => ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"].includes(pedido.status_pedido))
        .map((pedido) => ({ ...pedido, reserva })))
        .slice(0, 3), [reservas]);
    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    if (sessao?.type !== "restaurant") {
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
            {navItems.map((item) => (<Link key={item.label} href={item.href} className={item.href === "/restaurante/dashboard"
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-dashboard-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-dashboard-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/dashboard"
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
            Painel administrativo
          </p>
          <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Visao Geral do Restaurante
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
            Acompanhe o desempenho da cozinha, do salao e das reservas do dia.
          </p>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {overviewMetrics.map((metric) => (<MetricCard key={metric.label} metric={metric}/>))}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.52fr]">
          <article className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-medium text-app-cafe-profundo">
                  Performance Mensal
                </h2>
                <p className="mt-2 text-sm text-app-cinza">
                  Volume de vendas e reservas dos ultimos 30 dias.
                </p>
              </div>
              <div className="flex gap-4 text-xs font-semibold text-app-mocha">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-app-cafe-profundo"/>
                  Receita
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-app-caramelo-torrado"/>
                  Reservas
                </span>
              </div>
            </div>

            <div className="mt-10 flex min-h-[280px] items-end gap-3 rounded-[8px] border border-dashed border-app-caramelo-torrado/25 bg-app-creme-leve px-5 py-6 sm:gap-5">
              {Array.from({ length: 7 }).map((_, index) => (<div key={index} className="h-20 flex-1 rounded-t-[8px] bg-app-baunilha-dourada/45"/>))}
            </div>
          </article>

          <article className="rounded-[8px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm sm:p-8">
            <h2 className="text-2xl font-medium">Cozinha</h2>
            <div className="mt-8 grid gap-3">
              {proximosPedidos.length ? proximosPedidos.map((pedido) => (<div key={pedido.id_pedido} className="rounded-[10px] bg-app-cacau-intenso/55 p-4 ring-1 ring-app-baunilha-dourada/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-app-baunilha-dourada">
                          {pedido.reserva.data_reserva} - {pedido.reserva.horario_inicio}
                        </p>
                        <h3 className="mt-2 text-sm font-semibold text-app-creme-leve">
                          {pedido.reserva.clientes?.nome ?? "Cliente"}
                        </h3>
                      </div>
                      <span className="rounded-full bg-app-baunilha-dourada px-3 py-1 text-[11px] font-bold text-app-cafe-profundo">
                        {obterStatusPedido(pedido.status_pedido)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-app-creme-suave">
                      {formatarMoeda(pedido.valor_total)}
                    </p>
                    <p className="mt-1 text-xs text-app-baunilha-dourada">
                      {(pedido.itens_pedido ?? []).slice(0, 2).map((item) => `${item.quantidade}x ${item.produtos?.nome ?? "Item"}`).join(" | ")}
                    </p>
                  </div>)) : (<EmptyPanel dark title="Nenhum pedido antecipado" description="Quando o cliente pedir antes da reserva, o pedido aparecera aqui."/>)} 
            </div>
            <Link href="/restaurante/reservas" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-app-baunilha-dourada transition hover:text-app-chantilly">
              Ver reservas completas
              <Icon type="arrow-right" className="h-4 w-4"/>
            </Link>
          </article>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1fr]">
          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
              Destaque do cardapio
            </p>
            <div className="mt-5">
              <EmptyPanel title="Nenhum item em destaque" description="Selecione um item para destacar no cardapio."/>
            </div>
          </article>

          <article className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
            <h2 className="text-2xl font-medium text-app-cafe-profundo">
              Eficiencia da Cozinha
            </h2>
            <div className="mt-8 grid gap-6">
              {["Tempo medio de preparo", "Satisfacao do cliente"].map((label) => (<div key={label}>
                    <div className="flex items-center justify-between gap-4 text-sm text-app-cinza">
                      <span>{label}</span>
                      <span className="font-bold text-app-cafe-profundo">--</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-app-baunilha-dourada/45">
                      <div className="h-2 w-0 rounded-full bg-app-caramelo-torrado"/>
                    </div>
                  </div>))}
            </div>
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
