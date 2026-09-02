"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido, textoStatusReembolso } from "@/lib/formatadores-status";
import { reservaAceitaPagamento } from "@/lib/elegibilidade-pagamento";
import { useRouter } from "next/navigation";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));

function formatarDataReserva(reserva) {
    if (!reserva?.data_reserva) return "Data não informada";
    const data = new Date(`${reserva.data_reserva}T12:00:00`).toLocaleDateString("pt-BR");
    const horario = String(reserva.horario_inicio ?? "").slice(0, 5) || "--:--";
    return `${data} às ${horario}`;
}

function calcularSubtotal(item) {
    return Number(item.preco_unitario ?? 0) * Number(item.quantidade ?? 0);
}

function PedidoCarregando() {
    return (
        <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">
            <section className="mx-auto max-w-5xl">
                <div className="h-5 w-36 animate-pulse rounded-full bg-app-baunilha-dourada/60" />
                <div className="mt-6 rounded-[18px] bg-white p-7 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-app-baunilha-dourada/70" />
                    <div className="mt-5 h-10 w-72 max-w-full animate-pulse rounded-full bg-app-baunilha-dourada/50" />
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[12px] bg-white" />)}
                    </div>
                </div>
            </section>
        </main>
    );
}

export default function DetalhePedidoPorId({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [pedido, setPedido] = useState(null);
    const [reembolso, setReembolso] = useState(null);
    const [carregandoPedido, setCarregandoPedido] = useState(true);
    const [erro, setErro] = useState("");
    const [processando, setProcessando] = useState(false);
    const [mostrandoReembolso, setMostrandoReembolso] = useState(false);
    const [motivoReembolso, setMotivoReembolso] = useState("");
    const reembolsoBloqueiaNovaSolicitacao = reembolso && !["RECUSADO", "CANCELADO"].includes(reembolso.status_reembolso);

    useEffect(() => {
        const controller = new AbortController();

        queueMicrotask(() => {
            if (!controller.signal.aborted) {
                setCarregandoPedido(true);
                setErro("");
            }
        });

        apiRequest(`/pedidos/${id}`, { signal: controller.signal, forceRefresh: true })
            .then((pedidoCarregado) => setPedido(pedidoCarregado))
            .catch((error) => {
                if (error?.name !== "AbortError") setErro(error instanceof Error ? error.message : "Não foi possível carregar o pedido.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setCarregandoPedido(false);
            });

        apiRequest(`/reembolsos/pedido/${id}`, { signal: controller.signal, forceRefresh: true })
            .then((respostaReembolso) => setReembolso(respostaReembolso.reembolso ?? null))
            .catch(() => setReembolso(null));

        return () => controller.abort();
    }, [id]);

    async function cancelarPedido() {
        if (!window.confirm("Deseja cancelar este pedido? A reserva continuará ativa se ainda estiver confirmada.")) return;
        setProcessando(true);
        setErro("");
        try {
            const atualizado = await apiRequest(`/pedidos/${id}/cancelar`, { method: "PATCH" });
            setPedido((atual) => ({ ...atual, ...atualizado }));
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível cancelar o pedido.");
        } finally {
            setProcessando(false);
        }
    }

    async function solicitarReembolso() {
        setProcessando(true);
        setErro("");
        try {
            const criado = await apiRequest("/reembolsos", { method: "POST", body: JSON.stringify({ id_pedido: Number(id), motivo: motivoReembolso }) });
            setReembolso(criado);
            setMostrandoReembolso(false);
            setMotivoReembolso("");
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível solicitar o reembolso.");
        } finally {
            setProcessando(false);
        }
    }

    async function excluirPedidoDaLista() {
        if (!window.confirm("Remover este pedido do seu historico?")) return;
        setProcessando(true);
        setErro("");
        try {
            await apiRequest(`/pedidos/${id}/ocultar`, { method: "PATCH" });
            router.replace("/cliente/detalhes-pedido");
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Nao foi possivel remover o pedido da lista.");
        } finally {
            setProcessando(false);
        }
    }

    if (carregandoPedido && !pedido) return <PedidoCarregando />;

    if (erro && !pedido) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white p-5 text-app-cafe-profundo">
                <section className="w-full max-w-lg rounded-[16px] bg-white p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada/70">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Pedido</p>
                    <h1 className="mt-3 text-2xl font-semibold">Pedido indisponível</h1>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">{erro}</p>
                    <Link className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve" href="/cliente/detalhes-pedido">Voltar aos pedidos</Link>
                </section>
            </main>
        );
    }

    const itens = pedido?.itens_pedido ?? [];
    const totalItens = itens.reduce((total, item) => total + Number(item.quantidade ?? 0), 0);

    return (
        <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">
            <section className="mx-auto max-w-6xl">
                <Link href="/cliente/detalhes-pedido" className="text-sm font-bold text-app-caramelo-torrado">← Todos os pedidos</Link>

                {erro ? <p role="alert" className="mt-5 rounded-[10px] bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">{erro}</p> : null}

                <header className="mt-6 overflow-hidden rounded-[20px] bg-app-cafe-profundo text-app-creme-leve shadow-sm">
                    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-app-baunilha-dourada">Pedido antecipado #{pedido.id_pedido}</p>
                            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{pedido.restaurantes?.nome ?? "Restaurante"}</h1>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-creme-suave">Acompanhe os itens do seu pedido e o vínculo com a reserva. O restaurante recebe o pedido após a confirmação do pagamento.</p>
                        </div>
                        <div className="rounded-[14px] bg-white/10 p-5 ring-1 ring-app-baunilha-dourada/20 lg:min-w-72">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Status atual</p>
                            <strong className="mt-2 block text-2xl">{textoStatusPedido(pedido.status_pedido)}</strong>
                            <p className="mt-2 text-sm text-app-creme-suave">{formatarDataReserva(pedido.reservas)}</p>
                        </div>
                    </div>
                </header>

                <section className="mt-6 grid gap-4 md:grid-cols-3">
                    <article className="rounded-[14px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Total</p>
                        <strong className="mt-2 block text-2xl">{moeda(pedido.valor_total)}</strong>
                    </article>
                    <article className="rounded-[14px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Itens</p>
                        <strong className="mt-2 block text-2xl">{totalItens}</strong>
                    </article>
                    <article className="rounded-[14px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/60">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Reserva</p>
                        <strong className="mt-2 block text-lg">{formatarDataReserva(pedido.reservas)}</strong>
                    </article>
                </section>

                <section className="mt-6 rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Itens do pedido</p>
                            <h2 className="mt-2 text-2xl font-semibold">Resumo da comanda</h2>
                        </div>
                        <strong className="text-xl">{moeda(pedido.valor_total)}</strong>
                    </div>
                    <div className="mt-5 grid gap-3">
                        {itens.length ? itens.map((item, index) => (
                            <article key={`${item.produtos?.nome ?? "item"}-${index}`} className="grid gap-4 rounded-[12px] bg-white p-4 ring-1 ring-app-baunilha-dourada/50 sm:grid-cols-[1fr_auto] sm:items-center">
                                <div>
                                    <h3 className="font-bold">{item.produtos?.nome ?? "Item"}</h3>
                                    <p className="mt-1 text-sm text-app-cinza">{item.quantidade} unidade(s) · {moeda(item.preco_unitario)} cada</p>
                                    {item.observacoes ? <p className="mt-2 text-sm text-app-mocha">Observação: {item.observacoes}</p> : null}
                                </div>
                                <strong>{moeda(calcularSubtotal(item))}</strong>
                            </article>
                        )) : (
                            <p className="rounded-[12px] bg-white p-5 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/50">Nenhum item carregado para este pedido.</p>
                        )}
                    </div>
                </section>

                <section className="mt-6 rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70 sm:p-6">
                    <div className="flex flex-wrap gap-3">
                        {pedido.status_pedido === "PENDENTE" && reservaAceitaPagamento(pedido.reservas) ? <Link href={`/cliente/pagamentos/pedido/${pedido.id_pedido}`} className="inline-flex h-11 items-center rounded-[8px] bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-[0.12em] text-white">Pagar no Mercado Pago</Link> : null}
                        {["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido) ? <button type="button" disabled={processando} onClick={cancelarPedido} className="inline-flex h-11 items-center rounded-[8px] border border-red-300 px-6 text-xs font-bold uppercase tracking-[0.12em] text-red-700 disabled:opacity-50">{processando ? "Cancelando..." : "Cancelar pedido"}</button> : null}
                        {pedido.status_pedido === "ENTREGUE" ? <Link href={`/cliente/pedidos/${pedido.id_pedido}/avaliar`} className="inline-flex h-11 items-center rounded-[8px] border border-app-dourado-mel px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">Avaliar experiência</Link> : null}
                        {pedido.status_pedido !== "PENDENTE" && !reembolsoBloqueiaNovaSolicitacao ? <button type="button" onClick={() => setMostrandoReembolso(true)} className="inline-flex h-11 items-center rounded-[8px] border border-app-caramelo-torrado px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">Solicitar reembolso</button> : null}
                        {["ENTREGUE", "CANCELADO"].includes(pedido.status_pedido) ? <button type="button" disabled={processando} onClick={excluirPedidoDaLista} className="inline-flex h-11 items-center rounded-[8px] border border-red-300 px-6 text-xs font-bold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50 disabled:opacity-50">Excluir do historico</button> : null}
                    </div>

                    {reembolso ? <div className="mt-5 rounded-[12px] bg-white p-4 text-sm ring-1 ring-app-baunilha-dourada/60"><strong>Reembolso: {textoStatusReembolso(reembolso.status_reembolso)}</strong><p className="mt-2 text-app-cinza">{reembolso.motivo}</p>{reembolso.resposta ? <p className="mt-2"><strong>Resposta:</strong> {reembolso.resposta}</p> : null}</div> : null}

                    {mostrandoReembolso ? (
                        <div className="mt-5 rounded-[12px] bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
                            <label className="text-sm font-bold" htmlFor="motivo-reembolso">Motivo do reembolso</label>
                            <textarea id="motivo-reembolso" value={motivoReembolso} onChange={(event) => setMotivoReembolso(event.target.value)} maxLength={500} rows={4} className="mt-2 w-full rounded-[8px] border border-app-baunilha-dourada bg-white p-3 text-sm" placeholder="Explique o ocorrido em pelo menos 10 caracteres." />
                            <div className="mt-3 flex gap-3">
                                <button type="button" disabled={processando || motivoReembolso.trim().length < 10} onClick={solicitarReembolso} className="rounded-[8px] bg-app-cafe-profundo px-5 py-3 text-xs font-bold uppercase text-white disabled:opacity-50">{processando ? "Enviando..." : "Enviar solicitação"}</button>
                                <button type="button" onClick={() => setMostrandoReembolso(false)} className="px-4 text-xs font-bold uppercase text-app-cinza">Fechar</button>
                            </div>
                        </div>
                    ) : null}
                </section>
            </section>
        </main>
    );
}
