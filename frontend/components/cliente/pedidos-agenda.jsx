"use client";

import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido } from "@/lib/formatadores-status";
import { reservaAceitaPagamento } from "@/lib/elegibilidade-pagamento";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const moeda = (valor, localeUI) => new Intl.NumberFormat(localeUI, { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
const dataReserva = (pedido, localeUI) => pedido.reservas?.data_reserva
    ? new Date(`${pedido.reservas.data_reserva}T12:00:00`).toLocaleDateString(localeUI)
    : "Data não informada";

function PedidoSkeleton() {
    return <div className="h-36 animate-pulse rounded-2xl bg-app-chantilly" />;
}

export function PedidosAgenda({ dataSelecionada = null, atualizacao = 0 }) {
    const { ui, localeUI } = useInterface();
    const [pagina, setPagina] = useState(1);
    const [resultado, setResultado] = useState({ items: [], pagination: null });
    const [carregamentoConcluido, setCarregamentoConcluido] = useState("");
    const [erro, setErro] = useState("");
    const [pedidoExcluindo, setPedidoExcluindo] = useState(null);
    const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null);
    const chaveCarregamento = `${dataSelecionada ?? "todos"}:${pagina}:${atualizacao}`;
    const carregando = carregamentoConcluido !== chaveCarregamento;

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ page: String(pagina), limit: "12" });
        if (dataSelecionada) params.set("data", dataSelecionada);
        apiRequest(`/pedidos?${params}`, { signal: controller.signal, forceRefresh: true })
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
    }, [pagina, atualizacao, dataSelecionada, chaveCarregamento]);

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
                    <h2 id="agenda-pedidos-titulo" className="sr-only">{ui("Pedidos")}</h2>
                    <p className="max-w-2xl text-xs leading-5 text-app-cinza">{ui("Acompanhe o preparo, consulte os detalhes e acesse pagamentos ou suporte.")}</p>
                </header>

                {erro ? <div role="alert" className="mt-4 rounded-[12px] bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">{ui(erro)}</div> : null}
                {carregando ? <div className="mt-4 grid gap-4">{[1, 2, 3, 4].map((item) => <PedidoSkeleton key={item} />)}</div> : null}
                {!carregando && !erro && !pedidos.length ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-app-baunilha-dourada bg-white px-5 py-8 text-center">
                        <ClipboardList aria-hidden="true" className="mx-auto h-8 w-8 text-app-caramelo-torrado" />
                        <h3 className="mt-4 text-xl font-semibold">{ui(dataSelecionada ? "Nenhum pedido neste dia" : "Nenhum pedido encontrado")}</h3>
                        <p className="mt-2 text-sm leading-6 text-app-cinza">{ui(dataSelecionada ? "Você não possui pedidos para o dia selecionado." : "Se você possui uma reserva confirmada, pode adicionar um pedido antecipado.")}</p>
                    </div>
                ) : null}

                {!carregando && pedidos.length ? (
                    <div className="mt-4 grid gap-4">
                        {pedidos.map((pedido) => (
                            <article key={pedido.id_pedido} className="min-w-0 rounded-2xl border border-app-baunilha-dourada/60 bg-white p-4 transition hover:border-app-caramelo-torrado/50 lg:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-app-baunilha-dourada/60 text-app-caramelo-torrado">
                                            <ClipboardList aria-hidden="true" className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="break-all text-[10px] font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">{ui("Pedido #")}{pedido.id_pedido}</p>
                                            <h3 className="mt-1 break-words text-lg font-semibold">{pedido.restaurantes?.nome ?? ui("Restaurante")}</h3>
                                        </div>
                                    </div>
                                    <span className="max-w-full rounded-full border border-app-baunilha-dourada/60 px-3 py-1 text-xs font-semibold">{ui(textoStatusPedido(pedido.status_pedido))}</span>
                                </div>
                                <p className="mt-3 flex items-center gap-2 text-xs text-app-cinza">
                                    <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-app-caramelo-torrado" />
                                    <span>{ui(dataReserva(pedido, localeUI))}{ui(" às ")}{String(pedido.reservas?.horario_inicio ?? "--:--").slice(0, 5)}</span>
                                </p>
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-baunilha-dourada/50 pt-4">
                                    <strong className="text-lg font-semibold">{moeda(pedido.valor_total, localeUI)}</strong>
                                    <div className="flex flex-wrap gap-2">
                                        {pedido.status_pedido === "PENDENTE" && reservaAceitaPagamento(pedido.reservas) ? (
                                            <Link href={`/cliente/pagamentos/pedido/${pedido.id_pedido}`} className="rounded-[8px] bg-app-dourado-mel px-4 py-2 text-xs font-bold text-white transition hover:bg-app-caramelo-torrado">{ui("Pagar")}</Link>
                                        ) : null}
                                        <Link href={`/cliente/configuracoes?painel=suporte&pedido=${pedido.id_pedido}&motivo=PEDIDO_NAO_PRONTO`} className="app-button-primary rounded-[8px] border border-app-baunilha-dourada px-4 py-2 text-xs font-bold text-app-mocha transition hover:bg-app-chantilly">{ui("Suporte")}</Link>
                                        <Link href={`/cliente/pedidos/${pedido.id_pedido}`} className="app-button-primary rounded-[8px] bg-app-cafe-profundo px-4 py-2 text-xs font-bold text-app-creme-leve transition hover:bg-app-caramelo-torrado">{ui("Ver detalhes")}</Link>
                                        {["ENTREGUE", "CANCELADO"].includes(pedido.status_pedido) ? (
                                            <button type="button" disabled={pedidoExcluindo === pedido.id_pedido} onClick={() => setPedidoParaExcluir(pedido)} className="rounded-[8px] border border-red-300 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
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
                    <nav aria-label={ui("Paginação dos pedidos")} className="mt-5 flex flex-wrap items-center justify-center gap-3">
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
