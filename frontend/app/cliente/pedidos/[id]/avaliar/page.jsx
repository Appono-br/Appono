"use client";

import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Star } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { avaliacaoPedidoSchema } from "@/lib/schemas/cliente";

export default function AvaliarPedidoPage({ params }) {
    const { ui } = useInterface();
    const { id } = use(params);
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [salvo, setSalvo] = useState(false);
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(avaliacaoPedidoSchema),
        defaultValues: { nota: 0, comentario: "" },
    });
    const nota = watch("nota");
    const comentario = watch("comentario") ?? "";

    useEffect(() => {
        const controller = new AbortController();
        apiRequest(`/pedidos/${id}/avaliacao`, { signal: controller.signal }).then((response) => {
            setDados(response);
            setValue("nota", Number(response.avaliacao?.nota ?? 0));
            setValue("comentario", response.avaliacao?.comentario ?? "");
        }).catch((error) => {
            if (error?.name !== "AbortError") setErro(error instanceof Error ? error.message : "Não foi possível carregar a avaliação.");
        });
        return () => controller.abort();
    }, [id]);

    async function salvar({ nota: notaSelecionada, comentario: comentarioAtual }) {
        setErro("");
        try {
            const avaliacao = await apiRequest(`/pedidos/${id}/avaliacao`, { method: "POST", body: JSON.stringify({ nota: notaSelecionada, comentario: comentarioAtual }) });
            setDados((atual) => ({ ...atual, avaliacao }));
            setSalvo(true);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível publicar a avaliação.");
        }
    }

    if (!dados && !erro) return <main className="min-h-screen bg-white p-8"><div className="mx-auto h-64 max-w-2xl animate-pulse rounded-[16px] bg-white" /></main>;
    return <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-2xl">
        <Link href={`/cliente/pedidos/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-app-caramelo-torrado"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{ui("Voltar ao pedido")}</Link>
        <header className="mt-6 rounded-[18px] bg-app-cafe-profundo p-7 text-app-creme-leve"><p className="text-xs font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">{ui("Pedido entregue #")}{id}</p><h1 className="mt-2 text-3xl font-semibold">{ui("Como foi sua experiência?")}</h1><p className="mt-3 text-sm text-app-creme-suave">{ui("Avalie o atendimento do ")}{dados?.pedido?.restaurantes?.nome ?? ui("restaurante")}{ui(". Sua opinião será publicada no perfil do estabelecimento.")}</p></header>
        {erro ? <p role="alert" className="mt-5 flex items-center gap-2 rounded-[10px] bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200"><AlertCircle className="h-4 w-4" aria-hidden="true" />{ui(erro)}</p> : null}
        {dados && !dados.elegivel ? <section className="mt-6 rounded-[14px] bg-white p-7 ring-1 ring-app-baunilha-dourada/60"><h2 className="text-xl font-semibold">{ui("Avaliação ainda indisponível")}</h2><p className="mt-2 text-sm text-app-cinza">{ui("Ela será liberada quando o restaurante marcar o pedido como entregue.")}</p></section> : null}
        {dados?.elegivel ? <form onSubmit={handleSubmit(salvar)} className="mt-6 rounded-[14px] bg-white p-7 shadow-sm ring-1 ring-app-baunilha-dourada/60"><fieldset><legend className="text-sm font-bold">{ui("Sua nota")}</legend><div className="mt-4 flex gap-2" aria-label={ui("Nota de 1 a 5 estrelas")}>{[1, 2, 3, 4, 5].map((valor) => <button key={valor} type="button" onClick={() => setValue("nota", valor, { shouldValidate: true })} aria-label={ui("{0} estrela{1}", [valor, valor > 1 ? "s" : ""])} className="transition"><Star className={`h-9 w-9 ${valor <= nota ? "fill-amber-400 text-amber-400" : "text-app-baunilha-dourada hover:text-amber-400"}`} aria-hidden="true" /></button>)}</div>{errors.nota ? <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{ui(errors.nota.message)}</p> : <p className="mt-2 text-sm text-app-cinza">{nota ? ui("{0} de 5 estrelas", [nota]) : ui("Selecione uma nota")}</p>}</fieldset><label className="mt-6 grid gap-2 text-sm font-bold" htmlFor="comentario-avaliacao">{ui("Conte como foi")}<textarea id="comentario-avaliacao" maxLength={1000} rows={6} {...register("comentario")} className="rounded-[10px] border border-app-baunilha-dourada bg-white p-4 font-normal outline-none focus:border-app-caramelo-torrado" placeholder={ui("Comente sobre atendimento, ambiente e qualidade do pedido.")}/></label>{errors.comentario ? <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{ui(errors.comentario.message)}</p> : null}<div className="mt-2 text-right text-xs text-app-cinza">{comentario.length}/1000</div><button disabled={isSubmitting} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-app-dourado-mel text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{ui("Publicando...")}</> : ui(dados.avaliacao ? "Atualizar avaliação" : "Publicar avaliação")}</button>{salvo ? <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm font-bold text-green-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{ui("Avaliação publicada com sucesso.")}</p> : null}</form> : null}
    </section></main>;
}
