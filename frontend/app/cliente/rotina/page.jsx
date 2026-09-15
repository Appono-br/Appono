"use client";

import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { estadoPlanejamento } from "@/lib/routine-view.mjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const navItems = [
    { label: "Início", href: "/cliente/dashboard" },
    { label: "Appono Rotina", href: "/cliente/rotina" },
    { label: "Busca", href: "/cliente/busca" },
    { label: "Pedidos", href: "/cliente/detalhes-pedido" },
    { label: "Reservas", href: "/cliente/reservas" },
    { label: "Favoritos", href: "/cliente/favoritos" },
    { label: "Mensagens", href: "/cliente/mensagens" },
    { label: "Suporte", href: "/cliente/suporte" },
];

const statusTexto = {
    SUGERIDA: "Sugerida",
    APROVADA: "Aprovada",
    RECUSADA: "Recusada",
    ALTERADA: "Alterada",
    CONVERTIDA_RESERVA: "Reserva criada",
    CONVERTIDA_PEDIDO: "Pedido criado",
    CANCELADA: "Cancelada",
};

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        calendar: "M7 3v4M17 3v4M4 8h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
        menu: "M4 7h16M4 12h16M4 17h16",
        route: "M6 19c3 0 3-14 6-14s3 14 6 14M6 19h12",
        spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
    };
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`}><path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function formatarMoeda(valor, localeUI) {
    if (valor === null || valor === undefined || valor === "") return "--";
    return new Intl.NumberFormat(localeUI, { style: "currency", currency: "BRL" }).format(Number(valor));
}

function formatarData(data, localeUI) {
    if (!data) return "--";
    return new Date(`${data}T12:00:00`).toLocaleDateString(localeUI, { weekday: "long", day: "2-digit", month: "short" });
}

export default function RotinaClientePage() {
    const { ui, localeUI } = useInterface();
    const [menuAberto, setMenuAberto] = useState(false);
    const [perfil, setPerfil] = useState(null);
    const [planejamento, setPlanejamento] = useState(null);
    const [refeicoes, setRefeicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState("");
    const [gerando, setGerando] = useState(false);
    const [recarregar, setRecarregar] = useState(0);

    useEffect(() => {
        let cancelado = false;
        async function carregar() {
            setCarregando(true);
            try {
                const [perfilResposta, planejamentoResposta] = await Promise.all([
                    apiRequest("/rotina/perfil", { forceRefresh: true }),
                    apiRequest("/rotina/planejamento", { forceRefresh: true }),
                ]);
                if (cancelado) return;
                setPerfil(perfilResposta);
                setPlanejamento(planejamentoResposta?.planejamento ?? null);
                setRefeicoes(planejamentoResposta?.refeicoes ?? []);
                setMensagem("");
            } catch (error) {
                if (!cancelado) setMensagem(error instanceof Error ? error.message : "Não foi possível carregar sua rotina.");
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, [recarregar]);

    const estado = useMemo(() => estadoPlanejamento({ perfil, planejamento, refeicoes }), [perfil, planejamento, refeicoes]);
    const proximaRefeicao = estado.proxima;

    async function gerarSemana() {
        if (gerando) return;
        setGerando(true);
        setMensagem("");
        try {
            const resposta = await apiRequest("/rotina/planejamento/gerar", { method: "POST", body: JSON.stringify({
                versao_perfil: Number(perfil?.versao ?? 0), versao_planejamento: Number(planejamento?.versao ?? 0),
                semana_base: planejamento?.semana_inicio,
            }) });
            setPlanejamento(resposta.planejamento);
            setRefeicoes(resposta.refeicoes ?? []);
        } catch (error) {
            setMensagem(error.message);
        } finally {
            setGerando(false);
        }
    }

    const resumo = useMemo(() => {
        const total = refeicoes.length;
        const convertidas = refeicoes.filter((item) => item.status?.startsWith("CONVERTIDA")).length;
        const aprovadas = refeicoes.filter((item) => item.status === "APROVADA").length;
        return { total, convertidas, aprovadas };
    }, [refeicoes]);

    return (
        <main className="min-h-screen bg-white text-app-cafe-profundo">
            <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-white/95 text-app-cafe-profundo shadow-sm backdrop-blur-md">
                <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:h-20">
                    <Link href="/cliente/dashboard" aria-label={ui("Appono")}>
                        <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="h-11 w-11 lg:h-14 lg:w-14" priority />
                    </Link>
                    <nav className="hidden items-center justify-self-center gap-5 text-xs font-semibold text-app-cinza lg:flex">
                        {navItems.map((item) => <Link key={item.href} href={item.href} className={item.href === "/cliente/rotina" ? "text-app-cafe-profundo" : "transition hover:text-app-cafe-profundo"}>{ui(item.label)}</Link>)}
                    </nav>
                    <div className="flex items-center justify-self-end gap-3">
                        <ItemHeaderNotificacoes href="/cliente/notificacoes" />
                        <button type="button" onClick={() => setMenuAberto((valor) => !valor)} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-app-baunilha-dourada bg-white lg:hidden" aria-label={ui("Abrir menu")}>
                            <Icon type="menu" />
                        </button>
                    </div>
                </div>
                {menuAberto ? (
                    <nav className="border-t border-app-baunilha-dourada/50 bg-white px-5 py-3 lg:hidden">
                        <div className="mx-auto grid max-w-7xl gap-2 text-xs font-semibold text-app-cinza">
                            {navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuAberto(false)}>{ui(item.label)}</Link>)}
                        </div>
                    </nav>
                ) : null}
            </header>

            <section className="border-b border-app-baunilha-dourada/50 bg-app-cafe-profundo px-5 py-12 text-app-creme-leve">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-baunilha-dourada">{ui("Appono Rotina")}</p>
                        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{ui("Planeje seus almoços com reserva e pedido em poucos passos.")}</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-creme-suave">{ui("A rotina cruza sua base, orçamento, preferências, favoritos e restrições para sugerir refeições presenciais durante a semana.")}</p>
                    </div>
                    <div className="grid gap-3 rounded-[18px] bg-white/10 p-4 ring-1 ring-white/15 sm:grid-cols-3">
                        <div><p className="text-[10px] font-bold uppercase text-app-baunilha-dourada">{ui("Semana")}</p><strong className="mt-1 block text-2xl">{resumo.total}</strong></div>
                        <div><p className="text-[10px] font-bold uppercase text-app-baunilha-dourada">{ui("Aprovadas")}</p><strong className="mt-1 block text-2xl">{resumo.aprovadas}</strong></div>
                        <div><p className="text-[10px] font-bold uppercase text-app-baunilha-dourada">{ui("Convertidas")}</p><strong className="mt-1 block text-2xl">{resumo.convertidas}</strong></div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl items-start gap-5 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
                {mensagem ? <div role="alert" className="rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold text-app-caramelo-torrado lg:col-span-2">
                    <p>{ui(mensagem)}</p><button type="button" disabled={carregando || gerando} onClick={() => setRecarregar((valor) => valor + 1)} className="mt-3 rounded-lg border px-4 py-2">{ui("Recarregar dados")}</button>
                </div> : null}
                {carregando ? <p className="rounded-[16px] bg-white p-8 text-sm font-semibold shadow-sm ring-1 ring-app-baunilha-dourada/60 lg:col-span-2">{ui("Carregando sua rotina...")}</p> : null}

                {!carregando && (perfil || !mensagem) ? (
                    <article className="rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/65">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                            <Icon type="route" />
                        </div>
                        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Perfil")}</p>
                        <h2 className="mt-2 text-3xl font-semibold">{perfil ? perfil.nome : ui("Crie sua rotina")}</h2>
                        <p className="mt-3 text-sm leading-6 text-app-cinza">
                            {perfil ? (perfil.endereco_base || ui("Base definida por coordenadas.")) : ui("Informe sua base, janela de almoço, orçamento e preferências para receber sugestões semanais.")}
                        </p>
                        <div className="mt-6 grid gap-3 text-sm">
                            <div className="rounded-[12px] border border-app-baunilha-dourada/60 bg-white p-4">
                                <span className="text-xs font-bold uppercase text-app-caramelo-torrado">{ui("Orçamento diário")}</span>
                                <strong className="mt-1 block text-xl">{formatarMoeda(perfil?.orcamento_diario, localeUI)}</strong>
                            </div>
                            <div className="rounded-[12px] border border-app-baunilha-dourada/60 bg-white p-4">
                                <span className="text-xs font-bold uppercase text-app-caramelo-torrado">{ui("Orçamento semanal")}</span>
                                <strong className="mt-1 block text-xl">{perfil?.orcamento_semanal == null ? ui("Sem limite definido") : formatarMoeda(perfil.orcamento_semanal, localeUI)}</strong>
                            </div>
                            <div className="rounded-[12px] border border-app-baunilha-dourada/60 bg-white p-4">
                                <span className="text-xs font-bold uppercase text-app-caramelo-torrado">{ui("Raio")}</span>
                                <strong className="mt-1 block text-xl">{perfil?.raio_km ? `${perfil.raio_km} km` : "--"}</strong>
                            </div>
                        </div>
                        {perfil ? <p className="mt-4 text-sm leading-6 text-app-cinza">{perfil.dias_semana.length} {ui("dias por semana")} · {String(perfil.horario_inicio).slice(0, 5)}–{String(perfil.horario_fim).slice(0, 5)} · {ui("saída de até")} {perfil.tempo_maximo_minutos} min</p> : null}
                        <Link href="/cliente/rotina/configurar" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-caramelo-torrado px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo">
                            {ui(perfil ? "Editar rotina" : "Configurar rotina")}
                        </Link>
                    </article>
                ) : null}

                {!carregando && (perfil || !mensagem) ? (
                    <article className="rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/65">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Próxima sugestão")}</p>
                                <h2 className="mt-2 text-3xl font-semibold">{ui(estado.titulo)}</h2>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve">
                                <Icon type="spark" />
                            </div>
                        </div>
                        {proximaRefeicao ? (
                            <div className="mt-6 grid gap-4">
                                <div className="rounded-[14px] border border-app-baunilha-dourada/60 bg-white p-4">
                                    <p className="text-sm font-semibold">{formatarData(proximaRefeicao.data_refeicao, localeUI)} {ui("às")} {String(proximaRefeicao.horario_sugerido ?? "").slice(0, 5)}</p>
                                    <p className="mt-2 text-sm text-app-cinza">{proximaRefeicao.produtos?.nome ?? ui("Reserva sem item definido")}</p>
                                    <p className="mt-2 text-sm font-semibold text-app-caramelo-torrado">{ui(statusTexto[proximaRefeicao.status] ?? proximaRefeicao.status)}</p>
                                </div>
                                <p className="text-sm leading-6 text-app-cinza">{proximaRefeicao.motivo_recomendacao}</p>
                            </div>
                        ) : (
                            <p className="mt-6 text-sm leading-6 text-app-cinza">{ui(estado.descricao)}</p>
                        )}
                        <div className="mt-6 flex flex-wrap gap-3">
                            {estado.acao === "gerar" ? <button type="button" disabled={gerando} onClick={gerarSemana} className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-app-cafe-profundo px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:opacity-50">{ui(gerando ? "Gerando sugestões..." : "Gerar planejamento da semana")}</button> : estado.acao === "ver" ? <Link href="/cliente/rotina/planejamento" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">
                                {ui("Ver planejamento")}
                            </Link> : null}
                            <Link href="/cliente/rotina/configurar" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">
                                {ui("Preferências")}
                            </Link>
                        </div>
                    </article>
                ) : null}

                {!carregando && planejamento ? (
                    <section className="rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/65 lg:col-span-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Planejamento ativo")}</p>
                                <h2 className="mt-2 text-2xl font-semibold">{formatarData(planejamento.semana_inicio, localeUI)} - {formatarData(planejamento.semana_fim, localeUI)}</h2>
                            </div>
                            <Link href="/cliente/rotina/planejamento" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">
                                {ui("Gerenciar semana")}
                            </Link>
                        </div>
                    </section>
                ) : null}
            </section>
        </main>
    );
}
