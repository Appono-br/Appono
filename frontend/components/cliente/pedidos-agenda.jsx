"use client";

import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido } from "@/lib/formatadores-status";
import { reservaAceitaPagamento } from "@/lib/elegibilidade-pagamento";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const moeda = (valor, localeUI) => new Intl.NumberFormat(localeUI, { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
const dataReserva = (pedido, localeUI) => pedido.reservas?.data_reserva
    ? new Date(`${pedido.reservas.data_reserva}T12:00:00`).toLocaleDateString(localeUI)
    : "Data não informada";

function PedidoSkeleton() {
    return <div className="h-36 animate-pulse rounded-[14px] bg-white ring-1 ring-app-baunilha-dourada/60" />;
}

export function PedidosAgenda({ atualizacao = 0 }) {
    const { ui, localeUI } = useInterface();
    const [pagina, setPagina] = useState(1);
    const [resultado, setResultado] = useState({ items: [], pagination: null });
    const [carregamentoConcluido, setCarregamentoConcluido] = useState("");
    const [erro, setErro] = useState("");
    const [pedidoExcluindo, setPedidoExcluindo] = useState(null);
    const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);
    const chaveCarregamento = `${pagina}:${atualizacao}`;
    const carregando = carregamentoConcluido !== chaveCarregamento;

    useEffect(() => {
        const controller = new AbortController();
        apiRequest(`/pedidos?page=${pagina}&limit=12`, { signal: controller.signal, forceRefresh: true })
            .then((data) => {
                if (!controller.signal.aborted) {
                    setResultado(data);
                    setErro("");
                }
            })
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setResultado({ items: [], pagination: null });
                    setErro(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setCarregamentoConcluido(chaveCarregamento);
            });
        return () => controller.abort();
    }, [pagina, atualizacao, chaveCarregamento]);

    function mudarPagina(proximaPagina) {
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
        <section id="agenda-pedidos" aria-labelledby="agenda-pedidos-titulo" className="min-w-0 scroll-mt-28">
                <header>
                    <h2 id="agenda-pedidos-titulo" className="text-2xl font-semibold">{ui("Pedidos")}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-app-cinza">{ui("Acompanhe o preparo, consulte os detalhes e acesse pagamentos ou suporte.")}</p>
                </header>

                {erro ? <div role="alert" className="mt-8 rounded-[12px] bg-red-50 p-5 text-sm font-semibold text-red-800 ring-1 ring-red-200">{ui(erro)}</div> : null}
                {carregando ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <PedidoSkeleton key={item} />)}</div> : null}
                {!carregando && !erro && !pedidos.length ? (
                    <div className="mt-8 rounded-[14px] border border-dashed border-app-baunilha-dourada bg-white p-10 text-center">
                        <h3 className="text-xl font-bold">{ui("Nenhum pedido encontrado")}</h3>
                        <p className="mt-2 text-app-cinza">{ui("Se você possui uma reserva confirmada, pode adicionar um pedido antecipado.")}</p>
                    </div>
                ) : null}

                {!carregando && pedidos.length ? (
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {pedidos.map((pedido) => (
                            <article key={pedido.id_pedido} className="rounded-[14px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                                <div className="flex items-start justify-between gap-4">
                                    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Pedido #")}{pedido.id_pedido}</p><h3 className="mt-2 text-xl font-bold">{pedido.restaurantes?.nome ?? ui("Restaurante")}</h3></div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold ring-1 ring-app-baunilha-dourada">{ui(textoStatusPedido(pedido.status_pedido))}</span>
                                </div>
                                <p className="mt-4 text-sm text-app-cinza">{ui(dataReserva(pedido, localeUI))}{ui(" às ")}{String(pedido.reservas?.horario_inicio ?? "--:--").slice(0, 5)}</p>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                    <strong>{moeda(pedido.valor_total, localeUI)}</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {pedido.status_pedido === "PENDENTE" && reservaAceitaPagamento(pedido.reservas) ? (
                                            <Link href={`/cliente/pagamentos/pedido/${pedido.id_pedido}`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold uppercase text-white transition hover:bg-app-caramelo-torrado">{ui("Pagar")}</Link>
                                        ) : null}
                                        <Link href={`/cliente/configuracoes?painel=suporte&pedido=${pedido.id_pedido}&motivo=PEDIDO_NAO_PRONTO`} className="rounded-[8px] border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase text-app-mocha transition hover:bg-app-chantilly">{ui("Suporte")}</Link>
                                        <Link href={`/cliente/pedidos/${pedido.id_pedido}`} className="rounded-[8px] bg-app-cafe-profundo px-4 py-2 text-xs font-bold uppercase text-app-creme-leve transition hover:bg-app-caramelo-torrado">{ui("Ver detalhes")}</Link>
                                        {["ENTREGUE", "CANCELADO"].includes(pedido.status_pedido) ? (
                                            <button type="button" disabled={pedidoExcluindo === pedido.id_pedido} onClick={() => setPedidoParaExcluir(pedido)} className="rounded-[8px] border border-red-300 px-4 py-2 text-xs font-bold uppercase text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                                                {ui(pedidoExcluindo === pedido.id_pedido ? "Removendo..." : "Excluir")}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}

                {paginacao?.totalPages > 1 ? (
                    <nav aria-label={ui("Paginação dos pedidos")} className="mt-8 flex items-center justify-center gap-4">
                        <button type="button" disabled={pagina <= 1 || carregando} onClick={() => mudarPagina(pagina - 1)} className="rounded-[8px] border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase disabled:opacity-40">{ui("Anterior")}</button>
                        <span className="text-sm font-semibold">{ui("Página ")}{pagina}{ui(" de ")}{paginacao.totalPages}</span>
                        <button type="button" disabled={pagina >= paginacao.totalPages || carregando} onClick={() => mudarPagina(pagina + 1)} className="rounded-[8px] border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase disabled:opacity-40">{ui("Próxima")}</button>
                    </nav>
                ) : null}
            <ConfirmationDialog
                open={Boolean(pedidoParaExcluir)}
                eyebrow={ui("Excluir pedido")}
                title={ui("Remover este pedido do histórico?")}
                description={ui("O pedido será ocultado apenas da sua lista. Pagamentos, reembolsos e registros operacionais continuam preservados.")}
                confirmLabel={ui("Excluir")}
                cancelLabel={ui("Manter")}
                loading={pedidoExcluindo === pedidoParaExcluir?.id_pedido}
                onCancel={() => setPedidoParaExcluir(null)}
                onConfirm={() => excluirPedidoDaLista(pedidoParaExcluir)}
                details={pedidoParaExcluir ? (
                    <div>
                        <p className="font-semibold">{ui("Pedido #")}{pedidoParaExcluir.id_pedido}</p>
                        <p className="mt-1 text-xs text-app-cinza">{pedidoParaExcluir.restaurantes?.nome ?? ui("Restaurante")} - {moeda(pedidoParaExcluir.valor_total, localeUI)}</p>
                    </div>
                ) : null}
            />
        </section>
    );
}
