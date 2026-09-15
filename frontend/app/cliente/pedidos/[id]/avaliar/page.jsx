"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function AvaliarPedidoPage({ params }) {
    const { id } = use(params);
    const [dados, setDados] = useState(null);
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState("");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [salvo, setSalvo] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest(`/pedidos/${id}/avaliacao`, { signal: controller.signal }).then((response) => {
            setDados(response);
            setNota(Number(response.avaliacao?.nota ?? 0));
            setComentario(response.avaliacao?.comentario ?? "");
        }).catch((error) => {
            if (error?.name !== "AbortError") setErro(error instanceof Error ? error.message : "Não foi possível carregar a avaliação.");
        });
        return () => controller.abort();
    }, [id]);

    async function salvar(event) {
        event.preventDefault();
        if (!nota) return setErro("Selecione de 1 a 5 estrelas.");
        setSalvando(true);
        setErro("");
        try {
            const avaliacao = await apiRequest(`/pedidos/${id}/avaliacao`, { method: "POST", body: JSON.stringify({ nota, comentario }) });
            setDados((atual) => ({ ...atual, avaliacao }));
            setSalvo(true);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível publicar a avaliação.");
        } finally {
            setSalvando(false);
        }
    }

    if (!dados && !erro) return <main className="min-h-screen bg-white p-8"><div className="mx-auto h-64 max-w-2xl animate-pulse rounded-[16px] bg-white" /></main>;
    return <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-2xl">
        <Link href={`/cliente/pedidos/${id}`} className="text-sm font-bold text-app-caramelo-torrado">← Voltar ao pedido</Link>
        <header className="mt-6 rounded-[18px] bg-app-cafe-profundo p-7 text-app-creme-leve"><p className="text-xs font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">Pedido entregue #{id}</p><h1 className="mt-2 text-3xl font-semibold">Como foi sua experiência?</h1><p className="mt-3 text-sm text-app-creme-suave">Avalie o atendimento do {dados?.pedido?.restaurantes?.nome ?? "restaurante"}. Sua opinião será publicada no perfil do estabelecimento.</p></header>
        {erro ? <p role="alert" className="mt-5 rounded-[10px] bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">{erro}</p> : null}
        {dados && !dados.elegivel ? <section className="mt-6 rounded-[14px] bg-white p-7 ring-1 ring-app-baunilha-dourada/60"><h2 className="text-xl font-semibold">Avaliação ainda indisponível</h2><p className="mt-2 text-sm text-app-cinza">Ela será liberada quando o restaurante marcar o pedido como entregue.</p></section> : null}
        {dados?.elegivel ? <form onSubmit={salvar} className="mt-6 rounded-[14px] bg-white p-7 shadow-sm ring-1 ring-app-baunilha-dourada/60"><fieldset><legend className="text-sm font-bold">Sua nota</legend><div className="mt-4 flex gap-2" aria-label="Nota de 1 a 5 estrelas">{[1, 2, 3, 4, 5].map((valor) => <button key={valor} type="button" onClick={() => setNota(valor)} aria-label={`${valor} estrela${valor > 1 ? "s" : ""}`} className={`text-4xl transition ${valor <= nota ? "text-app-dourado-mel" : "text-app-baunilha-dourada hover:text-app-dourado-mel"}`}>★</button>)}</div><p className="mt-2 text-sm text-app-cinza">{nota ? `${nota} de 5 estrelas` : "Selecione uma nota"}</p></fieldset><label className="mt-6 grid gap-2 text-sm font-bold" htmlFor="comentario-avaliacao">Conte como foi<textarea id="comentario-avaliacao" maxLength={1000} rows={6} value={comentario} onChange={(event) => setComentario(event.target.value)} className="rounded-[10px] border border-app-baunilha-dourada bg-white p-4 font-normal outline-none focus:border-app-caramelo-torrado" placeholder="Comente sobre atendimento, ambiente e qualidade do pedido."/></label><div className="mt-2 text-right text-xs text-app-cinza">{comentario.length}/1000</div><button disabled={salvando || !nota} className="mt-5 h-12 w-full rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">{salvando ? "Publicando..." : dados.avaliacao ? "Atualizar avaliação" : "Publicar avaliação"}</button>{salvo ? <p className="mt-4 text-center text-sm font-bold text-green-700">Avaliação publicada com sucesso.</p> : null}</form> : null}
    </section></main>;
}
