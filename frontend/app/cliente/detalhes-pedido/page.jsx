"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido } from "@/lib/formatadores-status";
import { reservaAceitaPagamento } from "@/lib/elegibilidade-pagamento";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
const dataReserva = (pedido) => pedido.reservas?.data_reserva
    ? new Date(`${pedido.reservas.data_reserva}T12:00:00`).toLocaleDateString("pt-BR")
    : "Data não informada";

function PedidoSkeleton() {
    return <div className="h-36 animate-pulse rounded-[14px] bg-white ring-1 ring-app-baunilha-dourada/60" />;
}

export default function PedidosClientePage() {
    const [pagina, setPagina] = useState(1);
    const [resultado, setResultado] = useState({ items: [], pagination: null });
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pedidoExcluindo, setPedidoExcluindo] = useState(null);
    const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest(`/pedidos?page=${pagina}&limit=12`, { signal: controller.signal, forceRefresh: true })
            .then((data) => setResultado(data))
            .catch((error) => {
                if (error?.name !== "AbortError") setErro(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setCarregando(false);
            });
        return () => controller.abort();
    }, [pagina]);

    function mudarPagina(proximaPagina) {
        setCarregando(true);
        setErro("");
        setPagina(proximaPagina);
    }

    async function excluirPedidoDaLista(pedido) {
        setPedidoExcluindo(pedido.id_pedido);
        setErro("");
        try {
            await apiRequest(`/pedidos/${pedido.id_pedido}/ocultar`, { method: "PATCH" });
            setResultado((atual) => ({
                ...atual,
                items: (atual.items ?? []).filter((item) => item.id_pedido !== pedido.id_pedido),
            }));
            setPedidoParaExcluir(null);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível remover o pedido da lista.");
        } finally {
            setPedidoExcluindo(null);
        }
    }

    const pedidos = resultado.items ?? [];
    const paginacao = resultado.pagination;

    return (
        <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo">
            <section className="mx-auto max-w-6xl">
                <Link href="/cliente/dashboard" className="text-sm font-bold text-app-caramelo-torrado">← Voltar ao início</Link>
                <header className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">Pedidos</p>
                    <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Todos os seus pedidos</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-app-cinza">A listagem carrega apenas o resumo. Itens, acompanhamento e ações são buscados quando você abre um pedido.</p>
                </header>

                {erro ? <div role="alert" className="mt-8 rounded-[12px] bg-red-50 p-5 text-sm font-semibold text-red-800 ring-1 ring-red-200">{erro}</div> : null}
                {carregando ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <PedidoSkeleton key={item} />)}</div> : null}
                {!carregando && !erro && !pedidos.length ? (
                    <div className="mt-8 rounded-[14px] border border-dashed border-app-baunilha-dourada bg-white p-10 text-center">
                        <h2 className="text-xl font-bold">Nenhum pedido encontrado</h2>
                        <p className="mt-2 text-app-cinza">Se você possui uma reserva confirmada, pode adicionar um pedido antecipado.</p>
                        <Link href="/cliente/reservas" className="mt-6 inline-flex rounded-[8px] bg-app-dourado-mel px-6 py-3 text-xs font-bold uppercase text-white">Ver reservas</Link>
                    </div>
                ) : null}

                {!carregando && pedidos.length ? (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {pedidos.map((pedido) => (
                            <article key={pedido.id_pedido} className="rounded-[14px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                                <div className="flex items-start justify-between gap-4">
                                    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">Pedido #{pedido.id_pedido}</p><h2 className="mt-2 text-xl font-bold">{pedido.restaurantes?.nome ?? "Restaurante"}</h2></div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-app-baunilha-dourada">{textoStatusPedido(pedido.status_pedido)}</span>
                                </div>
                                <p className="mt-4 text-sm text-app-cinza">{dataReserva(pedido)} às {String(pedido.reservas?.horario_inicio ?? "--:--").slice(0, 5)}</p>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                    <strong>{moeda(pedido.valor_total)}</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {pedido.status_pedido === "PENDENTE" && reservaAceitaPagamento(pedido.reservas) ? (
                                            <Link href={`/cliente/pagamentos/pedido/${pedido.id_pedido}`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado">
                                                Pagar
                                            </Link>
                                        ) : null}
                                        <Link href={`/cliente/pedidos/${pedido.id_pedido}`} className="rounded-[8px] bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase text-app-creme-leve transition hover:bg-app-caramelo-torrado">Ver detalhes</Link>
                                        {["ENTREGUE", "CANCELADO"].includes(pedido.status_pedido) ? (
                                            <button type="button" disabled={pedidoExcluindo === pedido.id_pedido} onClick={() => setPedidoParaExcluir(pedido)} className="rounded-[8px] border border-red-300 px-4 py-2 text-xs font-bold uppercase text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                                                {pedidoExcluindo === pedido.id_pedido ? "Removendo..." : "Excluir"}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}

                {paginacao?.totalPages > 1 ? (
                    <nav aria-label="Paginação dos pedidos" className="mt-8 flex items-center justify-center gap-4">
                        <button type="button" disabled={pagina <= 1 || carregando} onClick={() => mudarPagina(pagina - 1)} className="rounded-[8px] border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase disabled:opacity-40">Anterior</button>
                        <span className="text-sm font-semibold">Página {pagina} de {paginacao.totalPages}</span>
                        <button type="button" disabled={pagina >= paginacao.totalPages || carregando} onClick={() => mudarPagina(pagina + 1)} className="rounded-[8px] border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase disabled:opacity-40">Próxima</button>
                    </nav>
                ) : null}
            </section>
            <ConfirmationDialog
                open={Boolean(pedidoParaExcluir)}
                eyebrow="Excluir pedido"
                title="Remover este pedido do histórico?"
                description="O pedido será ocultado apenas da sua lista. Pagamentos, reembolsos e registros operacionais continuam preservados."
                confirmLabel="Excluir"
                cancelLabel="Manter"
                loading={pedidoExcluindo === pedidoParaExcluir?.id_pedido}
                onCancel={() => setPedidoParaExcluir(null)}
                onConfirm={() => excluirPedidoDaLista(pedidoParaExcluir)}
                details={pedidoParaExcluir ? (
                    <div>
                        <p className="font-semibold">Pedido #{pedidoParaExcluir.id_pedido}</p>
                        <p className="mt-1 text-xs text-app-cinza">{pedidoParaExcluir.restaurantes?.nome ?? "Restaurante"} - {moeda(pedidoParaExcluir.valor_total)}</p>
                    </div>
                ) : null}
            />
        </main>
    );
}
