"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { calcularTempoPreparoItens } from "@/lib/tempo-preparo";

const navItems = [
    { label: "Inicio", href: "/cliente/dashboard" },
    { label: "Detalhes do pedido", href: "/cliente/detalhes-pedido" },
    { label: "Reservas", href: "/cliente/reservas" },
    { label: "Mensagens", href: "/cliente/mensagens" },
    { label: "Configuracoes", href: "/cliente/configuracoes" },
];

const statusesAtivos = ["PENDENTE", "CONFIRMADO", "EM_PREPARO", "PRONTO"];
const etapasPedido = [
    { status: "PENDENTE", label: "Pagamento" },
    { status: "CONFIRMADO", label: "Confirmado" },
    { status: "EM_PREPARO", label: "Em preparo" },
    { status: "PRONTO", label: "Pronto" },
    { status: "ENTREGUE", label: "Entregue" },
];

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        bag: "M6 7h12l-1 14H7L6 7z M9 7a3 3 0 0 1 6 0",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
        clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
        help: "M12 18h.01M9.2 9a3 3 0 1 1 4.9 2.3c-1.2.8-2.1 1.5-2.1 3",
        map: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
        menu: "M4 7h16M4 12h16M4 17h16",
        receipt: "M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3z M9 8h6M9 12h6M9 16h4",
        shield: "M12 21s7-3.2 7-9.8V5l-7-3-7 3v6.2C5 17.8 12 21 12 21z M9.5 12l1.7 1.7 3.8-4",
        utensils: "M7 3v8M4 3v8M10 3v8M4 11h6M7 11v10M17 3v18M14 3h3a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3",
        users: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
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
        return "Nao informado";
    }

    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatarHorario(horario) {
    return horario?.slice(0, 5) ?? "Nao informado";
}

function obterStatusPedido(status) {
    const statusMap = {
        PENDENTE: "Aguardando pagamento",
        CONFIRMADO: "Confirmado",
        EM_PREPARO: "Em preparo",
        PRONTO: "Pronto para retirada",
        ENTREGUE: "Entregue",
        CANCELADO: "Cancelado",
    };

    return statusMap[status] ?? status;
}
function obterIndiceEtapa(status) {
    if (status === "CANCELADO") {
        return -1;
    }
    const indice = etapasPedido.findIndex((etapa) => etapa.status === status);
    if (status === "PENDENTE") {
        return 0;
    }
    return indice >= 0 ? indice : 0;
}

function EmptyDataBlock({ title, description, icon = "receipt" }) {
    return (
        <div className="rounded-[8px] border border-dashed border-app-caramelo-torrado/35 bg-app-creme-leve px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-baunilha-dourada text-app-cafe-profundo">
                <Icon type={icon} className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-app-cafe-profundo">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-cinza">{description}</p>
        </div>
    );
}

function DetailSlot({ icon, label, value }) {
    return (
        <div className="flex gap-4 rounded-[12px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/60">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-app-creme-suave text-app-caramelo-torrado ring-1 ring-app-baunilha-dourada/70">
                <Icon type={icon} className="h-5 w-5" />
            </span>
            <div>
                <p className="text-[10px] font-bold uppercase text-app-cinza">{label}</p>
                <p className="mt-2 text-base font-semibold text-app-cafe-profundo">{value ?? "Nao informado"}</p>
            </div>
        </div>
    );
}

export default function OrderDetailsPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [mensagem, setMensagem] = useState("Carregando pedidos...");
    const [cancelando, setCancelando] = useState(false);
    const [pagando, setPagando] = useState(false);
    const [modalCancelamentoAberto, setModalCancelamentoAberto] = useState(false);

    useEffect(() => {
        apiRequest("/pedidos")
            .then((data) => {
                setPedidos(data ?? []);
                setMensagem("");
            })
            .catch((erro) => {
                setPedidos([]);
                setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel carregar os pedidos.");
            });
    }, []);

    const pedidoSelecionado = useMemo(() => {
        const ativos = pedidos.filter((pedido) => statusesAtivos.includes(pedido.status_pedido));
        return ativos[0];
    }, [pedidos]);
    const historicoPedidos = useMemo(() => {
        return pedidos.filter((pedido) => ["CANCELADO", "ENTREGUE"].includes(pedido.status_pedido));
    }, [pedidos]);

    const itens = pedidoSelecionado?.itens_pedido ?? [];
    const quantidadeItens = itens.reduce((soma, item) => soma + Number(item.quantidade ?? 0), 0);
    const tempoEstimado = calcularTempoPreparoItens(itens);
    const hasPedido = Boolean(pedidoSelecionado);
    const indiceEtapaAtual = obterIndiceEtapa(pedidoSelecionado?.status_pedido);
    const podeCancelarPedido = ["PENDENTE", "CONFIRMADO"].includes(pedidoSelecionado?.status_pedido);
    const podePagarPedido = pedidoSelecionado?.status_pedido === "PENDENTE";

    async function cancelarPedido() {
        if (!pedidoSelecionado || !podeCancelarPedido) {
            return;
        }
        setCancelando(true);
        setMensagem("");
        try {
            const atualizado = await apiRequest(`/pedidos/${pedidoSelecionado.id_pedido}/cancelar`, {
                method: "PATCH",
            });
            setPedidos((atuais) => atuais.map((pedido) => (pedido.id_pedido === atualizado.id_pedido ? { ...pedido, ...atualizado } : pedido)));
            setMensagem("Pedido cancelado com sucesso.");
            setModalCancelamentoAberto(false);
        }
        catch (erro) {
            setMensagem(erro instanceof Error ? erro.message : "Nao foi possivel cancelar o pedido.");
        }
        finally {
            setCancelando(false);
        }
    }

    async function pagarPedido() {
        if (!pedidoSelecionado || !podePagarPedido) {
            return;
        }
        setPagando(true);
        setMensagem("");
        window.location.assign(`/cliente/pagamentos/pedido/${pedidoSelecionado.id_pedido}`);
    }

    return (
        <main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
                    <div className="shrink-0" aria-label="Appono">
                        <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
                    </div>

                    <nav className="hidden items-center justify-self-center gap-7 text-xs font-semibold text-app-cinza lg:flex">
                        {navItems.map((item, index) => (
                            <Link key={item.label} href={item.href} className={index === 1 ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
                        <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Notificacoes">
                            <Icon type="bell" />
                        </button>
                        <button type="button" className="transition hover:text-app-caramelo-torrado" aria-label="Sacola">
                            <Icon type="bag" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((current) => !current)}
                            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-app-creme-leve lg:hidden"
                            aria-label="Abrir menu"
                            aria-expanded={mobileMenuOpen}
                            aria-controls="order-mobile-menu"
                        >
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>

                {mobileMenuOpen ? (
                    <nav id="order-mobile-menu" className="border-t border-app-baunilha-dourada/50 bg-app-creme-leve px-5 py-3 lg:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item, index) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={index === 1 ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                ) : null}
            </header>

            {!hasPedido ? (
                <section className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-16">
                    <div className="flex w-full max-w-3xl flex-col items-center">
                        <div className="w-full max-w-xl">
                            <EmptyDataBlock
                                icon="shield"
                                title={mensagem || "Nenhum pedido registrado"}
                                description="Voce nao possui pedido antecipado ativo no momento. Caso tenha uma reserva confirmada, ela continua ativa e pode ser gerenciada em Minhas reservas."
                            />
                        </div>
                        <Link href="/cliente/reservas" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-caramelo-torrado px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo">
                            Ver minhas reservas
                        </Link>
                        {historicoPedidos.length ? (
                            <section className="mt-8 w-full rounded-[16px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                                    Historico recente
                                </p>
                                <div className="mt-4 grid gap-3">
                                    {historicoPedidos.slice(0, 3).map((pedido) => (
                                        <article key={pedido.id_pedido} className="flex flex-col gap-3 rounded-[12px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/60 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-app-cafe-profundo">
                                                    Pedido #{pedido.id_pedido} - {pedido.restaurantes?.nome ?? "Restaurante"}
                                                </h3>
                                                <p className="mt-1 text-xs text-app-cinza">
                                                    {formatarData(pedido.reservas?.data_reserva)} as {formatarHorario(pedido.reservas?.horario_inicio)}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <span className="rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold text-app-mocha ring-1 ring-app-baunilha-dourada/60">
                                                    {obterStatusPedido(pedido.status_pedido)}
                                                </span>
                                                <p className="mt-2 text-sm font-bold text-app-cafe-profundo">
                                                    {formatarMoeda(pedido.valor_total)}
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </div>
                </section>
            ) : (
                <>
                    <section className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
                        <div className="overflow-hidden rounded-[18px] bg-app-cafe-profundo text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/40">
                            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:items-end">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-baunilha-dourada">
                                        Pedido antecipado #{pedidoSelecionado.id_pedido}
                                    </p>
                                    <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                                        {pedidoSelecionado.restaurantes?.nome ?? "Restaurante"}
                                    </h1>
                                    <p className="mt-4 max-w-2xl text-sm leading-6 text-app-creme-suave">
                                        Acompanhe o preparo do seu pedido vinculado a reserva. O objetivo e chegar no restaurante com tudo organizado para o horario combinado.
                                    </p>
                                </div>

                                <div className="rounded-[14px] bg-app-creme-leve/10 p-5 ring-1 ring-app-baunilha-dourada/30">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">
                                        Status atual
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold">
                                        {obterStatusPedido(pedidoSelecionado.status_pedido)}
                                    </p>
                                    <p className="mt-2 text-sm text-app-creme-suave">
                                        {formatarData(pedidoSelecionado.reservas?.data_reserva)} as {formatarHorario(pedidoSelecionado.reservas?.horario_inicio)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-app-baunilha-dourada/20 bg-app-cacau-intenso/45 px-6 py-5 sm:px-8">
                                <div className="grid gap-4 sm:grid-cols-4">
                                    {etapasPedido.map((etapa, index) => {
                                        const etapaConcluida = index <= indiceEtapaAtual;

                                        return (
                                            <div key={etapa.status} className="flex items-center gap-3">
                                                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${etapaConcluida ? "bg-app-baunilha-dourada text-app-cafe-profundo" : "bg-app-creme-leve/10 text-app-baunilha-dourada ring-1 ring-app-baunilha-dourada/30"}`}>
                                                    {index + 1}
                                                </span>
                                                <span className={`text-xs font-bold uppercase tracking-[0.12em] ${etapaConcluida ? "text-app-creme-leve" : "text-app-baunilha-dourada/70"}`}>
                                                    {etapa.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-24 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="grid gap-8">
                            <article className="rounded-[16px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                                            Reserva vinculada
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">Quando e onde</h2>
                                    </div>
                                    <Link href="/cliente/reservas" className="text-xs font-bold uppercase text-app-caramelo-torrado underline underline-offset-4">
                                        Ver reserva
                                    </Link>
                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-3">
                                    <DetailSlot icon="calendar" label="Data" value={formatarData(pedidoSelecionado.reservas?.data_reserva)} />
                                    <DetailSlot icon="clock" label="Horario" value={formatarHorario(pedidoSelecionado.reservas?.horario_inicio)} />
                                    <DetailSlot icon="map" label="Restaurante" value={pedidoSelecionado.restaurantes?.nome ?? "Restaurante"} />
                                </div>
                            </article>

                            <article className="rounded-[16px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                                            Cardapio escolhido
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">Itens do pedido</h2>
                                    </div>
                                    <span className="rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold text-app-mocha ring-1 ring-app-baunilha-dourada/60">
                                        {quantidadeItens} itens
                                    </span>
                                </div>

                                {itens.length ? (
                                    <div className="mt-8 grid gap-4">
                                        {itens.map((item, index) => {
                                            const produto = item.produtos ?? {};
                                            const subtotal = Number(item.subtotal ?? 0) || Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);

                                            return (
                                                <article key={`${produto.nome ?? "item"}-${index}`} className="grid gap-4 rounded-[14px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/70 transition hover:-translate-y-0.5 hover:shadow-sm sm:grid-cols-[104px_1fr_auto] sm:items-center">
                                                    <div className="relative h-24 overflow-hidden rounded-[12px] bg-app-baunilha-dourada/45">
                                                        {produto.imagem_url ? (
                                                            <Image src={produto.imagem_url} alt={produto.nome ?? "Item do pedido"} fill className="object-cover" />
                                                        ) : (
                                                            <span className="flex h-full items-center justify-center text-app-caramelo-torrado">
                                                                <Icon type="utensils" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">
                                                            {item.quantidade} unidade(s)
                                                        </p>
                                                        <h3 className="mt-1 text-lg font-semibold text-app-cafe-profundo">
                                                            {produto.nome ?? "Item do cardapio"}
                                                        </h3>
                                                        {produto.descricao ? (
                                                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-app-mocha">
                                                                {produto.descricao}
                                                            </p>
                                                        ) : null}
                                                        {item.observacoes ? (
                                                            <p className="mt-2 text-xs font-semibold text-app-cinza">
                                                                Obs.: {item.observacoes}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-xs font-semibold text-app-cinza">Subtotal</p>
                                                        <strong className="text-xl text-app-cafe-profundo">{formatarMoeda(subtotal)}</strong>
                                                        {item.preco_unitario ? (
                                                            <p className="mt-1 text-xs text-app-mocha">{formatarMoeda(item.preco_unitario)} cada</p>
                                                        ) : null}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="mt-8">
                                        <EmptyDataBlock title="Pedido sem itens carregados" description="O pedido existe, mas nenhum item foi retornado pela base de dados." />
                                    </div>
                                )}
                            </article>
                        </div>

                        <aside className="grid h-fit gap-4">
                            <article className="rounded-[16px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/70 lg:sticky lg:top-24">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-app-baunilha-dourada text-app-cafe-profundo">
                                        <Icon type="receipt" />
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-bold">Resumo</h2>
                                        <p className="text-xs text-app-cinza">{quantidadeItens} itens no pedido</p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 border-t border-app-baunilha-dourada pt-5 text-sm">
                                    <div className="flex justify-between gap-4 rounded-[10px] bg-app-chantilly px-3 py-2">
                                        <span className="text-app-mocha">Status</span>
                                        <strong>{obterStatusPedido(pedidoSelecionado.status_pedido)}</strong>
                                    </div>
                                    <div className="flex justify-between gap-4 rounded-[10px] bg-app-chantilly px-3 py-2">
                                        <span className="text-app-mocha">Tempo estimado</span>
                                        <strong>{tempoEstimado || "--"} min</strong>
                                    </div>
                                    {pedidoSelecionado.horario_entrega_previsto ? (
                                        <div className="flex justify-between gap-4 rounded-[10px] bg-app-chantilly px-3 py-2">
                                            <span className="text-app-mocha">Previsao</span>
                                            <strong>{String(pedidoSelecionado.horario_entrega_previsto).slice(11, 16)}</strong>
                                        </div>
                                    ) : null}
                                    <div className="flex items-center justify-between border-t border-app-baunilha-dourada pt-5">
                                        <span className="font-bold">Total</span>
                                        <strong className="text-3xl">{formatarMoeda(pedidoSelecionado.valor_total)}</strong>
                                    </div>
                                </div>

                                {pedidoSelecionado.observacoes ? (
                                    <p className="mt-5 rounded-[8px] bg-app-creme-suave p-4 text-sm leading-6 text-app-mocha">
                                        <strong>Observacoes:</strong> {pedidoSelecionado.observacoes}
                                    </p>
                                ) : null}

                                {mensagem ? (
                                    <p className="mt-5 rounded-[8px] bg-app-creme-suave p-3 text-sm font-semibold text-app-caramelo-torrado">
                                        {mensagem}
                                    </p>
                                ) : null}

                                {podePagarPedido ? (
                                    <button
                                        type="button"
                                        onClick={pagarPedido}
                                        disabled={pagando}
                                        className="mt-5 h-11 w-full rounded-[8px] bg-app-dourado-mel px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {pagando ? "Abrindo pagamento..." : "Pagar pedido"}
                                    </button>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={() => setModalCancelamentoAberto(true)}
                                    disabled={!podeCancelarPedido || cancelando}
                                    className="mt-5 h-11 w-full rounded-[8px] border border-app-vermelho-erro/45 px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-vermelho-erro transition hover:bg-app-vermelho-erro hover:text-white disabled:cursor-not-allowed disabled:border-app-cinza/35 disabled:text-app-cinza disabled:hover:bg-transparent"
                                >
                                    Cancelar apenas o pedido
                                </button>
                                {!podeCancelarPedido ? (
                                    <p className="mt-3 text-xs leading-5 text-app-cinza">
                                        O cancelamento do pedido fica indisponivel quando o preparo ja foi iniciado. A reserva deve ser gerenciada separadamente.
                                    </p>
                                ) : null}
                            </article>

                            <article className="rounded-[16px] bg-app-cafe-profundo p-6 text-center text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/40">
                                <Icon type="help" className="mx-auto h-6 w-6 text-app-caramelo-torrado" />
                                <p className="mt-4 text-app-creme-suave">Duvidas sobre seu pedido?</p>
                                <Link href="/cliente/reservas" className="mt-3 inline-block font-bold text-app-baunilha-dourada underline underline-offset-4">
                                    Consulte a reserva vinculada
                                </Link>
                            </article>
                        </aside>
                    </section>

                    {historicoPedidos.length ? (
                        <section className="mx-auto max-w-7xl px-5 pb-16">
                            <article className="rounded-[16px] bg-app-creme-leve p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                                            Historico de pedidos
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold text-app-cafe-profundo">Pedidos anteriores</h2>
                                    </div>
                                    <span className="rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold text-app-mocha ring-1 ring-app-baunilha-dourada/60">
                                        {historicoPedidos.length} registros
                                    </span>
                                </div>
                                <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    {historicoPedidos.slice(0, 4).map((pedido) => (
                                        <article key={pedido.id_pedido} className="rounded-[12px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/60">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-sm font-bold text-app-cafe-profundo">
                                                        Pedido #{pedido.id_pedido} - {pedido.restaurantes?.nome ?? "Restaurante"}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-app-cinza">
                                                        {formatarData(pedido.reservas?.data_reserva)} as {formatarHorario(pedido.reservas?.horario_inicio)}
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-app-creme-suave px-3 py-1 text-xs font-bold text-app-mocha ring-1 ring-app-baunilha-dourada/60">
                                                    {obterStatusPedido(pedido.status_pedido)}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm font-bold text-app-cafe-profundo">
                                                {formatarMoeda(pedido.valor_total)}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </article>
                        </section>
                    ) : null}

                    {modalCancelamentoAberto ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-cafe-profundo/70 px-5 backdrop-blur-sm">
                            <section className="w-full max-w-md rounded-[16px] bg-app-creme-leve p-6 text-app-cafe-profundo shadow-xl ring-1 ring-app-baunilha-dourada/70">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
                                    Cancelamento de pedido
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold">
                                    Deseja cancelar apenas o pedido?
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-app-mocha">
                                    Ao confirmar, somente o pedido antecipado sera marcado como cancelado e o restaurante sera notificado pelo status do pedido. Sua reserva continuara confirmada para o mesmo dia e horario.
                                </p>
                                <p className="mt-3 rounded-[10px] bg-app-chantilly p-3 text-sm font-semibold leading-6 text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/60">
                                    Importante: cancelar o pedido nao cancela a reserva da mesa. O cancelamento do pedido so e permitido ate 30 minutos antes da reserva.
                                </p>
                                <div className="mt-6 rounded-[10px] bg-app-chantilly p-4 ring-1 ring-app-baunilha-dourada/60">
                                    <p className="text-sm font-semibold">
                                        {pedidoSelecionado.restaurantes?.nome ?? "Restaurante"}
                                    </p>
                                    <p className="mt-1 text-xs text-app-cinza">
                                        Pedido #{pedidoSelecionado.id_pedido} | {formatarMoeda(pedidoSelecionado.valor_total)}
                                    </p>
                                </div>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalCancelamentoAberto(false)}
                                        disabled={cancelando}
                                        className="h-11 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:cursor-not-allowed disabled:text-app-cinza"
                                    >
                                        Manter pedido
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelarPedido}
                                        disabled={cancelando}
                                        className="h-11 rounded-[8px] bg-app-vermelho-erro px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:cursor-not-allowed disabled:bg-app-cinza/50"
                                    >
                                        {cancelando ? "Cancelando..." : "Cancelar apenas pedido"}
                                    </button>
                                </div>
                                <Link href="/cliente/reservas" className="mt-4 inline-flex w-full justify-center text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado underline underline-offset-4">
                                    Quero cancelar minha reserva
                                </Link>
                            </section>
                        </div>
                    ) : null}
                </>
            )}

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
