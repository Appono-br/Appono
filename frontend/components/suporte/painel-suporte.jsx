"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { textoMotivoSuporte, textoStatusSuporte } from "@/lib/formatadores-status";
import { useInterface } from "@/lib/use-interface";
import { ArrowLeft } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const motivos = [
    { value: "PEDIDO_NAO_PRONTO", label: "Pedido não estava pronto" },
    { value: "PEDIDO_INCORRETO", label: "Pedido incorreto" },
    { value: "RESERVA_NAO_RECONHECIDA", label: "Reserva não reconhecida" },
    { value: "MESA_INDISPONIVEL", label: "Mesa indisponível" },
    { value: "RESTAURANTE_INDISPONIVEL", label: "Restaurante indisponível" },
    { value: "PAGAMENTO", label: "Problema com pagamento" },
    { value: "REEMBOLSO", label: "Quero solicitar reembolso" },
    { value: "ATENDIMENTO", label: "Atendimento" },
    { value: "OUTRO", label: "Outro problema" },
];

const filtros = [
    { value: "TODOS", label: "Todos" },
    { value: "ABERTO", label: "Abertos" },
    { value: "AGUARDANDO_RESTAURANTE", label: "Restaurante" },
    { value: "AGUARDANDO_CLIENTE", label: "Cliente" },
    { value: "EM_ANALISE_ADMIN", label: "Appono" },
    { value: "RESOLVIDO", label: "Resolvidos" },
];

const prioridades = [
    { value: "TODAS", label: "Todas" },
    { value: "CRITICA", label: "Crítica" },
    { value: "ALTA", label: "Alta" },
    { value: "MEDIA", label: "Média" },
];

function formatarData(valor, localeUI = "pt-BR") {
    if (!valor) return "Sem data";
    return new Intl.DateTimeFormat(localeUI, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));
}

function classeStatus(status) {
    if (status === "RESOLVIDO") return "support-status-resolvido bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (status === "RECUSADO" || status === "CANCELADO") return "bg-red-50 text-red-700 ring-red-200";
    if (status === "EM_ANALISE_ADMIN") return "bg-app-dourado-mel/15 text-app-cafe-profundo ring-app-dourado-mel/45";
    return "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo";
}

function obterTitulo(chamado, perfil) {
    if (!chamado) return "Chamado";
    if (perfil === "cliente") return chamado.restaurantes?.nome ?? "Restaurante";
    if (perfil === "restaurante") return chamado.clientes?.nome ?? "Cliente";
    return `${chamado.restaurantes?.nome ?? "Restaurante"} · ${chamado.clientes?.nome ?? "Cliente"}`;
}

function contextoChamado(chamado) {
    const partes = [];
    if (chamado?.id_pedido) partes.push(`Pedido #${chamado.id_pedido}`);
    if (chamado?.id_reserva) partes.push(`Reserva #${chamado.id_reserva}`);
    if (chamado?.solicita_reembolso) partes.push("Reembolso solicitado");
    return partes.join(" · ") || "Chamado direto";
}

function obterReembolso(chamado) {
    const relacao = chamado?.solicitacoes_reembolso;
    return Array.isArray(relacao) ? relacao[0] : relacao;
}

function classeReembolso(status) {
    if (status === "CONCLUIDO") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (status === "RECUSADO" || status === "CANCELADO") return "bg-red-50 text-red-700 ring-red-200";
    if (status === "APROVADO") return "bg-blue-50 text-blue-700 ring-blue-200";
    return "bg-amber-50 text-amber-700 ring-amber-200";
}

function textoReembolso(status) {
    const map = { SOLICITADO: "Aguardando análise", EM_ANALISE: "Em análise", APROVADO: "Aprovado", RECUSADO: "Recusado", CONCLUIDO: "Concluído", CANCELADO: "Cancelado" };
    return map[status] ?? status;
}


function estadoInicialForm(searchParams) {
    return {
        id_pedido: searchParams.get("pedido") ?? "",
        id_reserva: searchParams.get("reserva") ?? "",
        id_restaurante: searchParams.get("restaurante") ?? "",
        motivo: searchParams.get("motivo") ?? "PEDIDO_NAO_PRONTO",
        descricao: "",
        solicita_reembolso: searchParams.get("reembolso") === "1",
    };
}

function obterParametrosIniciais() {
    if (typeof window === "undefined") {
        return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
}

export function PainelSuporte({ perfil, embutido = false }) {
    const Container = embutido ? "div" : "main";
    const Heading = embutido ? "h2" : "h1";
    const { ui, localeUI } = useInterface();
    const parametrosIniciais = useMemo(() => obterParametrosIniciais(), []);
    const [chamados, setChamados] = useState([]);
    const [detalhe, setDetalhe] = useState(null);
    const [filtro, setFiltro] = useState("TODOS");
    const [filtroMotivo, setFiltroMotivo] = useState("TODOS");
    const [filtroPrioridade, setFiltroPrioridade] = useState("TODAS");
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [processando, setProcessando] = useState(false);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [confirmacao, setConfirmacao] = useState(null);
    const [form, setForm] = useState(() => estadoInicialForm(parametrosIniciais));
    const [mostrarNovo, setMostrarNovo] = useState(() => perfil === "cliente" && Boolean(parametrosIniciais.get("pedido") || parametrosIniciais.get("reserva") || parametrosIniciais.get("restaurante")));
    const [respostaReembolso, setRespostaReembolso] = useState("");

    const carregarChamados = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const resposta = await apiRequest("/suporte", { forceRefresh: true });
            setChamados(resposta.items ?? []);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível carregar os chamados.");
        } finally {
            setCarregando(false);
        }
    }, []);

    const carregarDetalhe = useCallback(async (id) => {
        setErro("");
        try {
            const resposta = await apiRequest(`/suporte/${id}`, { forceRefresh: true });
            setDetalhe(resposta.chamado);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível carregar o chamado.");
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void carregarChamados();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [carregarChamados]);

    const chamadosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return chamados.filter((chamado) => {
            const statusOk = filtro === "TODOS" || chamado.status === filtro;
            const motivoOk = filtroMotivo === "TODOS" || chamado.motivo === filtroMotivo;
            const prioridadeOk = filtroPrioridade === "TODAS" || chamado.prioridade === filtroPrioridade;
            const texto = [
                chamado.id_chamado,
                chamado.id_pedido,
                chamado.id_reserva,
                chamado.motivo,
                textoMotivoSuporte(chamado.motivo),
                chamado.status,
                chamado.clientes?.nome,
                chamado.restaurantes?.nome,
                chamado.descricao,
            ].filter(Boolean).join(" ").toLowerCase();
            return statusOk && motivoOk && prioridadeOk && (!termo || texto.includes(termo));
        });
    }, [busca, chamados, filtro, filtroMotivo, filtroPrioridade]);

    async function abrirChamado(event) {
        event.preventDefault();
        setProcessando(true);
        setErro("");
        try {
            const body = {
                motivo: form.motivo,
                descricao: form.descricao,
                solicita_reembolso: form.solicita_reembolso,
                id_pedido: form.id_pedido ? Number(form.id_pedido) : undefined,
                id_reserva: form.id_reserva ? Number(form.id_reserva) : undefined,
                id_restaurante: form.id_restaurante ? Number(form.id_restaurante) : undefined,
            };
            const chamado = await apiRequest("/suporte", { method: "POST", body: JSON.stringify(body) });
            setForm(estadoInicialForm(new URLSearchParams()));
            setMostrarNovo(false);
            await carregarChamados();
            setDetalhe(chamado);
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível abrir o chamado.");
        } finally {
            setProcessando(false);
        }
    }

    async function enviarMensagem(event) {
        event.preventDefault();
        if (!detalhe || !mensagem.trim()) return;
        setProcessando(true);
        setErro("");
        try {
            await apiRequest(`/suporte/${detalhe.id_chamado}/mensagens`, {
                method: "POST",
                body: JSON.stringify({ conteudo: mensagem }),
            });
            setMensagem("");
            await carregarDetalhe(detalhe.id_chamado);
            await carregarChamados();
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível enviar a mensagem.");
        } finally {
            setProcessando(false);
        }
    }

    async function executarAcao(acao, extras = {}) {
        if (!detalhe) return;
        setProcessando(true);
        setErro("");
        try {
            const resposta = await apiRequest(`/suporte/${detalhe.id_chamado}`, {
                method: "PATCH",
                body: JSON.stringify({ acao, mensagem, ...extras }),
            });
            setMensagem("");
            setConfirmacao(null);
            setDetalhe(resposta.chamado ?? resposta);
            await carregarChamados();
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível atualizar o chamado.");
        } finally {
            setProcessando(false);
        }
    }

    async function analisarReembolso(idReembolso, decisao) {
        setProcessando(true);
        setErro("");
        try {
            await apiRequest(`/reembolsos/${idReembolso}/analisar`, {
                method: "PATCH",
                body: JSON.stringify({ decisao, resposta: respostaReembolso || (decisao === "APROVAR" ? "Reembolso aprovado via suporte." : respostaReembolso) }),
            });
            setRespostaReembolso("");
            setConfirmacao(null);
            if (detalhe) await carregarDetalhe(detalhe.id_chamado);
            await carregarChamados();
        } catch (error) {
            setErro(error instanceof Error ? error.message : "Não foi possível processar o reembolso.");
        } finally {
            setProcessando(false);
        }
    }

    const totalAbertos = chamados.filter((item) => !["RESOLVIDO", "RECUSADO", "CANCELADO"].includes(item.status)).length;
    const reembolsoDetalhe = obterReembolso(detalhe);

    return (
        <Container className={embutido ? "@container/suporte min-w-0 text-app-cafe-profundo" : "@container/suporte min-h-screen bg-white px-5 py-10 text-app-cafe-profundo"}>
            <section className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-4 @min-[640px]/suporte:flex-row @min-[640px]/suporte:items-center @min-[640px]/suporte:justify-between">
                    <div className="min-w-0 flex-1">
                        {!embutido && <Link href={perfil === "cliente" ? "/cliente/configuracoes" : perfil === "restaurante" ? "/restaurante/dashboard" : "/admin/financeiro"} className="inline-flex items-center gap-1.5 text-sm font-bold text-app-caramelo-torrado">
                            <ArrowLeft size={16} aria-hidden="true" />
                            {ui(perfil === "cliente" ? "Voltar às configurações" : "Voltar")}
                        </Link>}
                        <p className={`${embutido ? "" : "mt-8 "}text-[10px] font-bold uppercase tracking-[0.22em] text-app-caramelo-torrado`}>{ui("Suporte Appono")}</p>
                        <Heading className={embutido ? "mt-2 text-3xl font-medium" : "mt-2 text-4xl font-semibold sm:text-5xl"}>{ui(perfil === "cliente" ? "Meus chamados" : "Central de suporte")}</Heading>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-app-cinza">
                            {ui("Registre, acompanhe e resolva ocorrências com protocolo, contexto e histórico preservado.")}
                        </p>
                    </div>
                    <article className="support-acompanhamento-card shrink-0 rounded bg-app-cafe-profundo p-5 text-app-creme-leve shadow-sm @min-[640px]/suporte:min-w-52">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-baunilha-dourada">{ui("Em acompanhamento")}</p>
                        <strong className="mt-3 block text-3xl">{totalAbertos}</strong>
                    </article>
                </div>

                {erro ? <p role="alert" className="mt-6 rounded bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">{ui(erro)}</p> : null}

                {perfil === "cliente" ? (
                    <section className="mt-8 rounded bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold">{ui("Abrir chamado")}</h2>
                            </div>
                            <button type="button" onClick={() => setMostrarNovo((atual) => !atual)} className="rounded bg-app-cafe-profundo px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                                {ui(mostrarNovo ? "Fechar formulário" : "Novo chamado")}
                            </button>
                        </div>
                        {mostrarNovo ? (
                            <form onSubmit={abrirChamado} className="mt-5 grid gap-4 lg:grid-cols-3">
                                <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">
                                    {ui("Motivo")}
                                    <select value={form.motivo} onChange={(event) => setForm((atual) => ({ ...atual, motivo: event.target.value }))} className="h-11 rounded border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo">
                                        {motivos.map((item) => <option key={item.value} value={item.value}>{ui(item.label)}</option>)}
                                    </select>
                                </label>
                                <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">
                                    {ui("Pedido")}
                                    <input value={form.id_pedido} onChange={(event) => setForm((atual) => ({ ...atual, id_pedido: event.target.value }))} inputMode="numeric" placeholder={ui("Ex: 54")} className="h-11 rounded border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo" />
                                </label>
                                <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado">
                                    {ui("Reserva ou restaurante")}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={form.id_reserva} onChange={(event) => setForm((atual) => ({ ...atual, id_reserva: event.target.value }))} inputMode="numeric" placeholder={ui("Reserva")} className="h-11 rounded border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo" />
                                        <input value={form.id_restaurante} onChange={(event) => setForm((atual) => ({ ...atual, id_restaurante: event.target.value }))} inputMode="numeric" placeholder={ui("Restaurante")} className="h-11 rounded border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo" />
                                    </div>
                                </label>
                                <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado lg:col-span-3">
                                    {ui("Descrição")}
                                    <textarea value={form.descricao} onChange={(event) => setForm((atual) => ({ ...atual, descricao: event.target.value }))} rows={4} maxLength={1200} placeholder={ui("Explique o ocorrido. Inclua horário, pedido, chegada e o que foi informado pelo restaurante.")} className="rounded border border-app-baunilha-dourada bg-white p-3 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo" />
                                </label>
                                <label className="flex items-center gap-3 text-sm font-semibold text-app-mocha lg:col-span-2">
                                    <input type="checkbox" checked={form.solicita_reembolso} onChange={(event) => setForm((atual) => ({ ...atual, solicita_reembolso: event.target.checked }))} />
                                    {ui("Este caso pode exigir reembolso")}
                                </label>
                                <button type="submit" disabled={processando || form.descricao.trim().length < 10} className="h-11 rounded bg-app-dourado-mel px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-50">
                                    {ui(processando ? "Abrindo..." : "Abrir chamado")}
                                </button>
                            </form>
                        ) : null}
                    </section>
                ) : null}

                <section className={`mt-8 grid gap-6 ${embutido ? "" : "lg:grid-cols-[420px_minmax(0,1fr)]"}`}>
                    <aside className="@container/filtros min-w-0 rounded bg-white p-4 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                        <label className="campo-busca-app flex h-11 items-center rounded border border-app-baunilha-dourada/70 bg-white px-4 transition">
                            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder={ui("Buscar chamado, cliente, restaurante ou pedido...")} className="input-busca-app h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo placeholder:text-app-cinza/60" />
                        </label>
                        <div className="mt-4 grid gap-3 border-t border-app-baunilha-dourada/50 pt-4 @min-[340px]/filtros:grid-cols-2">
                            <label className="grid min-w-0 gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-app-caramelo-torrado">
                                {ui("Motivo")}
                                <select value={filtroMotivo} onChange={(event) => setFiltroMotivo(event.target.value)} className="h-10 min-w-0 w-full rounded-[9px] border border-app-baunilha-dourada bg-white px-3 text-xs font-semibold normal-case tracking-normal text-app-cafe-profundo">
                                    <option value="TODOS">{ui("Todos")}</option>
                                    {motivos.map((item) => <option key={item.value} value={item.value}>{ui(item.label)}</option>)}
                                </select>
                            </label>
                            <label className="grid min-w-0 gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-app-caramelo-torrado">
                                {ui("Prioridade")}
                                <select value={filtroPrioridade} onChange={(event) => setFiltroPrioridade(event.target.value)} className="h-10 min-w-0 w-full rounded-[9px] border border-app-baunilha-dourada bg-white px-3 text-xs font-semibold normal-case tracking-normal text-app-cafe-profundo">
                                    {prioridades.map((item) => <option key={item.value} value={item.value}>{ui(item.label)}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {filtros.map((item) => (
                                <button key={item.value} type="button" onClick={() => setFiltro(item.value)} className={`w-full rounded px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 transition ${filtro === item.value ? "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo" : "bg-white text-app-mocha ring-app-baunilha-dourada hover:bg-app-chantilly"}`}>
                                    {ui(item.label)}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-3">
                            {carregando ? [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded bg-app-chantilly" />) : null}
                            {!carregando && chamadosFiltrados.map((chamado) => (
                                <button key={chamado.id_chamado} type="button" onClick={() => carregarDetalhe(chamado.id_chamado)} className={`rounded p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${detalhe?.id_chamado === chamado.id_chamado ? "bg-app-cafe-profundo text-app-creme-leve ring-app-cafe-profundo" : "bg-white text-app-cafe-profundo ring-app-baunilha-dourada/70 hover:bg-app-chantilly"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Chamado #")}{chamado.id_chamado}</p>
                                            <strong className="mt-2 block text-lg">{obterTitulo(chamado, perfil)}</strong>
                                        </div>
                                        <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ${classeStatus(chamado.status)}`}>{ui(textoStatusSuporte(chamado.status))}</span>
                                    </div>
                                    <p className="mt-3 text-sm">{ui(textoMotivoSuporte(chamado.motivo))}</p>
                                    <p className="mt-1 text-xs opacity-75">{contextoChamado(chamado)} · {formatarData(chamado.atualizado_em, localeUI)}</p>
                                </button>
                            ))}
                            {!carregando && !chamadosFiltrados.length ? <p className="rounded bg-app-chantilly p-5 text-sm text-app-cinza ring-1 ring-app-baunilha-dourada/60">{ui("Nenhum chamado encontrado.")}</p> : null}
                        </div>
                    </aside>

                    <section className="min-h-[520px] rounded bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/70">
                        {!detalhe ? (
                            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                                <h2 className="text-2xl font-semibold">{ui("Selecione um chamado")}</h2>
                                <p className="mt-2 max-w-md text-sm leading-6 text-app-cinza">{ui("A timeline do suporte aparece aqui, com mensagens, status e ações disponíveis para o seu perfil.")}</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-col gap-4 border-b border-app-baunilha-dourada/60 pb-5 @min-[640px]/suporte:flex-row @min-[640px]/suporte:items-start @min-[640px]/suporte:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Chamado #")}{detalhe.id_chamado}</p>
                                        <h2 className="mt-2 text-3xl font-semibold">{obterTitulo(detalhe, perfil)}</h2>
                                        <p className="mt-2 text-sm text-app-cinza">{ui(textoMotivoSuporte(detalhe.motivo))} · {contextoChamado(detalhe)}</p>
                                    </div>
                                    <span className={`w-fit rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ring-1 ${classeStatus(detalhe.status)}`}>{ui(textoStatusSuporte(detalhe.status))}</span>
                                </div>

                                <div className="mt-5 grid gap-4 @min-[640px]/suporte:grid-cols-3">
                                    <article data-appono-sem-traducao className="min-w-0 rounded bg-white p-4 ring-1 ring-app-baunilha-dourada/60 @min-[640px]/suporte:col-span-2">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Descrição")}</p>
                                        <p data-appono-sem-traducao className="mt-2 text-sm leading-6 text-app-mocha">{detalhe.descricao}</p>
                                        {detalhe.resolucao ? <p data-appono-sem-traducao className="mt-4 rounded bg-app-chantilly p-3 text-sm font-semibold text-app-cafe-profundo">{detalhe.resolucao}</p> : null}
                                    </article>
                                    <article className="rounded bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Operação")}</p>
                                        <dl className="mt-2 grid gap-1.5 text-sm">
                                            <div className="flex items-center justify-between"><dt className="text-app-cinza">{ui("Prioridade")}</dt><dd className="font-semibold">{detalhe.prioridade}</dd></div>
                                            <div className="flex items-center justify-between"><dt className="text-app-cinza">{ui("Procedência")}</dt><dd className="font-semibold">{detalhe.procedencia === "NAO_ANALISADA" ? ui("Pendente") : detalhe.procedencia}</dd></div>
                                            {Number(detalhe.impacto_reputacao ?? 0) > 0 ? <div className="flex items-center justify-between"><dt className="text-app-cinza">{ui("Impacto")}</dt><dd className="font-semibold text-red-700">-{Number(detalhe.impacto_reputacao)}</dd></div> : null}
                                        </dl>
                                        {reembolsoDetalhe ? (
                                            <div className="mt-4 border-t border-app-baunilha-dourada/50 pt-3">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{ui("Reembolso")}</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ${classeReembolso(reembolsoDetalhe.status_reembolso)}`}>{ui(textoReembolso(reembolsoDetalhe.status_reembolso))}</span>
                                                    {reembolsoDetalhe.valor_solicitado ? <strong className="text-sm">R$ {Number(reembolsoDetalhe.valor_solicitado).toFixed(2)}</strong> : null}
                                                </div>
                                                {reembolsoDetalhe.resposta ? <p className="mt-2 text-xs text-app-mocha">{reembolsoDetalhe.resposta}</p> : null}
                                                {reembolsoDetalhe.status_reembolso === "SOLICITADO" && (perfil === "restaurante" || perfil === "admin") ? (
                                                    <div className="mt-3 grid gap-2">
                                                        <textarea value={respostaReembolso} onChange={(e) => setRespostaReembolso(e.target.value)} rows={2} maxLength={500} placeholder={ui("Justificativa (obrigatória para recusar)")} className="w-full rounded border border-app-baunilha-dourada bg-white p-2 text-xs text-app-cafe-profundo" />
                                                        <div className="flex gap-2">
                                                            <button type="button" disabled={processando} onClick={() => setConfirmacao("APROVAR_REEMBOLSO")} className="flex-1 rounded bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-emerald-700 disabled:opacity-50">{ui("Aprovar")}</button>
                                                            <button type="button" disabled={processando || respostaReembolso.trim().length < 10} onClick={() => setConfirmacao("RECUSAR_REEMBOLSO")} className="flex-1 rounded border border-red-300 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-50 disabled:opacity-50">{ui("Recusar")}</button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </article>
                                </div>

                                <div className="mt-6 grid gap-3">
                                    {(detalhe.mensagens ?? []).map((item) => (
                                        <article key={item.id_mensagem} className={`rounded p-4 ring-1 ${item.tipo_remetente === "sistema" ? "bg-app-chantilly text-app-mocha ring-app-baunilha-dourada/60" : "bg-white text-app-cafe-profundo ring-app-baunilha-dourada/70"}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <strong className="text-sm capitalize">{ui(item.tipo_remetente)}</strong>
                                                <span className="text-xs text-app-cinza">{formatarData(item.criado_em, localeUI)}</span>
                                            </div>
                                            <p data-appono-sem-traducao className="mt-2 text-sm leading-6">{item.conteudo}</p>
                                        </article>
                                    ))}
                                </div>

                                {!["RESOLVIDO", "RECUSADO", "CANCELADO"].includes(detalhe.status) ? (
                                    <form onSubmit={enviarMensagem} className="mt-6 rounded bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
                                        <label className="text-xs font-bold uppercase tracking-[0.14em] text-app-caramelo-torrado">{ui("Responder")}</label>
                                        <textarea value={mensagem} onChange={(event) => setMensagem(event.target.value)} rows={3} maxLength={1200} placeholder={ui("Escreva uma resposta objetiva para manter o histórico claro.")} className="mt-2 w-full rounded border border-app-baunilha-dourada bg-white p-3 text-sm text-app-cafe-profundo" />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button type="submit" disabled={processando || !mensagem.trim()} className="rounded bg-app-cafe-profundo px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-50">{ui(processando ? "Enviando..." : "Enviar resposta")}</button>
                                            {perfil === "cliente" && detalhe.status === "AGUARDANDO_CLIENTE" ? <button type="button" onClick={() => setConfirmacao("CONFIRMAR_RESOLUCAO")} className="rounded bg-app-dourado-mel px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado">{ui("Confirmar solução")}</button> : null}
                                            {perfil === "cliente" ? <button type="button" onClick={() => executarAcao("ANALISE_ADMIN")} className="rounded border border-app-caramelo-torrado px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-chantilly">{ui("Pedir análise Appono")}</button> : null}
                                            {perfil === "cliente" ? <button type="button" onClick={() => setConfirmacao("CANCELAR")} className="rounded border border-red-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50">{ui("Cancelar chamado")}</button> : null}
                                            {perfil === "restaurante" ? <button type="button" onClick={() => executarAcao("ASSUMIR")} className="rounded border border-app-caramelo-torrado px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-chantilly">{ui("Assumir")}</button> : null}
                                            {perfil === "restaurante" ? <button type="button" onClick={() => executarAcao("CONTESTAR")} className="rounded border border-app-caramelo-torrado px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-caramelo-torrado transition hover:bg-app-chantilly">{ui("Contestar")}</button> : null}
                                            {perfil === "restaurante" ? <button type="button" onClick={() => setConfirmacao("RESOLVER")} className="rounded bg-app-dourado-mel px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado">{ui("Marcar resolvido")}</button> : null}
                                            {perfil === "admin" ? <button type="button" onClick={() => setConfirmacao("PROCEDENTE")} className="rounded bg-app-dourado-mel px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-caramelo-torrado">{ui("Procedente")}</button> : null}
                                            {perfil === "admin" ? <button type="button" onClick={() => setConfirmacao("IMPROCEDENTE")} className="rounded border border-red-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50">{ui("Improcedente")}</button> : null}
                                        </div>
                                    </form>
                                ) : null}
                            </div>
                        )}
                    </section>
                </section>
            </section>

            <ConfirmationDialog
                open={Boolean(confirmacao)}
                eyebrow={ui("Suporte")}
                title={ui(confirmacao === "CANCELAR" ? "Cancelar chamado?" : confirmacao === "RESOLVER" ? "Enviar solução?" : confirmacao === "CONFIRMAR_RESOLUCAO" ? "Confirmar que resolveu?" : confirmacao === "APROVAR_REEMBOLSO" ? "Aprovar reembolso?" : confirmacao === "RECUSAR_REEMBOLSO" ? "Recusar reembolso?" : "Confirmar decisão?")}
                description={ui(confirmacao === "PROCEDENTE" ? "Chamados procedentes podem reduzir levemente o score operacional do restaurante." : confirmacao === "APROVAR_REEMBOLSO" ? "O valor será estornado ao cliente. Essa ação não pode ser desfeita." : confirmacao === "RECUSAR_REEMBOLSO" ? "O cliente será notificado sobre a recusa." : "Essa ação ficará registrada na timeline do chamado.")}
                confirmLabel={ui(confirmacao === "CANCELAR" ? "Cancelar chamado" : confirmacao === "CONFIRMAR_RESOLUCAO" ? "Confirmar solução" : "Confirmar")}
                cancelLabel={ui("Voltar")}
                loading={processando}
                onCancel={() => setConfirmacao(null)}
                onConfirm={() => {
                    if (confirmacao === "CANCELAR") return executarAcao("CANCELAR");
                    if (confirmacao === "CONFIRMAR_RESOLUCAO") return executarAcao("CONFIRMAR_RESOLUCAO");
                    if (confirmacao === "RESOLVER") return executarAcao("RESOLVER");
                    if (confirmacao === "PROCEDENTE") return executarAcao("DECIDIR", { procedencia: "PROCEDENTE" });
                    if (confirmacao === "IMPROCEDENTE") return executarAcao("DECIDIR", { procedencia: "IMPROCEDENTE" });
                    if (confirmacao === "APROVAR_REEMBOLSO" && reembolsoDetalhe) return analisarReembolso(reembolsoDetalhe.id_reembolso, "APROVAR");
                    if (confirmacao === "RECUSAR_REEMBOLSO" && reembolsoDetalhe) return analisarReembolso(reembolsoDetalhe.id_reembolso, "RECUSAR");
                    return null;
                }}
                details={detalhe ? <p className="font-semibold">{ui("Chamado #")}{detalhe.id_chamado} · {ui(textoMotivoSuporte(detalhe.motivo))}</p> : null}
            />
        </Container>
    );
}
