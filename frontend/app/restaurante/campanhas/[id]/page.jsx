"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function MetricasCampanhaPage() {
  const [metricas, setMetricas] = useState(null); const [erro, setErro] = useState("");
  const { id } = useParams();
  useEffect(() => { if (id) apiRequest(`/planos/campanhas/${id}/metricas`, { forceRefresh: true }).then(setMetricas).catch((error) => setErro(error.message)); }, [id]);
  return <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"><section className="mx-auto max-w-4xl"><Link href="/restaurante/campanhas" className="text-sm font-bold text-app-caramelo-torrado">← Voltar para campanhas</Link><h1 className="mt-5 text-4xl font-semibold">Resultado da campanha</h1>{erro ? <p className="mt-6 rounded-lg bg-app-creme-leve p-4 text-sm">{erro}</p> : null}{metricas ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Visualizações",metricas.visualizacoes],["Cliques",metricas.cliques],["Reservas iniciadas",metricas.reservas_iniciadas],["Resgates",metricas.resgates],["Pedidos pagos",metricas.pedidos_pagos],["Faturamento atribuído",new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(metricas.faturamento_bruto)],["Usos",`${metricas.usos}/${metricas.limite_usos}`]].map(([titulo,valor]) => <article key={titulo} className="rounded-xl border border-app-baunilha-dourada p-5"><p className="text-sm text-app-cinza">{titulo}</p><strong className="mt-2 block text-2xl">{valor}</strong></article>)}</div> : !erro ? <p className="mt-6 text-sm text-app-cinza">Carregando métricas...</p> : null}</section></main>;
}
