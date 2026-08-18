"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { textoStatusReembolso } from "@/lib/formatadores-status";

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));

export function PainelAnaliseReembolsos({ perfil }) {
    const [items, setItems] = useState([]);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(null);
    const endpoint = perfil === "admin" ? "/reembolsos/admin" : "/reembolsos/restaurante";
    const carregar = useCallback(async () => {
        setErro("");
        try {
            const response = await apiRequest(endpoint);
            setItems(response.items ?? []);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Nao foi possivel carregar os reembolsos.");
        } finally {
            setCarregando(false);
        }
    }, [endpoint]);
    useEffect(() => {
        const controller = new AbortController();
        apiRequest(endpoint, { signal: controller.signal })
            .then((response) => setItems(response.items ?? []))
            .catch((error) => {
                if (error?.name !== "AbortError") setErro(error instanceof Error ? error.message : "Nao foi possivel carregar os reembolsos.");
            })
            .finally(() => setCarregando(false));
        return () => controller.abort();
    }, [endpoint]);
    async function analisar(item, decisao) {
        let resposta = "";
        if (decisao === "RECUSAR") {
            resposta = window.prompt("Informe o motivo da recusa (minimo de 10 caracteres):") ?? "";
            if (!resposta) return;
        } else if (!window.confirm(`Aprovar o reembolso do pedido #${item.id_pedido}? O valor sera removido do repasse e marcado como estornado no controle financeiro da Appono.`)) return;
        setProcessando(item.id_reembolso);
        setErro("");
        try {
            await apiRequest(`/reembolsos/${item.id_reembolso}/analisar`, { method: "PATCH", body: JSON.stringify({ decisao, resposta }) });
            await carregar();
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Nao foi possivel analisar o reembolso.");
        } finally {
            setProcessando(null);
        }
    }
    return <main className="min-h-screen bg-app-chantilly px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-6xl">
        <Link href={perfil === "admin" ? "/admin/financeiro" : "/restaurante/financeiro"} className="text-sm font-bold text-app-caramelo-torrado">← Voltar ao financeiro</Link>
        <header className="mt-6 rounded-[16px] bg-app-cafe-profundo p-7 text-app-creme-leve"><p className="text-xs font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Controle financeiro</p><h1 className="mt-2 text-3xl font-semibold">Solicitacoes de reembolso</h1><p className="mt-3 max-w-3xl text-sm text-app-creme-suave">Analise os pedidos solicitados pelos clientes. Ao aprovar, a Appono marca o pagamento como estornado e remove o valor dos repasses e metricas financeiras.</p></header>
        {erro ? <p role="alert" className="mt-5 rounded-[10px] bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">{erro}</p> : null}
        {carregando ? <div className="mt-6 h-48 animate-pulse rounded-[14px] bg-app-creme-leve" /> : null}
        {!carregando && !items.length ? <section className="mt-6 rounded-[14px] bg-app-creme-leve p-8 text-center ring-1 ring-app-baunilha-dourada/60"><h2 className="text-xl font-semibold">Nenhuma solicitacao</h2><p className="mt-2 text-sm text-app-cinza">Os pedidos de reembolso aparecerao aqui.</p></section> : null}
        <div className="mt-6 grid gap-4">{items.map((item) => <article key={item.id_reembolso} className="rounded-[14px] bg-app-creme-leve p-6 ring-1 ring-app-baunilha-dourada/60"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase text-app-caramelo-torrado">Reembolso #{item.id_reembolso}</p><h2 className="mt-1 text-xl font-semibold">Pedido #{item.id_pedido}</h2><p className="mt-1 text-sm text-app-cinza">{item.clientes?.nome ?? "Cliente"} · {item.restaurantes?.nome ?? "Restaurante"}</p></div><div className="sm:text-right"><strong className="block text-xl">{moeda(item.valor_solicitado)}</strong><span className="mt-1 inline-block rounded-full bg-app-chantilly px-3 py-1 text-xs font-bold">{textoStatusReembolso(item.status_reembolso)}</span></div></div><div className="mt-5 rounded-[10px] bg-app-chantilly p-4 text-sm"><strong>Motivo:</strong> {item.motivo}{item.resposta ? <p className="mt-2"><strong>Resposta:</strong> {item.resposta}</p> : null}</div>{item.status_reembolso === "SOLICITADO" ? <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={processando === item.id_reembolso} onClick={() => analisar(item, "APROVAR")} className="rounded-[8px] bg-app-cafe-profundo px-5 py-3 text-xs font-bold uppercase text-white disabled:opacity-50">Aprovar reembolso</button><button type="button" disabled={processando === item.id_reembolso} onClick={() => analisar(item, "RECUSAR")} className="rounded-[8px] border border-red-300 px-5 py-3 text-xs font-bold uppercase text-red-700 disabled:opacity-50">Recusar</button></div> : null}</article>)}</div>
    </section></main>;
}
