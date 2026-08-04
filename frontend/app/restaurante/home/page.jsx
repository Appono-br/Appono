"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
    calcularItensVendidos,
    calcularTicketMedio,
    formatarMoedaResumo,
    obterClientesUnicos,
    obterPedidosDasReservas,
    obterPedidosNoPeriodo,
    obterReservasHoje,
    obterReservasNoPeriodo,
} from "@/lib/restaurante-metricas";
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
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "chevron-right": "m9 18 6-6-6-6",
        menu: "M4 7h16M4 12h16M4 17h16",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function MetricValue({ metric }) {
    return (<div>
      <div className="flex items-end gap-3">
        <strong className="text-3xl font-medium leading-none text-app-cafe-profundo sm:text-4xl">
          {metric.value ?? "--"}
        </strong>
        {metric.suffix ? (<span className="pb-2 text-sm font-bold text-green-700">
            {metric.suffix}
          </span>) : null}
        {metric.status ? (<span className="pb-2 text-sm font-bold text-app-mocha">
            {metric.status}
          </span>) : null}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
        {metric.label}
      </p>
    </div>);
}
function PerformanceCard({ metric, index }) {
    return (<article className={`rounded-[8px] bg-app-creme-leve px-5 py-5 shadow-sm ring-1 ring-app-baunilha-dourada/60 transition hover:-translate-y-0.5 hover:bg-app-chantilly ${index % 2 === 0
            ? "border-l-4 border-app-caramelo-torrado"
            : "border-l-4 border-app-cinza/35"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">
        {metric.label}
      </p>
      <div className="mt-5">
        <MetricValue metric={metric}/>
      </div>
    </article>);
}
export default function RestaurantHomePage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [reservas, setReservas] = useState([]);
    const [historicoPedidos, setHistoricoPedidos] = useState([]);
    const [financeiro, setFinanceiro] = useState(null);
    useEffect(() => {
        if (sessao?.type !== "restaurant") {
            return;
        }
        Promise.all([
            apiRequest("/reservas"),
            apiRequest("/pedidos/historico/restaurante"),
            apiRequest("/marketplace/financeiro/resumo?periodo=30d"),
        ])
            .then(([reservasResposta, historicoResposta, financeiroResposta]) => {
            setReservas(reservasResposta ?? []);
            setHistoricoPedidos(historicoResposta ?? []);
            setFinanceiro(financeiroResposta ?? null);
        })
            .catch(() => {
            setReservas([]);
            setHistoricoPedidos([]);
            setFinanceiro(null);
        });
    }, [sessao?.type]);
    const metricas = useMemo(() => {
        const reservasHoje = obterReservasHoje(reservas);
        const reservas30Dias = obterReservasNoPeriodo(reservas, 30);
        const pedidos = [...obterPedidosDasReservas(reservas), ...historicoPedidos];
        const pedidos30Dias = obterPedidosNoPeriodo(pedidos, 30);
        return {
            resumoDiario: [
                { label: "Reservas hoje", value: reservasHoje.length },
                { label: "Pessoas esperadas", value: reservasHoje.reduce((soma, reserva) => soma + Number(reserva.quantidade_pessoas ?? 0), 0) },
            ],
            desempenhoMensal: [
                { label: "Pedidos no periodo", value: pedidos30Dias.length },
                { label: "Ticket medio", value: formatarMoedaResumo(calcularTicketMedio(pedidos30Dias)) },
                { label: "Pedidos pagos", value: financeiro?.resumo?.quantidade_pagamentos ?? 0 },
                { label: "Clientes atendidos", value: obterClientesUnicos(reservas30Dias, pedidos30Dias) },
            ],
            itensVendidos: calcularItensVendidos(pedidos30Dias),
        };
    }, [financeiro, historicoPedidos, reservas]);
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
            {navItems.map((item) => (<Link key={item.label} href={item.href} className={item.href === "/restaurante/home"
                ? "text-app-cafe-profundo"
                : "transition hover:text-app-cafe-profundo"}>
                {item.label}
              </Link>))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-home-menu">
              <Icon type="menu"/>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (<nav id="restaurant-home-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
              {navItems.map((item) => (<Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/home"
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
            Restaurante
          </p>
          <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Bem-vindo (a) de volta!
          </h1>
        </div>

        <section className="mt-8 max-w-4xl rounded-[8px] bg-app-creme-leve px-5 py-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:px-6">
          <h2 className="text-2xl font-medium text-app-cafe-profundo">
            Resumo Diario
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {metricas.resumoDiario.map((metric) => (<MetricValue key={metric.label} metric={metric}/>))}
          </div>

          <Link href="/restaurante/reservas" className="mt-8 inline-flex items-center gap-1 text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
            Gerenciar reservas
            <Icon type="chevron-right" className="h-4 w-4"/>
          </Link>
        </section>

        <section className="mt-12">
          <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">
            Operacao
          </p>
          <h2 className="mt-2 text-4xl font-medium text-app-cafe-profundo sm:text-5xl">
            Desempenho Mensal
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricas.desempenhoMensal.map((metric, index) => (<PerformanceCard key={metric.label} metric={metric} index={index}/>))}
          </div>
          <p className="mt-5 text-sm font-semibold text-app-mocha">
            {metricas.itensVendidos} itens vendidos em pedidos validos no periodo.
          </p>
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
