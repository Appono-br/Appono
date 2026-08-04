"use client";
import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
    calcularTempoMedioPreparo,
    calcularTicketMedio,
    formatarMoedaResumo,
    montarSerieReservas,
    obterPedidosAtivos,
    obterPedidosDasReservas,
    obterPedidosEntregues,
    obterPedidosNoPeriodo,
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

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        menu: "M4 7h16M4 12h16M4 17h16",
        chart: "M4 19V5M8 17v-6M13 17V7M18 17v-9M4 19h17",
        clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        receipt: "M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3z M9 8h6M9 12h6M9 16h4",
    };
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function MetricCard({ label, value, helper }) {
    return (
        <article className="rounded-[8px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-cinza">{label}</p>
            <strong className="mt-4 block text-3xl font-medium text-app-cafe-profundo">{value}</strong>
            {helper ? <p className="mt-2 text-sm leading-6 text-app-mocha">{helper}</p> : null}
        </article>
    );
}

function EmptyPanel({ title, description }) {
    return (
        <div className="rounded-[8px] border border-dashed border-app-caramelo-torrado/30 bg-app-chantilly px-5 py-6">
            <h3 className="text-lg font-semibold text-app-cafe-profundo">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">{description}</p>
        </div>
    );
}

function obterProdutosMaisPedidos(pedidos) {
    const produtos = new Map();
    pedidos.forEach((pedido) => {
        (pedido.itens_pedido ?? []).forEach((item) => {
            const nome = item.produtos?.nome ?? "Item";
            const atual = produtos.get(nome) ?? { nome, quantidade: 0, valor: 0 };
            atual.quantidade += Number(item.quantidade ?? 0);
            atual.valor += Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);
            produtos.set(nome, atual);
        });
    });
    return Array.from(produtos.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
}

function obterHorariosMaisReservados(reservas) {
    const horarios = new Map();
    reservas.forEach((reserva) => {
        const horario = String(reserva.horario_inicio ?? "").slice(0, 5) || "Sem horario";
        horarios.set(horario, (horarios.get(horario) ?? 0) + 1);
    });
    return Array.from(horarios.entries())
        .map(([horario, quantidade]) => ({ horario, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
}

export default function RestaurantPerformancePage() {
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

    const dados = useMemo(() => {
        const todosPedidos = [...obterPedidosDasReservas(reservas), ...historicoPedidos];
        const pedidos30Dias = obterPedidosNoPeriodo(todosPedidos, 30);
        const reservas30Dias = obterReservasNoPeriodo(reservas, 30);
        const pedidosEntregues = obterPedidosEntregues(pedidos30Dias);
        return {
            todosPedidos,
            pedidos30Dias,
            reservas30Dias,
            pedidosEntregues,
            pedidosAtivos: obterPedidosAtivos(todosPedidos),
            tempoMedioPreparo: calcularTempoMedioPreparo(pedidos30Dias),
            produtosMaisPedidos: obterProdutosMaisPedidos(pedidosEntregues),
            horariosMaisReservados: obterHorariosMaisReservados(reservas30Dias),
            serieReservas: montarSerieReservas(reservas, 7),
        };
    }, [historicoPedidos, reservas]);
    const maiorValorSerie = Math.max(...dados.serieReservas.map((ponto) => ponto.valor), 1);

    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    if (sessao?.type !== "restaurant") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
                    <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority />
                    <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">Esta area e destinada a contas de restaurante.</p>
                    <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
                        Entrar
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
                    <div aria-label="Appono">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
                    </div>
                    <nav className="hidden items-center justify-self-center gap-6 text-xs font-semibold text-app-cinza xl:flex">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={item.href === "/restaurante/desempenho" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
                        <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
                        <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-performance-menu">
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>
                {mobileMenuOpen ? (
                    <nav id="restaurant-performance-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => (
                                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/desempenho" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
                <div className="border-t border-app-baunilha-dourada/60 pt-10">
                    <p className="text-[10px] font-bold uppercase text-app-caramelo-torrado">Desempenho</p>
                    <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
                        Indicadores do restaurante
                    </h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
                        Dados reais dos ultimos 30 dias, usando reservas, pedidos e pagamentos confirmados.
                    </p>
                </div>

                <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Reservas no periodo" value={dados.reservas30Dias.length} helper="Reservas ativas dos ultimos 30 dias." />
                    <MetricCard label="Pedidos entregues" value={dados.pedidosEntregues.length} helper="Pedidos concluidos dentro do periodo." />
                    <MetricCard label="Receita valida" value={formatarMoedaResumo(financeiro?.resumo?.valor_bruto ?? 0)} helper="Pagamentos aprovados, sem cancelados." />
                    <MetricCard label="Ticket medio" value={formatarMoedaResumo(calcularTicketMedio(dados.pedidos30Dias))} helper="Media dos pedidos validos." />
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.42fr]">
                    <article className="rounded-[8px] bg-app-chantilly p-5 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-medium text-app-cafe-profundo">Reservas recentes</h2>
                                <p className="mt-2 text-sm text-app-cinza">Volume por dia nos ultimos 7 dias.</p>
                            </div>
                            <Icon type="chart" className="h-6 w-6 text-app-caramelo-torrado" />
                        </div>
                        <div className="mt-8 flex min-h-[220px] items-end gap-3 rounded-[8px] bg-app-creme-leve px-4 py-5">
                            {dados.serieReservas.map((ponto) => (
                                <div key={ponto.data} className="flex flex-1 flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-app-cafe-profundo">{ponto.valor}</span>
                                    <div className="w-full rounded-t-[8px] bg-app-caramelo-torrado" style={{ height: `${Math.max(12, (ponto.valor / maiorValorSerie) * 170)}px` }} />
                                    <span className="text-[10px] font-semibold text-app-cinza">{ponto.label}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-[8px] bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm sm:p-6">
                        <h2 className="text-2xl font-medium">Operacao atual</h2>
                        <div className="mt-8 grid gap-4">
                            <div className="rounded-[10px] bg-app-cacau-intenso/55 p-4">
                                <p className="text-xs font-bold uppercase text-app-baunilha-dourada">Pedidos ativos</p>
                                <strong className="mt-2 block text-3xl">{dados.pedidosAtivos.length}</strong>
                            </div>
                            <div className="rounded-[10px] bg-app-cacau-intenso/55 p-4">
                                <p className="text-xs font-bold uppercase text-app-baunilha-dourada">Tempo medio estimado</p>
                                <strong className="mt-2 block text-3xl">{dados.tempoMedioPreparo ? `${dados.tempoMedioPreparo} min` : "--"}</strong>
                            </div>
                        </div>
                    </article>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                    <article className="rounded-[8px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-6">
                        <div className="flex items-center gap-2">
                            <Icon type="receipt" className="h-5 w-5 text-app-caramelo-torrado" />
                            <h2 className="text-2xl font-medium text-app-cafe-profundo">Produtos mais pedidos</h2>
                        </div>
                        <div className="mt-6 grid gap-3">
                            {dados.produtosMaisPedidos.length ? dados.produtosMaisPedidos.map((produto, index) => (
                                <div key={produto.nome} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] bg-app-chantilly p-4">
                                    <span className="text-xs font-bold text-app-caramelo-torrado">#{index + 1}</span>
                                    <span className="font-semibold text-app-cafe-profundo">{produto.nome}</span>
                                    <span className="text-sm font-bold text-app-mocha">{produto.quantidade} un.</span>
                                </div>
                            )) : (
                                <EmptyPanel title="Sem produtos suficientes" description="Quando houver pedidos entregues, os itens mais vendidos aparecerao aqui." />
                            )}
                        </div>
                    </article>

                    <article className="rounded-[8px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-6">
                        <div className="flex items-center gap-2">
                            <Icon type="clock" className="h-5 w-5 text-app-caramelo-torrado" />
                            <h2 className="text-2xl font-medium text-app-cafe-profundo">Horarios mais reservados</h2>
                        </div>
                        <div className="mt-6 grid gap-3">
                            {dados.horariosMaisReservados.length ? dados.horariosMaisReservados.map((item) => (
                                <div key={item.horario} className="flex items-center justify-between gap-4 rounded-[10px] bg-app-chantilly p-4">
                                    <span className="font-semibold text-app-cafe-profundo">{item.horario}</span>
                                    <span className="text-sm font-bold text-app-mocha">{item.quantidade} reservas</span>
                                </div>
                            )) : (
                                <EmptyPanel title="Sem reservas no periodo" description="Os horarios de maior movimento aparecerao conforme novas reservas forem criadas." />
                            )}
                        </div>
                    </article>
                </section>
            </section>
        </main>
    );
}
