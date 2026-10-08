"use client";
import { useInterface } from "@/lib/use-interface";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { RestaurantIcon as Icon } from "@/components/restaurante/restaurant-icon";
export default function RestaurantPerformancePage() {
    const { ui, localeUI } = useInterface();
    const [session] = useState(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const storedSession = window.localStorage.getItem("appono:session");
        return storedSession ? JSON.parse(storedSession) : null;
    });
    const [dados, setDados] = useState({ items: [], total: 0, metricas: {} });
    const [estadoAvaliacoes, setEstadoAvaliacoes] = useState("carregando");
    const [erroAvaliacoes, setErroAvaliacoes] = useState("");
    const [periodo, setPeriodo] = useState("semanal");
    const [periodoGrafico, setPeriodoGrafico] = useState("mensal");
    const anoAtual = new Date().getFullYear();
    const [anoGrafico, setAnoGrafico] = useState(anoAtual);
    const [paginaAvaliacoes, setPaginaAvaliacoes] = useState(1);
    const [desempenho, setDesempenho] = useState(null);
    const [estadoDesempenho, setEstadoDesempenho] = useState("carregando");
    const isRestaurant = session?.type === "restaurant";
    useEffect(() => {
        if (!isRestaurant) return;
        const controller = new AbortController();
        let expirou = false;
        const timeout = window.setTimeout(() => { expirou = true; controller.abort(); }, 10000);
        apiRequest(`/restaurantes/me/avaliacoes?page=${paginaAvaliacoes}&page_size=5`, { signal: controller.signal }).then((resposta) => {
            setDados(resposta ?? { items: [], total: 0, metricas: {} });
            setEstadoAvaliacoes((resposta?.total ?? 0) > 0 ? "com_dados" : "vazio");
        }).catch((error) => {
            if (error?.name !== "AbortError" || expirou) {
                setEstadoAvaliacoes("erro");
                setErroAvaliacoes(expirou ? "As avaliações demoraram demais para carregar. Tente novamente." : error instanceof Error ? error.message : "Não foi possível carregar as avaliações.");
            }
        }).finally(() => window.clearTimeout(timeout));
        return () => { window.clearTimeout(timeout); controller.abort(); };
    }, [isRestaurant, paginaAvaliacoes]);
    useEffect(() => {
        if (!isRestaurant) return;
        const controller = new AbortController();
        let expirou = false;
        const timeout = window.setTimeout(() => { expirou = true; controller.abort(); }, 10000);
        apiRequest(`/restaurante/desempenho?periodo=${periodo}`, { signal: controller.signal, cacheTtlMs: 0 }).then((resultado) => {
            setDesempenho(resultado);
            setEstadoDesempenho("pronto");
        }).catch((error) => {
            if (error?.name !== "AbortError" || expirou) setEstadoDesempenho("erro");
        }).finally(() => window.clearTimeout(timeout));
        return () => { window.clearTimeout(timeout); controller.abort(); };
    }, [isRestaurant, periodo]);
    const totalAvaliacoes = Number(dados.total > 0 ? dados.total : dados.metricas?.total_avaliacoes > 0 ? dados.metricas.total_avaliacoes : desempenho?.avaliacoes?.quantidade ?? 0);
    const avaliacaoMedia = Number(dados.metricas?.avaliacao_media ?? desempenho?.avaliacoes?.media ?? 0);
    const possuiAvaliacoes = totalAvaliacoes > 0 || Number(desempenho?.avaliacoes?.quantidade ?? 0) > 0;
    const volumes = [];
    const maiorVolume = 1;
    const anosGrafico = [];
    const comentarios = useMemo(() => (dados.items ?? []).filter((item) => item.comentario), [dados.items]);
    const alterarPeriodo = (valor) => { setEstadoDesempenho("carregando"); setPeriodo(valor); };
    if (!isRestaurant) {
        return (<main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">{ui("Entrar")}</Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-white text-app-cafe-profundo">


      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div>
          <h1 className="text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">{ui("Desempenho & Avaliações")}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza sm:text-base">{ui("Acompanhe a experiência dos clientes e os principais indicadores de atendimento.")}</p>
        </div>

        <section className="mt-8 rounded-xl border border-app-baunilha-dourada/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">{ui("Indicadores do período")}</h2><p className="mt-1 text-sm text-app-cinza">{ui("Calculados com reservas, pedidos e avaliações deste restaurante.")}</p></div><select value={periodo} onChange={(e) => alterarPeriodo(e.target.value)} className="rounded-lg border border-app-baunilha-dourada px-4 py-2"><option value="semanal">Semanal</option><option value="mensal">Mensal</option></select></div>
          {estadoDesempenho === "carregando" ? <p className="mt-5 text-sm text-app-cinza">{ui("Carregando indicadores...")}</p> : estadoDesempenho === "erro" ? <p role="alert" className="mt-5 rounded-lg bg-app-creme-leve p-4 text-sm text-app-cinza">{ui("Não foi possível carregar os indicadores agora.")}</p> : !desempenho?.possui_amostra ? <p className="mt-5 rounded-lg bg-app-creme-leve p-4 text-sm text-app-cinza">{ui("Ainda não há operações neste período para calcular desempenho.")}</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[["Reservas criadas", desempenho.reservas.criadas], ["Reservas concluídas", desempenho.reservas.concluidas], ["Cancelamentos", desempenho.reservas.canceladas], ["Não comparecimentos", desempenho.reservas.nao_comparecimentos], ["Pedidos criados", desempenho.pedidos.criados], ["Pedidos entregues", desempenho.pedidos.entregues], ["Taxa de conclusão", desempenho.reservas.taxa_conclusao == null ? "Sem amostra" : `${desempenho.reservas.taxa_conclusao}%`], ["Ticket médio", desempenho.pedidos.ticket_medio == null ? "Sem amostra" : new Intl.NumberFormat(localeUI, { style: "currency", currency: "BRL" }).format(desempenho.pedidos.ticket_medio)]].map(([label, valor]) => <article key={label} className="rounded-lg bg-app-creme-leve p-4"><p className="text-sm text-app-cinza">{ui(label)}</p><strong className="mt-2 block text-2xl">{ui(String(valor))}</strong></article>)}
          </div>}
          {desempenho?.serie?.length ? <div className="mt-8 rounded-lg border border-app-baunilha-dourada/60 p-4"><h3 className="font-semibold">{ui("Movimento do período")}</h3><div className="mt-5 grid grid-cols-7 items-end gap-2 sm:grid-cols-10">{desempenho.serie.map((ponto) => { const maximo = Math.max(...desempenho.serie.map((item) => item.pedidos + item.reservas), 1); const altura = Math.max(8, ((ponto.pedidos + ponto.reservas) / maximo) * 100); return <div key={ponto.data} className="flex min-w-0 flex-col items-center gap-2"><div title={`${ponto.pedidos} pedidos · ${ponto.reservas} reservas`} className="w-full rounded-t bg-app-caramelo-torrado" style={{ height: `${altura}px` }}/><span className="max-w-full truncate text-[10px] text-app-cinza">{ponto.data.slice(5, 10)}</span></div>; })}</div></div> : null}
          <div className="mt-6 border-t border-app-baunilha-dourada/60 pt-5"><p className="text-sm text-app-cinza">{ui("Para criar uma campanha, escolha uma sugestão da Appono quando houver dados agregados suficientes ou crie sua própria oferta.")}</p><Link href="/restaurante/campanhas#sugestoes-appono" className="mt-3 inline-flex rounded-lg bg-app-cafe-profundo px-4 py-2 text-sm font-semibold text-white">{ui("Ver sugestões para campanhas")}</Link></div>
        </section>

        {possuiAvaliacoes ? <><div className="mt-10 grid gap-8 lg:grid-cols-[0.42fr_1fr]">
          <article className="rounded-[8px] bg-white p-7 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">{ui("Média geral")}</p>
            <div className="mt-8 flex items-end gap-3">
              <strong className="text-6xl font-medium leading-none text-app-cafe-profundo">
                {possuiAvaliacoes ? avaliacaoMedia.toFixed(1) : "--"}
              </strong>
              <span className="pb-2 text-2xl text-app-mocha">/ 5.0</span>
            </div>
            <div className="mt-6 flex gap-1 text-app-caramelo-torrado" aria-label={ui("Nota média: {0} de 5", [avaliacaoMedia.toFixed(1)])}>
              {Array.from({ length: 5 }).map((_, index) => (<Icon key={index} type="star" className={`h-6 w-6 ${index < Math.round(avaliacaoMedia) ? "fill-current" : ""}`}/>))}
            </div>
            <div className="mt-10 rounded-[8px] bg-app-creme-leve p-5">
              <p className="text-sm text-app-cinza">
                {totalAvaliacoes ? ui("{0} avaliação(ões) recebida(s).", [totalAvaliacoes]) : ui("Nenhuma avaliação recebida até o momento.")}
              </p>
            </div>
          </article>

          {false && <article className="rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-mocha">{ui("Volume de avaliações")}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-app-cinza">
                <button type="button" onClick={() => { setPeriodoGrafico("mensal"); alterarPeriodo("mensal"); }} className={periodoGrafico === "mensal" ? "text-app-caramelo-torrado" : ""}>{ui("Mensal")}</button>
                <button type="button" onClick={() => { setPeriodoGrafico("semanal"); alterarPeriodo("semanal"); }} className={periodoGrafico === "semanal" ? "text-app-caramelo-torrado" : ""}>{ui("Semanal")}</button>
                {periodoGrafico === "mensal" ? <label className="inline-flex items-center gap-2"><span className="sr-only">{ui("Ano")}</span><select value={anoGrafico} onChange={(event) => setAnoGrafico(Number(event.target.value))} className="rounded border border-app-baunilha-dourada bg-white px-2 py-1 text-sm font-semibold text-app-cafe-profundo">{anosGrafico.map((ano) => <option key={ano} value={ano}>{ano}</option>)}</select></label> : null}
              </div>
            </div>

            <div className="mt-10 flex min-h-[280px] items-end gap-3 overflow-x-auto rounded-[8px] border border-dashed border-app-caramelo-torrado/25 bg-app-creme-leve px-5 py-6 sm:gap-5">
              <div className="flex h-full min-w-full items-end gap-3 sm:gap-5">
                {volumes.map((ponto) => (<div key={ponto.chave} className="flex h-full min-w-[48px] flex-1 flex-col items-center justify-end gap-2"><div title={ui("{0} avaliações", [ponto.total])} className="w-full rounded-t-[8px] bg-app-caramelo-torrado" style={{ height: `${Math.max((ponto.total / maiorVolume) * 100, ponto.total ? 8 : 2)}%` }}/><span className="text-[10px] font-bold text-app-cinza">{ponto.label}</span></div>))}
              </div>
            </div>
          </article>}
        <section className="rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
          <h2 className="text-2xl font-medium text-app-cafe-profundo">{ui("O que dizem os frequentadores")}</h2>
          {comentarios.length ? <div className="mt-8 grid gap-4 lg:grid-cols-2">{comentarios.map((item) => <article key={item.id_avaliacao} className="rounded-[10px] bg-white p-5 ring-1 ring-app-baunilha-dourada/60"><p className="font-bold text-app-caramelo-torrado">{item.nota}/5</p><p className="mt-2 text-sm leading-6 text-app-mocha">{item.comentario}</p><p className="mt-3 text-xs text-app-cinza">{item.clientes?.nome ?? ui("Cliente Appono")}</p></article>)}</div> : <p className="mt-5 text-sm text-app-cinza">{ui("Nenhum comentário foi escrito nesta página.")}</p>}
          {totalAvaliacoes > 5 ? <div className="mt-6 flex items-center justify-between gap-4"><button type="button" disabled={paginaAvaliacoes <= 1} onClick={() => setPaginaAvaliacoes((pagina) => Math.max(1, pagina - 1))} className="rounded-lg border border-app-baunilha-dourada px-4 py-2 text-sm font-semibold disabled:opacity-40">{ui("Anterior")}</button><span className="text-sm text-app-cinza">{ui("Página {0} de {1}", [paginaAvaliacoes, Math.ceil(totalAvaliacoes / 5)])}</span><button type="button" disabled={paginaAvaliacoes >= Math.ceil(totalAvaliacoes / 5)} onClick={() => setPaginaAvaliacoes((pagina) => pagina + 1)} className="rounded-lg border border-app-baunilha-dourada px-4 py-2 text-sm font-semibold disabled:opacity-40">{ui("Próxima")}</button></div> : null}
        </section></div></> : null}
        {estadoAvaliacoes === "vazio" ? <p className="mt-8 text-sm text-app-cinza">{ui("Ainda não há avaliações recebidas.")}</p> : null}
        {estadoAvaliacoes === "erro" ? <p role="alert" className="mt-8 text-sm text-app-cinza">{ui(erroAvaliacoes)}</p> : null}

        <p className="mt-8 text-sm text-app-cinza">{ui("As notas atuais representam a experiência geral. Categorias detalhadas serão disponibilizadas quando o formulário passar a coletar essas dimensões.")}</p>
      </section>


    </main>);
}
