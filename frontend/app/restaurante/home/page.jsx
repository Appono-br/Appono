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

const heroImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80";

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

function Icon({ type, className = "h-5 w-5" }) {
  const paths = {
    "chevron-right": "m9 18 6-6-6-6",
    menu: "M4 7h16M4 12h16M4 17h16",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    tag: "M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83zM7 7h.01",
    receipt: "M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 1V2z M8 7h8M8 11h8M8 15h5",
    card: "M2 7h20v14H2V7z M2 11h20 M6 15h4",
    fork: "M3 2v20 M3 2c0 4 0 6 3 6s3-2 3-6 M9 2v20 M15 2c-3 3-3 15 0 20 M21 2c-3 2-3 5-3 8h6c0-3 0-6-3-8z",
    trending: "M23 6 13.5 15.5 8.5 10.5 1 18 M17 6h6v6",
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
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
      reservasHoje: reservasHoje.length,
      pessoasEsperadas: reservasHoje.reduce((soma, reserva) => soma + Number(reserva.quantidade_pessoas ?? 0), 0),
      pedidosPeriodo: pedidos30Dias.length,
      ticketMedio: formatarMoedaResumo(calcularTicketMedio(pedidos30Dias)),
      pedidosPagos: financeiro?.resumo?.quantidade_pagamentos ?? 0,
      clientesAtendidos: obterClientesUnicos(reservas30Dias, pedidos30Dias),
      itensVendidos: calcularItensVendidos(pedidos30Dias),
    };
  }, [financeiro, historicoPedidos, reservas]);

  if (!sessaoCarregada) {
    return <TelaCarregandoSessao />;
  }

  if (sessao?.type !== "restaurant") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-2xl border border-app-baunilha-dourada bg-app-creme-leve p-8 text-center shadow-sm">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/95 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
          </div>

          <nav className="hidden items-center justify-self-center gap-1 text-sm font-semibold text-app-cinza xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  item.href === "/restaurante/home"
                    ? "rounded-full bg-app-creme-suave px-3 py-1.5 text-app-caramelo-torrado"
                    : "rounded-full px-3 py-1.5 transition hover:bg-app-creme-suave hover:text-app-cafe-profundo"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
            <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-full border border-app-baunilha-dourada bg-white text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-home-menu">
              <Icon type="menu" />
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav id="restaurant-home-menu" className="border-t border-app-baunilha-dourada/55 bg-white px-5 py-3 xl:hidden">
            <div className="mx-auto grid max-w-7xl gap-1 text-sm font-semibold text-app-cinza">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    item.href === "/restaurante/home"
                      ? "rounded-full bg-app-creme-suave px-3 py-2 text-app-caramelo-torrado"
                      : "rounded-full px-3 py-2 transition hover:bg-app-creme-suave hover:text-app-cafe-profundo"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:py-12">
       
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-app-cafe-profundo sm:text-5xl">
              Bem-vindo (a) de volta!
            </h1>
          </div>
          <Link href="/restaurante/reservas" className="inline-flex items-center gap-2 self-start rounded-full bg-app-cafe-profundo px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado sm:self-auto">
            Gerenciar reservas
            <Icon type="chevron-right" className="h-4 w-4" />
          </Link>
        </div>

        
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:grid-rows-2">
          
          <div className="relative overflow-hidden rounded-3xl bg-app-cafe-profundo p-6 text-white shadow-lg sm:col-span-2 xl:row-span-2">
            <Image
              src={heroImage}
              alt=""
              fill
              sizes="50vw"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-app-cafe-profundo via-app-cafe-profundo/70 to-transparent" />
            <div className="relative z-10 flex h-full min-h-[220px] flex-col justify-between">
              <div className="flex items-center gap-2">
                <Icon type="calendar" className="h-5 w-5 text-app-baunilha-dourada" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">
                  Hoje
                </p>
              </div>
              <div>
                <div className="flex items-end gap-6">
                  <div>
                    <strong className="text-5xl font-semibold leading-none">{metricas.reservasHoje}</strong>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-app-creme-suave">
                      Reservas hoje
                    </p>
                  </div>
                  <div>
                    <strong className="text-5xl font-semibold leading-none">{metricas.pessoasEsperadas}</strong>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-app-creme-suave">
                      Pessoas esperadas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

         
<div className="flex flex-col justify-between rounded-3xl border border-app-baunilha-dourada/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md xl:col-span-2">
  <div className="flex items-center justify-between">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-cinza">
      Ultimos 30 dias
    </p>
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-creme-suave text-app-caramelo-torrado">
      <Icon type="trending" className="h-5 w-5" />
    </div>
  </div>
  <div className="mt-4">
    <strong className="text-4xl font-semibold leading-none text-app-cafe-profundo">
      {metricas.itensVendidos}
    </strong>
    <p className="mt-2 text-sm text-app-cinza">
      itens vendidos em pedidos validos
    </p>
  </div>
</div>

         
          <div className="rounded-3xl border border-app-baunilha-dourada/60 bg-app-creme-leve p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-app-caramelo-torrado ring-1 ring-app-baunilha-dourada/60">
              <Icon type="tag" className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-app-cinza">
              Ticket medio
            </p>
            <strong className="mt-1 block text-2xl font-semibold text-app-cafe-profundo">
              {metricas.ticketMedio}
            </strong>
          </div>

          
          <div className="rounded-3xl border border-app-baunilha-dourada/60 bg-app-creme-leve p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-app-caramelo-torrado ring-1 ring-app-baunilha-dourada/60">
              <Icon type="users" className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-app-cinza">
              Clientes atendidos
            </p>
            <strong className="mt-1 block text-2xl font-semibold text-app-cafe-profundo">
              {metricas.clientesAtendidos}
            </strong>
          </div>
        </div>

        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-5 rounded-3xl border border-app-baunilha-dourada/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-creme-suave text-app-caramelo-torrado">
              <Icon type="receipt" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-cinza">
                Pedidos no periodo
              </p>
              <strong className="mt-1 block text-3xl font-semibold text-app-cafe-profundo">
                {metricas.pedidosPeriodo}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-3xl border border-app-baunilha-dourada/60 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-creme-suave text-app-caramelo-torrado">
              <Icon type="card" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-cinza">
                Pedidos pagos
              </p>
              <strong className="mt-1 block text-3xl font-semibold text-app-cafe-profundo">
                {metricas.pedidosPagos}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert" />
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
    </main>
  );
}