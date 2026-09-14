"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const statusTexto = {
    SUGERIDA: "Sugerida",
    APROVADA: "Aprovada",
    RECUSADA: "Recusada",
    ALTERADA: "Alterada",
    CONVERTIDA_RESERVA: "Reserva criada",
    CONVERTIDA_PEDIDO: "Pedido criado",
    CANCELADA: "Cancelada",
};

const statusClasse = {
    SUGERIDA: "text-app-mocha",
    APROVADA: "text-app-verde-sucesso",
    RECUSADA: "text-app-vermelho-erro",
    ALTERADA: "text-app-caramelo-torrado",
    CONVERTIDA_RESERVA: "text-app-verde-sucesso",
    CONVERTIDA_PEDIDO: "text-app-verde-sucesso",
    CANCELADA: "text-app-vermelho-erro",
};

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        arrow: "M19 12H5m6-6-6 6 6 6",
        calendar: "M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
        check: "m5 12 4 4L19 6",
        spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
        x: "M6 6l12 12M18 6 6 18",
    };
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`}><path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function moeda(valor, localeUI) {
    if (valor === null || valor === undefined) return "--";
    return new Intl.NumberFormat(localeUI, { style: "currency", currency: "BRL" }).format(Number(valor));
}

function dataCurta(data, localeUI) {
    if (!data) return "--";
    return new Date(`${data}T12:00:00`).toLocaleDateString(localeUI, { weekday: "short", day: "2-digit", month: "short" });
}

function distancia(valor) {
    if (valor === null || valor === undefined) return "Distância indisponível";
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "--";
    if (numero < 1) return `${Math.max(100, Math.round(numero * 1000 / 100) * 100)} m`;
    return `${numero.toFixed(numero < 10 ? 1 : 0).replace(".", ",")} km`;
}

export default function PlanejamentoRotinaPage() {
    const { ui, localeUI } = useInterface();
    const router = useRouter();
    const [perfil, setPerfil] = useState(null);
    const [planejamento, setPlanejamento] = useState(null);
    const [refeicoes, setRefeicoes] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState("");
    const [confirmacao, setConfirmacao] = useState(null);
    const [edicao, setEdicao] = useState(null);
    const [confirmarGeracao, setConfirmarGeracao] = useState(false);
    const [conflito, setConflito] = useState(false);
    const versoes = { versao_perfil: Number(perfil?.versao ?? 0), versao_planejamento: Number(planejamento?.versao ?? 0) };

    async function carregar() {
        try {
            const [perfilResposta, planejamentoResposta] = await Promise.all([
                apiRequest("/rotina/perfil", { forceRefresh: true }),
                apiRequest("/rotina/planejamento", { forceRefresh: true }),
            ]);
            setPerfil(perfilResposta);
            setPlanejamento(planejamentoResposta?.planejamento ?? null);
            setRefeicoes(planejamentoResposta?.refeicoes ?? []);
            setMensagem("");
            setConflito(false);
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível carregar o planejamento.");
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        let cancelado = false;
        Promise.all([
            apiRequest("/rotina/perfil", { forceRefresh: true }),
            apiRequest("/rotina/planejamento", { forceRefresh: true }),
        ]).then(([perfilResposta, planejamentoResposta]) => {
            if (cancelado) return;
            setPerfil(perfilResposta);
            setPlanejamento(planejamentoResposta?.planejamento ?? null);
            setRefeicoes(planejamentoResposta?.refeicoes ?? []);
        }).catch((error) => {
            if (!cancelado) setMensagem(error.message);
        }).finally(() => {
            if (!cancelado) setCarregando(false);
        });
        return () => { cancelado = true; };
    }, []);

    const resumo = useMemo(() => ({
        sugeridas: refeicoes.filter((item) => item.status === "SUGERIDA").length,
        aprovadas: refeicoes.filter((item) => item.status === "APROVADA").length,
        recusadas: refeicoes.filter((item) => item.status === "RECUSADA").length,
        convertidas: refeicoes.filter((item) => item.status?.startsWith("CONVERTIDA")).length,
    }), [refeicoes]);

    async function gerarPlanejamento() {
        if (processando) return;
        setProcessando("gerar");
        setMensagem("");
        try {
            const resposta = await apiRequest("/rotina/planejamento/gerar", { method: "POST", body: JSON.stringify({ ...versoes, semana_base: planejamento?.semana_inicio }) });
            setPlanejamento(resposta.planejamento);
            setRefeicoes(resposta.refeicoes ?? []);
            setMensagem("Planejamento gerado.");
            setConfirmarGeracao(false);
        } catch (error) {
            if (error.status === 409) setConflito(true);
            setMensagem(error instanceof Error ? error.message : "Não foi possível gerar o planejamento.");
        } finally {
            setProcessando("");
        }
    }

    async function aprovarTudo() {
        if (!planejamento?.id_planejamento_rotina) return;
        setProcessando("aprovar-tudo");
        setMensagem("");
        try {
            const resposta = await apiRequest(`/rotina/planejamento/${planejamento.id_planejamento_rotina}/aprovar`, { method: "POST", body: JSON.stringify(versoes) });
            setPlanejamento(resposta.planejamento);
            setRefeicoes(resposta.refeicoes ?? []);
            setMensagem("Planejamento aprovado.");
        } catch (error) {
            if (error.status === 409) setConflito(true);
            setMensagem(error instanceof Error ? error.message : "Não foi possível aprovar o planejamento.");
        } finally {
            setProcessando("");
        }
    }

    async function atualizarStatus(refeicao, acao) {
        setProcessando(`${acao}-${refeicao.id_refeicao_planejada}`);
        setMensagem("");
        try {
            await apiRequest(`/rotina/refeicoes/${refeicao.id_refeicao_planejada}/${acao}`, { method: "POST", body: JSON.stringify(versoes) });
            await carregar();
        } catch (error) {
            if (error.status === 409) setConflito(true);
            setMensagem(error instanceof Error ? error.message : "Não foi possível atualizar a refeição.");
        } finally {
            setProcessando("");
        }
    }

    async function converter() {
        if (!confirmacao?.refeicao || !confirmacao?.tipo) return;
        const endpoint = confirmacao.tipo === "pedido" ? "converter-pedido" : "converter-reserva";
        setProcessando(`${endpoint}-${confirmacao.refeicao.id_refeicao_planejada}`);
        setMensagem("");
        try {
            const resposta = await apiRequest(`/rotina/refeicoes/${confirmacao.refeicao.id_refeicao_planejada}/${endpoint}`, {
                method: "POST",
                body: JSON.stringify(versoes),
            });
            setConfirmacao(null);
            if (resposta.checkout_href) {
                router.push(resposta.checkout_href);
                return;
            }
            await carregar();
            setMensagem("Reserva criada a partir da rotina.");
        } catch (error) {
            if (error.status === 409) setConflito(true);
            setMensagem(error instanceof Error ? error.message : "Não foi possível converter a sugestão.");
        } finally {
            setProcessando("");
        }
    }

    async function editar(refeicao) {
        setProcessando(`editar-${refeicao.id_refeicao_planejada}`);
        try {
            const opcoes = await apiRequest(`/rotina/refeicoes/${refeicao.id_refeicao_planejada}/opcoes`, { forceRefresh: true });
            const indice = Math.max(0, opcoes.findIndex((item) => item.id_restaurante === refeicao.id_restaurante && item.id_produto === refeicao.id_produto));
            setEdicao({ id: refeicao.id_refeicao_planejada, versoes, opcoes, indice, horario: String(opcoes[indice]?.horario_sugerido ?? refeicao.horario_sugerido).slice(0, 5) });
            setMensagem(opcoes.length ? "" : "Não há alternativas compatíveis com sua rotina para esse dia.");
        } catch (error) {
            setMensagem(error.message);
        } finally {
            setProcessando("");
        }
    }

    async function salvarEdicao(event) {
        event.preventDefault();
        const opcao = edicao?.opcoes[edicao.indice];
        if (!opcao) return;
        setProcessando("salvar-edicao");
        try {
            await apiRequest(`/rotina/refeicoes/${edicao.id}`, { method: "PATCH", body: JSON.stringify({
                ...edicao.versoes,
                id_restaurante: opcao.id_restaurante, id_produto: opcao.id_produto, horario_sugerido: edicao.horario,
            }) });
            setEdicao(null);
            await carregar();
        } catch (error) {
            if (error.status === 409) setConflito(true);
            setMensagem(error.message);
        } finally {
            setProcessando("");
        }
    }

    return (
        <main className="min-h-screen bg-white px-5 py-8 text-app-cafe-profundo">
            <section className="mx-auto max-w-7xl">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/cliente/rotina" className="inline-flex items-center gap-2 text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"><Icon type="arrow" className="h-4 w-4" />{ui("Voltar")}</Link>
                    <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={72} height={72} className="h-12 w-12" />
                </div>

                <header className="mt-8 rounded-[18px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/40 sm:p-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-baunilha-dourada">{ui("Planejamento semanal")}</p>
                            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{ui("Sua semana à mesa")}</h1>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-creme-suave">{ui("Aprove cada refeição, recuse o que não fizer sentido ou converta diretamente em reserva com pedido antecipado.")}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 rounded-[16px] bg-white/10 p-3 text-center ring-1 ring-white/15">
                            <div><p className="text-[10px] uppercase text-app-baunilha-dourada">{ui("Sug.")}</p><strong>{resumo.sugeridas}</strong></div>
                            <div><p className="text-[10px] uppercase text-app-baunilha-dourada">{ui("Apr.")}</p><strong>{resumo.aprovadas}</strong></div>
                            <div><p className="text-[10px] uppercase text-app-baunilha-dourada">{ui("Rec.")}</p><strong>{resumo.recusadas}</strong></div>
                            <div><p className="text-[10px] uppercase text-app-baunilha-dourada">{ui("Conv.")}</p><strong>{resumo.convertidas}</strong></div>
                        </div>
                    </div>
                </header>

                {mensagem ? <p role="status" className="mt-6 rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagem)}</p> : null}
                {conflito ? <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <p>{ui("Nenhuma alteração foi repetida automaticamente. Recarregar fecha a edição e mostra a versão salva.")}</p>
                    <button type="button" disabled={Boolean(processando)} className="rounded-lg border px-4 py-2 font-semibold" onClick={() => {
                        setEdicao(null); setConfirmacao(null); setConfirmarGeracao(false); carregar();
                    }}>{ui("Recarregar dados")}</button>
                </div> : null}

                <section className="mt-6 rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/65">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Controle")}</p>
                            <h2 className="mt-1 text-2xl font-semibold">
                                {planejamento ? `${dataCurta(planejamento.semana_inicio, localeUI)} - ${dataCurta(planejamento.semana_fim, localeUI)}` : ui("Nenhuma semana gerada")}
                            </h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/cliente/rotina/configurar" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Configurar")}</Link>
                            <button type="button" disabled={Boolean(processando) || !perfil} onClick={() => planejamento ? setConfirmarGeracao(true) : gerarPlanejamento()} className="h-10 rounded-[8px] bg-app-caramelo-torrado px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:opacity-50">{ui(processando === "gerar" ? "Gerando..." : "Gerar semana")}</button>
                            <button type="button" disabled={Boolean(processando) || !refeicoes.some((item) => item.id_restaurante && ["SUGERIDA", "ALTERADA"].includes(item.status))} onClick={aprovarTudo} className="h-10 rounded-[8px] bg-app-cafe-profundo px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:opacity-50">{ui("Aprovar tudo")}</button>
                        </div>
                    </div>
                    {!perfil ? <p className="mt-4 rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm text-app-cinza">{ui("Configure sua rotina antes de gerar sugestões.")}</p> : null}
                </section>

                {carregando ? <p className="mt-6 rounded-[16px] bg-white p-8 text-sm font-semibold shadow-sm ring-1 ring-app-baunilha-dourada/60">{ui("Carregando planejamento...")}</p> : null}

                {!carregando && !refeicoes.length ? (
                    <section className="mt-6 rounded-[18px] border border-dashed border-app-baunilha-dourada bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve"><Icon type="spark" /></div>
                        <h2 className="mt-4 text-2xl font-semibold">{ui("Nenhuma sugestão ainda")}</h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-app-cinza">{ui("Gere a semana para receber refeições sugeridas com base no seu perfil de rotina.")}</p>
                    </section>
                ) : null}

                <div className="mt-6 grid gap-4">
                    {refeicoes.map((refeicao) => {
                        const restaurante = refeicao.restaurantes;
                        const produto = refeicao.produtos;
                        const semSugestao = refeicao.metadados?.sem_sugestao || !refeicao.id_restaurante;
                        const convertida = refeicao.status?.startsWith("CONVERTIDA");
                        return (
                            <article key={refeicao.id_refeicao_planejada} className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/65">
                                <div className="grid gap-0 md:grid-cols-[150px_1fr]">
                                    <div className="flex flex-col justify-center border-b border-app-baunilha-dourada/45 bg-white p-5 text-center md:border-b-0 md:border-r">
                                        <Icon type="calendar" className="mx-auto h-6 w-6 text-app-caramelo-torrado" />
                                        <strong className="mt-3 text-2xl">{dataCurta(refeicao.data_refeicao, localeUI)}</strong>
                                        <span className="mt-1 text-sm font-semibold text-app-mocha">{String(refeicao.horario_sugerido ?? "").slice(0, 5)}</span>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${statusClasse[refeicao.status] ?? "text-app-mocha"}`}>{ui(statusTexto[refeicao.status] ?? refeicao.status)}</p>
                                                <h3 className="mt-2 text-2xl font-semibold">{semSugestao ? ui("Sem sugestão compatível") : restaurante?.nome ?? ui("Restaurante")}</h3>
                                                <p className="mt-2 text-sm leading-6 text-app-cinza">{refeicao.motivo_recomendacao}</p>
                                            </div>
                                            {!semSugestao ? (
                                                <div className="grid gap-2 rounded-[14px] border border-app-baunilha-dourada/60 bg-white p-4 text-sm sm:min-w-56">
                                                    <span className="font-semibold">{produto?.nome ?? ui("Reserva sem item")}</span>
                                                    <span className="text-app-mocha">{moeda(refeicao.preco_estimado, localeUI)} · {distancia(refeicao.distancia_km)}</span>
                                                    <span className="text-xs text-app-cinza">{refeicao.tempo_estimado_minutos} {ui("min estimados, incluindo ida e volta")}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {!convertida ? <button type="button" disabled={Boolean(processando)} onClick={() => editar(refeicao)} className="h-10 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:opacity-50">{ui("Alterar refeição")}</button> : null}
                                            {!semSugestao && !convertida && refeicao.status !== "APROVADA" ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => atualizarStatus(refeicao, "aprovar")} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-app-cafe-profundo px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:opacity-50"><Icon type="check" className="h-4 w-4" />{ui("Aprovar")}</button>
                                            ) : null}
                                            {!semSugestao && !convertida && refeicao.status !== "RECUSADA" ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => atualizarStatus(refeicao, "recusar")} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-red-300 px-4 text-xs font-bold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50 disabled:opacity-50"><Icon type="x" className="h-4 w-4" />{ui("Recusar")}</button>
                                            ) : null}
                                            {!semSugestao && !convertida && refeicao.status !== "RECUSADA" ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmacao({ tipo: "reserva", refeicao })} className="h-10 rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:opacity-50">{ui("Criar reserva")}</button>
                                            ) : null}
                                            {!semSugestao && !convertida && refeicao.status !== "RECUSADA" && refeicao.id_produto ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmacao({ tipo: "pedido", refeicao })} className="h-10 rounded-[8px] bg-app-caramelo-torrado px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:opacity-50">{ui("Reserva com pedido")}</button>
                                            ) : null}
                                            {refeicao.id_reserva ? <Link href="/cliente/reservas" className="inline-flex h-10 items-center rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Ver reserva")}</Link> : null}
                                            {refeicao.id_pedido ? <Link href={`/cliente/pedidos/${refeicao.id_pedido}`} className="inline-flex h-10 items-center rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Ver pedido")}</Link> : null}
                                        </div>
                                        {edicao?.id === refeicao.id_refeicao_planejada && edicao.opcoes.length > 0 ? (
                                            <form onSubmit={salvarEdicao} className="mt-5 grid gap-4 rounded-xl border border-app-baunilha-dourada p-4 sm:grid-cols-[minmax(0,1fr)_150px]">
                                                <label className="min-w-0 text-sm font-semibold">{ui("Restaurante e prato")}
                                                    <select value={edicao.indice} onChange={(event) => {
                                                        const indice = Number(event.target.value);
                                                        setEdicao({ ...edicao, indice, horario: edicao.opcoes[indice].horario_sugerido.slice(0, 5) });
                                                    }} className="mt-2 w-full min-w-0 rounded-lg border border-app-baunilha-dourada bg-white p-3">
                                                        {edicao.opcoes.map((opcao, indice) => <option key={`${opcao.id_restaurante}-${opcao.id_produto}`} value={indice}>{opcao.restaurante} · {opcao.prato ?? ui("Somente reserva")} · {moeda(opcao.preco_estimado, localeUI)}</option>)}
                                                    </select>
                                                </label>
                                                <label className="text-sm font-semibold">{ui("Horário")}
                                                    <input type="time" required value={edicao.horario} onChange={(event) => setEdicao({ ...edicao, horario: event.target.value })} className="mt-2 w-full min-w-0 rounded-lg border border-app-baunilha-dourada bg-white p-3" />
                                                </label>
                                                <div className="flex flex-wrap gap-3 sm:col-span-2">
                                                    <button disabled={Boolean(processando)} className="rounded-lg bg-app-caramelo-torrado px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{ui("Salvar alteração")}</button>
                                                    <button type="button" disabled={Boolean(processando)} onClick={() => setEdicao(null)} className="rounded-lg border border-app-baunilha-dourada px-4 py-3 text-sm hover:bg-app-chantilly">{ui("Voltar")}</button>
                                                </div>
                                            </form>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <ConfirmationDialog
                open={Boolean(confirmacao)}
                eyebrow={ui(confirmacao?.tipo === "pedido" ? "Pedido antecipado" : "Reserva")}
                title={ui(confirmacao?.tipo === "pedido" ? "Criar reserva com pedido?" : "Criar reserva a partir desta sugestão?")}
                description={ui(confirmacao?.tipo === "pedido" ? "A Appono criará a reserva e o pedido pendente. Em seguida você será direcionado ao pagamento." : "A Appono criará uma reserva confirmada no horário sugerido, se houver mesa disponível.")}
                confirmLabel={ui(confirmacao?.tipo === "pedido" ? "Criar e pagar" : "Criar reserva")}
                cancelLabel={ui("Voltar")}
                variant={confirmacao?.tipo === "pedido" ? "default" : "default"}
                loading={Boolean(processando?.includes("converter"))}
                onCancel={() => setConfirmacao(null)}
                onConfirm={converter}
                details={confirmacao?.refeicao ? (
                    <div>
                        <p className="font-semibold">{confirmacao.refeicao.restaurantes?.nome ?? ui("Restaurante")}</p>
                        <p className="mt-1 text-xs text-app-cinza">{dataCurta(confirmacao.refeicao.data_refeicao, localeUI)} {ui("às")} {String(confirmacao.refeicao.horario_sugerido ?? "").slice(0, 5)}</p>
                    </div>
                ) : null}
            />
            <ConfirmationDialog open={confirmarGeracao} title={ui("Gerar novas sugestões?")} description={ui("As sugestões da semana serão recalculadas. Reservas e pedidos já criados serão preservados.")} confirmLabel={ui("Gerar sugestões")} variant="default" loading={processando === "gerar"} onConfirm={gerarPlanejamento} onCancel={() => setConfirmarGeracao(false)} />
        </main>
    );
}
