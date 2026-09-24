"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

function Percentual({ parte, total }) {
    const valor = total ? Math.round((Number(parte) / Number(total)) * 100) : 0;
    return <span>{valor}%</span>;
}

export default function AdminRotinaIntelligencePage() {
    const [dias, setDias] = useState(30);
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        apiRequest(`/admin/rotina-intelligence/resumo?dias=${dias}`, { forceRefresh: true })
            .then((resposta) => {
                setDados(resposta);
                setErro("");
            })
            .catch((error) => setErro(error instanceof Error ? error.message : "Nao foi possivel carregar o experimento."))
            .finally(() => setCarregando(false));
    }, [dias]);

    function alterarPeriodo(event) {
        setCarregando(true);
        setErro("");
        setDias(Number(event.target.value));
    }

    return (
        <main className="min-h-screen bg-white px-5 py-10 text-app-cafe-profundo sm:px-8">
            <section className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-5 rounded-[16px] bg-app-cafe-profundo p-7 text-app-creme-leve shadow-lg sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-baunilha-dourada">Demonstração acadêmica</p>
                        <h1 className="mt-3 text-3xl font-semibold">Appono Intelligence V2.1</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-app-creme-suave">Versão experimental titular da demonstração, com controle determinístico disponível como fallback.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/admin/financeiro" className="rounded-[8px] border border-app-baunilha-dourada/70 px-4 py-2 text-sm font-bold">Financeiro</Link>
                        <select value={dias} onChange={alterarPeriodo} className="rounded-[8px] bg-app-creme-leve px-4 py-2 text-sm font-bold text-app-cafe-profundo" aria-label="Periodo de avaliacao">
                            <option value={7}>7 dias</option>
                            <option value={30}>30 dias</option>
                            <option value={90}>90 dias</option>
                        </select>
                    </div>
                </div>

                {carregando ? <p className="mt-8 rounded-[14px] bg-app-creme-leve p-6">Carregando metricas agregadas...</p> : null}
                {erro ? <p role="alert" className="mt-8 rounded-[14px] border border-app-vermelho-erro p-6 text-app-vermelho-erro">{erro}</p> : null}
                {!carregando && !erro && !dados?.comparacoes ? (
                    <p className="mt-8 rounded-[14px] bg-app-creme-leve p-6 text-app-mocha">Ainda nao ha comparacoes sombra neste periodo. Isso e diferente de um modelo sem confianca.</p>
                ) : null}

                {dados?.configuracao ? (
                    <section className="mt-8 rounded-[14px] bg-app-creme-suave p-6 ring-1 ring-app-baunilha-dourada/70" aria-labelledby="estado-intelligence">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">Estado operacional</p>
                                <h2 id="estado-intelligence" className="mt-2 text-xl font-semibold">{dados.configuracao.modelo_disponivel}</h2>
                            </div>
                            <strong className={`w-fit rounded-full px-3 py-1 text-xs ${dados.configuracao.kill_switch ? "bg-app-vermelho-erro text-white" : "bg-app-cafe-profundo text-app-creme-leve"}`}>
                                {dados.configuracao.kill_switch ? "Kill switch ativo" : "Fallback disponivel"}
                            </strong>
                        </div>
                        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <p className="rounded-[10px] bg-white p-4">Rollout publico<strong className="mt-1 block text-xl">{dados.configuracao.rollout_percentual}%</strong></p>
                            <p className="rounded-[10px] bg-white p-4">Contas internas<strong className="mt-1 block text-xl">{dados.configuracao.contas_internas_configuradas}</strong></p>
                            <p className="rounded-[10px] bg-white p-4">Confianca minima<strong className="mt-1 block text-xl">{Number(dados.configuracao.confianca_minima).toFixed(2)}</strong></p>
                            <p className="rounded-[10px] bg-white p-4">Padrao publico<strong className="mt-1 block text-xl">{dados.configuracao.modo_padrao}</strong></p>
                        </div>
                    </section>
                ) : null}

                {dados?.comparacoes ? (
                    <>
                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <article className="rounded-[14px] bg-app-creme-leve p-5 ring-1 ring-app-baunilha-dourada"><span className="text-xs uppercase text-app-cinza">Comparacoes</span><strong className="mt-3 block text-3xl">{dados.comparacoes}</strong></article>
                            <article className="rounded-[14px] bg-app-creme-leve p-5 ring-1 ring-app-baunilha-dourada"><span className="text-xs uppercase text-app-cinza">Modelo oficial</span><strong className="mt-3 block text-xl">{dados.modelo_oficial}</strong></article>
                            <article className="rounded-[14px] bg-app-creme-leve p-5 ring-1 ring-app-baunilha-dourada"><span className="text-xs uppercase text-app-cinza">Decisao atual</span><strong className="mt-3 block text-lg">{dados.decisao_atual}</strong></article>
                        </div>
                        <section className="mt-8 grid gap-5 lg:grid-cols-2">
                            {dados.modelos.map((modelo) => (
                                <article key={modelo.modelo} className="rounded-[14px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                                    <h2 className="text-xl font-semibold">{modelo.modelo}</h2>
                                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                                        <p>Concordancia <strong className="block text-2xl"><Percentual parte={modelo.concordancias} total={modelo.comparacoes} /></strong></p>
                                        <p>Divergencias <strong className="block text-2xl">{modelo.divergencias}</strong></p>
                                        <p>Confianca media <strong className="block text-xl">{modelo.confianca_media.toFixed(3)}</strong></p>
                                        <p>Falhas <strong className="block text-xl">{modelo.falhas}</strong></p>
                                    </div>
                                    <p className="mt-5 text-xs leading-5 text-app-cinza">Aprovacoes {modelo.resultados.aprovacoes} | recusas {modelo.resultados.recusas} | alternativas {modelo.resultados.alternativas} | conversoes {modelo.resultados.conversoes}</p>
                                    <p className="mt-2 text-xs leading-5 text-app-cinza">Com historico {modelo.com_historico} | sem historico {modelo.sem_historico} | diversidade {modelo.diversidade.restaurantes} restaurantes e {modelo.diversidade.produtos} produtos</p>
                                    <p className="mt-2 text-xs leading-5 text-app-cinza">Confianca: zero {modelo.distribuicao_confianca.zero}, baixa {modelo.distribuicao_confianca.baixa}, moderada {modelo.distribuicao_confianca.moderada}, alta {modelo.distribuicao_confianca.alta}</p>
                                </article>
                            ))}
                        </section>
                    </>
                ) : null}
            </section>
        </main>
    );
}
