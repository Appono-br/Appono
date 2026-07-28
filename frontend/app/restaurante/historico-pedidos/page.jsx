"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido, textoStatusRepasse } from "@/lib/formatadores-status";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";

const navItems = [
    { label: "Home", href: "/restaurante/home" },
    { label: "Dashboard", href: "/restaurante/dashboard" },
    { label: "Gestao de cardapio", href: "/restaurante/cardapio" },
    { label: "Desempenho", href: "/restaurante/desempenho" },
    { label: "Relatorio financeiro", href: "/restaurante/financeiro" },
    { label: "Reservas", href: "/restaurante/reservas" },
    { label: "Pedidos", href: "/restaurante/pedidos" },
    { label: "Historico", href: "/restaurante/historico-pedidos" },
    { label: "Mensagens", href: "/restaurante/mensagens" },
    { label: "Configuracoes", href: "/restaurante/configuracoes" },
];

const filtros = [
    { label: "Todos", value: "TODOS" },
    { label: "Entregues", value: "ENTREGUE" },
    { label: "Cancelados", value: "CANCELADO" },
    { label: "Removidos da cozinha", value: "REMOVIDOS" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        menu: "M4 7h16M4 12h16M4 17h16",
        receipt: "M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z",
        search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z",
        calendar: "M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
        money: "M4 7h16v10H4V7z M7 10h.01M17 14h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    };

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
            <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
    );
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor ?? 0));
}

function formatarData(data) {
    if (!data) {
        return "Sem data";
    }

    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function calcularSubtotalItem(item) {
    return Number(item.subtotal ?? 0) || Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);
}

function obterPagamentoPrincipal(pedido) {
    return Array.isArray(pedido.pagamentos) ? pedido.pagamentos[0] : null;
}

function obterClasseStatus(status) {
    if (status === "CANCELADO") {
        return "bg-app-vermelho-erro/10 text-app-vermelho-erro ring-app-vermelho-erro/30";
    }

    if (status === "ENTREGUE") {
        return "bg-app-dourado-mel/15 text-app-cafe-profundo ring-app-dourado-mel/40";
    }

    return "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo";
}

function EmptyPanel() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[16px] bg-app-creme-leve px-6 py-10 text-center ring-1 ring-app-baunilha-dourada/70">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                <Icon type="receipt" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold">Nenhum pedido no historico</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-app-cinza">
                Pedidos entregues, cancelados ou removidos da cozinha aparecem aqui para consulta operacional e financeira.
            </p>
        </div>
    );
}

export default function RestaurantOrderHistoryPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [filtro, setFiltro] = useState("TODOS");
    const [busca, setBusca] = useState("");
    const [mensagem, setMensagem] = useState("Carregando historico de pedidos...");

    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }

        apiRequest("/pedidos/historico/restaurante")
            .then((resposta) => {
                setPedidos(resposta ?? []);
                setMensagem("");
            })
            .catch((erro) => setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar o historico."));
    }, [sessao, sessaoCarregada]);

    const pedidosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return pedidos.filter((pedido) => {
            const passaFiltro = filtro === "TODOS" ||
                pedido.status_pedido === filtro ||
                (filtro === "REMOVIDOS" && pedido.ocultado_cozinha === true);
            const textoBusca = [
                pedido.id_pedido,
                pedido.clientes?.nome,
                pedido.clientes?.telefone,
                pedido.reservas?.data_reserva,
                pedido.status_pedido,
                ...(pedido.itens_pedido ?? []).map((item) => item.produtos?.nome),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return passaFiltro && (!termo || textoBusca.includes(termo));
        });
    }, [busca, filtro, pedidos]);

    const resumo = useMemo(() => {
        return pedidos.reduce((acc, pedido) => {
            const pagamento = obterPagamentoPrincipal(pedido);
            acc.total += 1;
            acc.entregues += pedido.status_pedido === "ENTREGUE" ? 1 : 0;
            acc.cancelados += pedido.status_pedido === "CANCELADO" ? 1 : 0;
            acc.valor += pedido.status_pedido === "CANCELADO" ? 0 : Number(pagamento?.valor_pago ?? pedido.valor_total ?? 0);
            return acc;
        }, { total: 0, entregues: 0, cancelados: 0, valor: 0 });
    }, [pedidos]);

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

                    <nav className="hidden items-center justify-self-center gap-5 text-xs font-semibold text-app-cinza xl:flex">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={item.href === "/restaurante/historico-pedidos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
                        <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
                        <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly text-app-cafe-profundo xl:hidden" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} aria-controls="restaurant-history-menu">
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <nav id="restaurant-history-menu" className="border-t border-app-baunilha-dourada/55 bg-app-creme-leve px-5 py-3 xl:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => (
                                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className={item.href === "/restaurante/historico-pedidos" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
                <div className="grid gap-6 border-t border-app-baunilha-dourada/60 pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Historico operacional</p>
                        <h1 className="mt-2 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">Historico de pedidos</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">
                            Consulte pedidos entregues, cancelados e removidos da fila da cozinha sem perder rastreabilidade.
                        </p>
                    </div>

                    <Link href="/restaurante/pedidos" className="inline-flex h-11 items-center justify-center rounded-[10px] bg-app-cafe-profundo px-5 text-xs font-bold uppercase tracking-[0.14em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                        Voltar para cozinha
                    </Link>
                </div>

                <section className="mt-8 grid gap-4 md:grid-cols-4">
                    {[
                        ["Total no historico", resumo.total],
                        ["Entregues", resumo.entregues],
                        ["Cancelados", resumo.cancelados],
                        ["Valor valido", formatarMoeda(resumo.valor)],
                    ].map(([label, value], index) => (
                        <article key={label} className={`rounded-[14px] p-5 shadow-sm ring-1 ring-app-baunilha-dourada/45 ${index === 3 ? "bg-app-cafe-profundo text-app-creme-leve" : "bg-app-creme-leve text-app-cafe-profundo"}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${index === 3 ? "text-app-baunilha-dourada" : "text-app-cinza"}`}>{label}</p>
                            <strong className="mt-4 block text-3xl font-semibold">{value}</strong>
                        </article>
                    ))}
                </section>

                <section className="mt-8 rounded-[16px] bg-app-creme-leve p-5 ring-1 ring-app-baunilha-dourada/65">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                        <label className="flex h-11 items-center gap-3 rounded-[10px] bg-app-chantilly px-4 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/60">
                            <Icon type="search" className="h-4 w-4" />
                            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por cliente, pedido, data ou item..." className="h-full min-w-0 flex-1 bg-transparent text-app-cafe-profundo outline-none placeholder:text-app-cinza/60" />
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {filtros.map((item) => (
                                <button key={item.value} type="button" onClick={() => setFiltro(item.value)} className={`h-10 rounded-[8px] border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition ${filtro === item.value ? "border-app-caramelo-torrado bg-app-caramelo-torrado text-app-chantilly" : "border-app-baunilha-dourada bg-app-creme-leve text-app-mocha hover:border-app-caramelo-torrado hover:bg-app-baunilha-dourada"}`}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {mensagem ? <p className="mt-6 text-sm font-semibold text-app-caramelo-torrado">{mensagem}</p> : null}

                <section className="mt-8">
                    {pedidosFiltrados.length ? (
                        <div className="grid gap-5">
                            {pedidosFiltrados.map((pedido) => {
                                const pagamento = obterPagamentoPrincipal(pedido);
                                const totalItens = (pedido.itens_pedido ?? []).reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
                                return (
                                    <article key={pedido.id_pedido} className="overflow-hidden rounded-[18px] bg-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/70">
                                        <div className="grid lg:grid-cols-[1fr_320px]">
                                            <div className="p-5 sm:p-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado">Pedido #{pedido.id_pedido}</p>
                                                        <h2 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">{pedido.clientes?.nome ?? "Cliente"}</h2>
                                                        <p className="mt-2 text-sm text-app-cinza">
                                                            {formatarData(pedido.reservas?.data_reserva)} das {pedido.reservas?.horario_inicio?.slice(0, 5) ?? "--:--"} ate {pedido.reservas?.horario_fim?.slice(0, 5) ?? "--:--"}
                                                        </p>
                                                    </div>
                                                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${obterClasseStatus(pedido.status_pedido)}`}>{textoStatusPedido(pedido.status_pedido)}</span>
                                                </div>

                                                <div className="mt-5 grid gap-3 text-sm text-app-mocha sm:grid-cols-4">
                                                    <span className="rounded-[10px] bg-app-chantilly px-3 py-3 ring-1 ring-app-baunilha-dourada/45">
                                                        <Icon type="calendar" className="mr-1 inline h-4 w-4" />
                                                        Mesa {pedido.reservas?.mesas?.numero_mesa ?? "-"}
                                                    </span>
                                                    <span className="rounded-[10px] bg-app-chantilly px-3 py-3 ring-1 ring-app-baunilha-dourada/45">{pedido.reservas?.quantidade_pessoas ?? "-"} pessoas</span>
                                                    <span className="rounded-[10px] bg-app-chantilly px-3 py-3 ring-1 ring-app-baunilha-dourada/45">{totalItens} itens</span>
                                                    <span className="rounded-[10px] bg-app-chantilly px-3 py-3 ring-1 ring-app-baunilha-dourada/45">{pedido.ocultado_cozinha ? "Removido da cozinha" : "Historico ativo"}</span>
                                                </div>

                                                <div className="mt-5 grid gap-3">
                                                    {(pedido.itens_pedido ?? []).map((item, indice) => (
                                                        <div key={`${pedido.id_pedido}-${item.produtos?.nome ?? indice}`} className="flex items-start justify-between gap-4 rounded-[10px] bg-app-chantilly px-4 py-3 text-sm text-app-mocha ring-1 ring-app-baunilha-dourada/45">
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-app-cafe-profundo">{item.quantidade}x {item.produtos?.nome ?? "Item"}</p>
                                                                {item.observacoes ? <p className="mt-1 text-xs text-app-cinza">Obs.: {item.observacoes}</p> : null}
                                                            </div>
                                                            <strong className="shrink-0 text-app-cafe-profundo">{formatarMoeda(calcularSubtotalItem(item))}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <aside className="flex flex-col justify-between bg-app-cafe-profundo p-5 text-app-creme-leve sm:p-6">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-baunilha-dourada">Resumo financeiro</p>
                                                    <p className="mt-3 text-3xl font-semibold">{formatarMoeda(pedido.valor_total)}</p>
                                                    <div className="mt-5 grid gap-2 text-sm text-app-creme-suave">
                                                        <span className="flex items-center gap-2"><Icon type="money" className="h-4 w-4" /> Pago: {formatarMoeda(pagamento?.valor_pago ?? 0)}</span>
                                                        <span>Liquido: {formatarMoeda(pagamento?.valor_restaurante ?? 0)}</span>
                                                        <span>Comissao: {formatarMoeda(pagamento?.valor_comissao_app ?? 0)}</span>
                                                        <span>Repasse: {textoStatusRepasse(pagamento?.status_repasse ?? "NAO_APLICAVEL")}</span>
                                                    </div>
                                                </div>
                                            </aside>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyPanel />
                    )}
                </section>
            </section>
        </main>
    );
}
