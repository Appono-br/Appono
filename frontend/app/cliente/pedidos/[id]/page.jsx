"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusPedido } from "@/lib/formatadores-status";
import { reservaAceitaPagamento } from "@/lib/elegibilidade-pagamento";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));

export default function DetalhePedidoPorId({ params }) {
    const { id } = use(params);
    const [pedido, setPedido] = useState(null);
    const [erro, setErro] = useState("");
    const [processando, setProcessando] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        apiRequest(`/pedidos/${id}`, { signal: controller.signal }).then(setPedido).catch((error) => {
            if (error?.name !== "AbortError") setErro(error instanceof Error ? error.message : "Nao foi possivel carregar o pedido.");
        });
        return () => controller.abort();
    }, [id]);
    async function cancelarPedido() {
        if (!window.confirm("Deseja cancelar este pedido?")) return;
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
    if (erro && !pedido) return <main className="flex min-h-screen items-center justify-center bg-app-chantilly p-5"><section className="rounded-[14px] bg-app-creme-leve p-8 text-center"><h1 className="text-2xl font-bold">Pedido indisponível</h1><p className="mt-3 text-app-cinza">{erro}</p><Link className="mt-6 inline-block font-bold text-app-caramelo-torrado" href="/cliente/detalhes-pedido">Voltar aos pedidos</Link></section></main>;
    if (!pedido) return <main className="min-h-screen bg-app-chantilly p-8"><div className="mx-auto h-48 max-w-5xl animate-pulse rounded-[16px] bg-app-creme-leve" /></main>;
    return <main className="min-h-screen bg-app-chantilly px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-5xl">
        <Link href="/cliente/detalhes-pedido" className="text-sm font-bold text-app-caramelo-torrado">← Todos os pedidos</Link>
        {erro ? <p role="alert" className="mt-5 rounded-[10px] bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">{erro}</p> : null}
        <header className="mt-6 rounded-[18px] bg-app-cafe-profundo p-7 text-app-creme-leve"><p className="text-xs uppercase text-app-baunilha-dourada">Pedido #{pedido.id_pedido}</p><h1 className="mt-2 text-4xl font-bold">{pedido.restaurantes?.nome ?? "Restaurante"}</h1><p className="mt-3">{textoStatusPedido(pedido.status_pedido)} · {moeda(pedido.valor_total)}</p></header>
        <div className="mt-6 grid gap-4">{(pedido.itens_pedido ?? []).map((item, index) => <article key={index} className="flex justify-between gap-5 rounded-[12px] bg-app-creme-leve p-5 ring-1 ring-app-baunilha-dourada/60"><div><h2 className="font-bold">{item.produtos?.nome ?? "Item"}</h2><p className="mt-1 text-sm text-app-cinza">{item.quantidade} unidade(s){item.observacoes ? ` · ${item.observacoes}` : ""}</p></div><strong>{moeda(Number(item.preco_unitario) * Number(item.quantidade))}</strong></article>)}</div>
        <footer className="mt-6 rounded-[12px] bg-app-creme-leve p-5"><p><strong>Reserva:</strong> {pedido.reservas?.data_reserva ?? "—"} às {String(pedido.reservas?.horario_inicio ?? "").slice(0, 5)}</p><p className="mt-2"><strong>Total:</strong> {moeda(pedido.valor_total)}</p><div className="mt-5 flex flex-wrap gap-3">{pedido.status_pedido === "PENDENTE" && reservaAceitaPagamento(pedido.reservas) ? <Link href={`/cliente/pagamentos/pedido/${pedido.id_pedido}`} className="inline-flex rounded-[8px] bg-app-dourado-mel px-6 py-3 text-xs font-bold uppercase text-white">Pagar no Mercado Pago</Link> : null}{["PENDENTE", "CONFIRMADO"].includes(pedido.status_pedido) ? <button type="button" disabled={processando} onClick={cancelarPedido} className="rounded-[8px] border border-red-300 px-6 py-3 text-xs font-bold uppercase text-red-700 disabled:opacity-50">{processando ? "Cancelando..." : "Cancelar pedido"}</button> : null}{pedido.status_pedido === "ENTREGUE" ? <Link href={`/cliente/restaurantes/${pedido.id_restaurante}`} className="inline-flex rounded-[8px] border border-app-dourado-mel px-6 py-3 text-xs font-bold uppercase text-app-caramelo-torrado">Avaliar restaurante</Link> : null}</div></footer>
    </section></main>;
}
