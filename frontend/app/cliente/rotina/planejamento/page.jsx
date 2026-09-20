"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { RoutineEmpty, RoutineHero, RoutineIcon, RoutineNotice, RoutineSkeleton, RoutineStatus } from "@/components/cliente/rotina/routine-ui";
import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { estadoPlanejamento } from "@/lib/routine-view.mjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

function inicioSemana(data = null) {
    const hojeSaoPaulo = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const referencia = data ? new Date(data) : new Date(`${hojeSaoPaulo}T12:00:00`);
    const dia = referencia.getDay() || 7;
    referencia.setDate(referencia.getDate() - dia + 1);
    return referencia.toISOString().slice(0, 10);
}

function deslocarSemana(data, quantidade) {
    const referencia = new Date(`${data}T12:00:00`);
    referencia.setDate(referencia.getDate() + quantidade * 7);
    return referencia.toISOString().slice(0, 10);
}

function adicionarDias(data, quantidade) {
    const referencia = new Date(`${data}T12:00:00`);
    referencia.setDate(referencia.getDate() + quantidade);
    return referencia.toISOString().slice(0, 10);
}

function statusPlanejamento(status, ui) {
    return ui({ GERADO: "Gerado", APROVADO: "Aprovado", PARCIAL: "Em revisão", CANCELADO: "Cancelado" }[status] ?? status);
}

function nomeJanela(janela, ui) {
    if (janela?.nome) return janela.nome;
    return ui({ CAFE: "Café", ALMOCO: "Almoço", JANTAR: "Jantar", PERSONALIZADA: "Refeição" }[janela?.tipo] ?? "Refeição");
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
    const [confirmacaoRecusa, setConfirmacaoRecusa] = useState(null);
    const [confirmarOutraSugestao, setConfirmarOutraSugestao] = useState(null);
    const [edicao, setEdicao] = useState(null);
    const [rascunhoEdicao, setRascunhoEdicao] = useState(null);
    const [confirmarDescartar, setConfirmarDescartar] = useState(false);
    const [confirmarGeracao, setConfirmarGeracao] = useState(false);
    const [conflito, setConflito] = useState(false);
    const [feedbackEmEdicao, setFeedbackEmEdicao] = useState(null);
    const [confirmarExcluirFeedback, setConfirmarExcluirFeedback] = useState(null);
    const [semanaSelecionada, setSemanaSelecionada] = useState("");
    const [agoraReferencia] = useState(() => Date.now());
    const versoes = { versao_perfil: Number(perfil?.versao ?? 0), versao_planejamento: Number(planejamento?.versao ?? 0) };
    const semanaAnterior = Boolean(semanaSelecionada) && semanaSelecionada < inicioSemana();
    const semanaMinimaConsulta = deslocarSemana(inicioSemana(), -1);
    const podeVoltarSemana = !semanaSelecionada || semanaSelecionada > semanaMinimaConsulta;

    async function carregar(semanaInicio = semanaSelecionada) {
        try {
            const [perfilResposta, planejamentoResposta] = await Promise.all([
                apiRequest("/rotina/perfil", { forceRefresh: true }),
                apiRequest(`/rotina/planejamento${semanaInicio ? `?semana_inicio=${semanaInicio}` : ""}`, { forceRefresh: true }),
            ]);
            setPerfil(perfilResposta);
            setPlanejamento(planejamentoResposta?.planejamento ?? null);
            setRefeicoes(planejamentoResposta?.refeicoes ?? []);
            setSemanaSelecionada(planejamentoResposta?.planejamento?.semana_inicio ?? semanaInicio ?? inicioSemana());
            setMensagem("");
            setConflito(false);
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível carregar o planejamento.");
        } finally {
            setCarregando(false);
        }
    }

    function ehConflitoRotina(error) {
        return error?.status === 409 || /dados mudaram|rotina mudou em outra aba|precisa ser sincronizada|vers[aã]o.*atual/i.test(String(error?.message ?? ""));
    }

    async function recuperarConflito() {
        if (edicao) setRascunhoEdicao(edicao);
        setEdicao(null);
        setConfirmacao(null);
        setConfirmacaoRecusa(null);
        setConfirmarOutraSugestao(null);
        setConfirmarGeracao(false);
        setConflito(false);
        setMensagem("");
        setCarregando(true);
        await carregar();
    }

    useEffect(() => {
        let cancelado = false;
        const parametros = new URLSearchParams(window.location.search);
        const semanaUrl = /^\d{4}-\d{2}-\d{2}$/.test(parametros.get("semana_inicio") ?? "")
            ? parametros.get("semana_inicio") : "";
        const agendaResultado = parametros.get("agenda");
        Promise.all([
            apiRequest("/rotina/perfil", { forceRefresh: true }),
            apiRequest(`/rotina/planejamento${semanaUrl ? `?semana_inicio=${semanaUrl}` : ""}`, { forceRefresh: true }),
        ]).then(([perfilResposta, planejamentoResposta]) => {
            if (cancelado) return;
            setPerfil(perfilResposta);
            setPlanejamento(planejamentoResposta?.planejamento ?? null);
            setRefeicoes(planejamentoResposta?.refeicoes ?? []);
            setSemanaSelecionada(planejamentoResposta?.planejamento?.semana_inicio ?? semanaUrl ?? inicioSemana());
            if (agendaResultado === "sincronizada") setMensagem("Semana gerada e enviada ao Google Agenda.");
            if (agendaResultado === "parcial") setMensagem("Semana gerada. Alguns eventos do Google Agenda precisarão de uma nova sincronização.");
            if (agendaResultado === "erro") setMensagem("Semana gerada. O Google Agenda não respondeu, mas seu planejamento foi preservado.");
            if (agendaResultado === "reconectar") setMensagem("Semana gerada. Reconecte o Google Agenda para autorizar a criação dos eventos.");
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
    const pendentesDecisao = resumo.sugeridas + refeicoes.filter((item) => item.status === "ALTERADA").length;
    const estado = useMemo(() => estadoPlanejamento({ perfil, planejamento, refeicoes }), [perfil, planejamento, refeicoes]);
    const janelasPorId = useMemo(() => new Map((perfil?.janelas_alimentacao ?? []).map((janela) => [Number(janela.id_janela_alimentacao), janela])), [perfil]);
    const diasPlanejados = useMemo(() => {
        const grupos = new Map();
        for (const refeicao of refeicoes) {
            const grupo = grupos.get(refeicao.data_refeicao) ?? [];
            grupo.push(refeicao);
            grupos.set(refeicao.data_refeicao, grupo);
        }
        return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([data, itens]) => ({
            data,
            itens: itens.sort((a, b) => String(a.horario_sugerido).localeCompare(String(b.horario_sugerido))),
        }));
    }, [refeicoes]);
    const proximaRefeicao = useMemo(() => {
        return [...refeicoes]
            .filter((refeicao) => !["RECUSADA", "CANCELADA"].includes(refeicao.status) && new Date(`${refeicao.data_refeicao}T${refeicao.horario_sugerido}`).getTime() >= agoraReferencia)
            .sort((a, b) => `${a.data_refeicao}T${a.horario_sugerido}`.localeCompare(`${b.data_refeicao}T${b.horario_sugerido}`))[0] ?? null;
    }, [refeicoes, agoraReferencia]);

    async function navegarSemana(direcao) {
        if (processando || carregando) return;
        const destino = deslocarSemana(semanaSelecionada || planejamento?.semana_inicio || inicioSemana(), direcao);
        if (destino < semanaMinimaConsulta) {
            setMensagem("O histórico fica disponível somente até a semana anterior.");
            return;
        }
        setCarregando(true);
        setMensagem("");
        setConflito(false);
        await carregar(destino);
    }

    async function gerarPlanejamento() {
        if (processando) return;
        if (semanaAnterior) {
            setMensagem("Semanas anteriores estão disponíveis somente para consulta.");
            return;
        }
        setProcessando("gerar");
        setMensagem("");
        try {
            const resposta = await apiRequest("/rotina/planejamento/gerar", { method: "POST", body: JSON.stringify({ ...versoes, semana_inicio: semanaSelecionada || undefined, semana_base: planejamento?.semana_inicio ?? semanaSelecionada }) });
            setPlanejamento(resposta.planejamento);
            setRefeicoes(resposta.refeicoes ?? []);
            setSemanaSelecionada(resposta.planejamento?.semana_inicio ?? semanaSelecionada);
            setMensagem("Planejamento gerado.");
            setConfirmarGeracao(false);
        } catch (error) {
            if (ehConflitoRotina(error)) {
                await recuperarConflito();
                return;
            }
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
            if (ehConflitoRotina(error)) {
                await recuperarConflito();
                return;
            }
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
            setConfirmacaoRecusa(null);
        } catch (error) {
            if (ehConflitoRotina(error)) {
                await recuperarConflito();
                return;
            }
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
            if (ehConflitoRotina(error)) {
                await recuperarConflito();
                return;
            }
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
            if (ehConflitoRotina(error)) {
                await recuperarConflito();
                return;
            }
            setMensagem(error.message);
        } finally {
            setProcessando("");
        }
    }

    async function retomarRascunho() {
        if (!rascunhoEdicao) return;
        const refeicao = refeicoes.find((item) => item.id_refeicao_planejada === rascunhoEdicao.id);
        if (!refeicao) {
            setRascunhoEdicao(null);
            setMensagem("A refeição editada não existe mais na versão salva.");
            return;
        }
        setProcessando(`editar-${refeicao.id_refeicao_planejada}`);
        try {
            const opcoes = await apiRequest(`/rotina/refeicoes/${refeicao.id_refeicao_planejada}/opcoes`, { forceRefresh: true });
            const anterior = rascunhoEdicao.opcoes?.[rascunhoEdicao.indice];
            const indice = Math.max(0, opcoes.findIndex((item) => item.id_restaurante === anterior?.id_restaurante && item.id_produto === anterior?.id_produto));
            setEdicao({ id: refeicao.id_refeicao_planejada, versoes, opcoes, indice, horario: rascunhoEdicao.horario });
            setRascunhoEdicao(null);
            setMensagem("Rascunho restaurado sobre a versão atual. Revise antes de salvar.");
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível restaurar a edição.");
        } finally {
            setProcessando("");
        }
    }

    async function pedirOutraSugestao() {
        const refeicao = confirmarOutraSugestao;
        if (!refeicao) return;
        setProcessando(`alternativa-${refeicao.id_refeicao_planejada}`);
        try {
            await apiRequest(`/rotina/refeicoes/${refeicao.id_refeicao_planejada}/outra-sugestao`, {
                method: "POST", body: JSON.stringify(versoes),
            });
            setMensagem("Uma nova sugestão compatível foi escolhida para este dia.");
            setConfirmarOutraSugestao(null);
            await carregar();
        } catch (error) {
            if (ehConflitoRotina(error) && error.code !== "ROUTINE_NO_ALTERNATIVE") {
                await recuperarConflito();
                return;
            }
            setMensagem(error.message);
        } finally {
            setProcessando("");
        }
    }

    function iniciarFeedback(refeicao) {
        const anterior = refeicao.feedback_rotina;
        setFeedbackEmEdicao({
            id: refeicao.id_refeicao_planejada,
            gostou: anterior?.gostou ?? true,
            repetiria: anterior?.repetiria ?? true,
            motivo: anterior?.motivo ?? "",
            tags: (anterior?.tags ?? []).join(", "),
            consentiu_personalizacao: anterior?.consentiu_personalizacao === true,
        });
        setMensagem("");
    }

    async function salvarFeedback(event) {
        event.preventDefault();
        if (!feedbackEmEdicao) return;
        setProcessando(`feedback-${feedbackEmEdicao.id}`);
        try {
            const tags = [...new Set(feedbackEmEdicao.tags.split(",").map((item) => item.trim()).filter(Boolean))];
            await apiRequest(`/rotina/refeicoes/${feedbackEmEdicao.id}/feedback`, {
                method: "POST",
                body: JSON.stringify({ ...feedbackEmEdicao, tags }),
            });
            setFeedbackEmEdicao(null);
            setMensagem("Seu feedback foi registrado.");
            await carregar();
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível registrar o feedback.");
        } finally {
            setProcessando("");
        }
    }

    async function excluirFeedback() {
        if (!confirmarExcluirFeedback) return;
        const id = confirmarExcluirFeedback.id_refeicao_planejada;
        setProcessando(`excluir-feedback-${id}`);
        try {
            await apiRequest(`/rotina/refeicoes/${id}/feedback`, { method: "DELETE" });
            setConfirmarExcluirFeedback(null);
            setMensagem("O feedback foi removido da sua personalização.");
            await carregar();
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível excluir o feedback.");
        } finally {
            setProcessando("");
        }
    }

    return (
        <main className="min-h-screen bg-white px-4 py-6 text-app-cafe-profundo sm:px-6 sm:py-8">
            <section className="mx-auto max-w-7xl">
                <div><RoutineHero eyebrow={ui("Minha semana")} title={ui("Sua semana de refeições")} description={ui("Escolha, ajuste ou reserve quando quiser.")} /></div>

                {mensagem ? <div className="mt-5"><RoutineNotice type={conflito || mensagem.includes("Google Agenda não respondeu") || mensagem.includes("Reconecte") || mensagem.includes("Alguns eventos") ? "warning" : mensagem.includes("aprovado") || mensagem.includes("gerado") || mensagem.includes("restaurado") ? "success" : "info"}>{ui(mensagem)}</RoutineNotice></div> : null}
                {rascunhoEdicao && !conflito ? <div className="mt-4"><RoutineNotice type="info" action={<button type="button" disabled={Boolean(processando)} onClick={retomarRascunho} className="min-h-10 rounded-full border border-current px-4 text-xs font-bold uppercase tracking-wider">{ui("Retomar edição")}</button>}><p>{ui("Seu rascunho foi preservado. Restaure-o sobre os dados atuais e revise antes de salvar.")}</p></RoutineNotice></div> : null}
                {semanaAnterior ? <div className="mt-4"><RoutineNotice type="info">{ui("Esta semana já terminou e está disponível somente para consulta. Você pode revisar o histórico, mas não gerar novas sugestões nela.")}</RoutineNotice></div> : null}

                <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/55">
                    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Semana selecionada")}</p>
                                {planejamento?.status ? <span className="rounded-full bg-app-chantilly px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-app-mocha">{statusPlanejamento(planejamento.status, ui)}</span> : null}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <button type="button" onClick={() => navegarSemana(-1)} disabled={carregando || Boolean(processando) || !podeVoltarSemana} aria-label={ui("Ver semana anterior")} title={!podeVoltarSemana ? ui("O histórico fica disponível somente até a semana anterior.") : undefined} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-baunilha-dourada text-lg outline-none transition hover:bg-app-chantilly focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-40">‹</button>
                                <h2 className="min-w-0 text-xl font-semibold sm:text-2xl">
                                    {`${dataCurta(semanaSelecionada || planejamento?.semana_inicio || inicioSemana(), localeUI)} - ${dataCurta(planejamento?.semana_fim ?? adicionarDias(semanaSelecionada || inicioSemana(), 6), localeUI)}`}
                                </h2>
                                <button type="button" onClick={() => navegarSemana(1)} disabled={carregando || Boolean(processando)} aria-label={ui("Ver próxima semana")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-baunilha-dourada text-lg outline-none transition hover:bg-app-chantilly focus-visible:ring-2 focus-visible:ring-app-caramelo-torrado disabled:opacity-40">›</button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            <Link href="/cliente/rotina/configurar" className="inline-flex min-h-10 items-center justify-center rounded-full border border-app-baunilha-dourada px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Configurar")}</Link>
                            <button type="button" disabled={Boolean(processando) || !perfil || semanaAnterior} onClick={() => planejamento ? setConfirmarGeracao(true) : gerarPlanejamento()} className="min-h-10 rounded-full bg-app-caramelo-torrado px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:cursor-not-allowed disabled:opacity-50">{ui(semanaAnterior ? "Somente consulta" : processando === "gerar" ? "Gerando..." : "Gerar semana")}</button>
                            <button type="button" title={ui("Mantém as sugestões na sua semana; não cria reserva nem cobrança.")} disabled={Boolean(processando) || !refeicoes.some((item) => item.id_restaurante && ["SUGERIDA", "ALTERADA"].includes(item.status))} onClick={aprovarTudo} className="min-h-10 rounded-full bg-app-cafe-profundo px-4 py-2 text-sm font-bold text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:opacity-50">{ui("Manter todas na semana")}</button>
                        </div>
                    </div>
                    {!perfil ? <p className="border-t border-app-baunilha-dourada/45 p-5 text-sm text-app-cinza sm:px-6">{ui("Configure sua rotina antes de gerar sugestões.")}</p> : null}
                </section>


                {carregando ? <div className="mt-5"><RoutineSkeleton cards={3} /></div> : null}

                {!carregando && !refeicoes.length ? (
                    <div className="mt-5"><RoutineEmpty title={ui(estado.titulo)} description={ui(estado.descricao)} icon={estado.acao === "configurar" ? "route" : "spark"} action={estado.acao === "configurar" ? <Link href="/cliente/rotina/configurar" className="inline-flex min-h-11 items-center rounded-full bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-wider text-app-creme-leve">{ui("Configurar rotina")}</Link> : semanaAnterior ? <button type="button" disabled={Boolean(processando)} onClick={() => { setCarregando(true); carregar(inicioSemana()); }} className="min-h-11 rounded-full bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-wider text-app-creme-leve disabled:opacity-50">{ui("Ir para semana atual")}</button> : <button type="button" disabled={!perfil || Boolean(processando)} onClick={gerarPlanejamento} className="min-h-11 rounded-full bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-wider text-app-creme-leve disabled:opacity-50">{ui("Gerar planejamento")}</button>} /></div>
                ) : null}

                {!carregando && refeicoes.length ? <div className="mt-5 grid gap-5">
                    {diasPlanejados.map((dia) => <section key={dia.data} aria-labelledby={`dia-${dia.data}`} className="overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-app-baunilha-dourada/55">
                        <header className="flex flex-col gap-2 border-b border-app-baunilha-dourada/45 bg-app-creme-leve/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Dia da semana")}</p><h2 id={`dia-${dia.data}`} className="mt-1 text-xl font-semibold capitalize">{dataCurta(dia.data, localeUI)}</h2></div>
                            <span className="text-xs font-semibold text-app-mocha">{ui("{0} janela(s) planejada(s)", [dia.itens.length])}</span>
                        </header>
                        <div className="divide-y divide-app-baunilha-dourada/45">
                    {dia.itens.map((refeicao) => {
                        const restaurante = refeicao.restaurantes;
                        const produto = refeicao.produtos;
                        const janela = janelasPorId.get(Number(refeicao.id_janela_alimentacao));
                        const semSugestao = refeicao.metadados?.sem_sugestao || !refeicao.id_restaurante;
                        const convertida = refeicao.status?.startsWith("CONVERTIDA");
                        const experienciaConcluida = refeicao.reservas?.status_reserva === "CONCLUIDA" || refeicao.pedidos?.status_pedido === "ENTREGUE";
                        const feedback = refeicao.feedback_rotina;
                        const destaque = proximaRefeicao?.id_refeicao_planejada === refeicao.id_refeicao_planejada;
                        return (
                            <article key={refeicao.id_refeicao_planejada} className={`relative p-5 sm:p-6 ${destaque ? "bg-app-chantilly/45" : "bg-white"}`}>
                                {destaque ? <span className="absolute right-5 top-5 rounded-full bg-app-caramelo-torrado px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white sm:right-6">{ui("Próxima")}</span> : null}
                                <div className="grid gap-5 lg:grid-cols-[170px_minmax(0,1fr)]">
                                    <div className="flex items-start gap-3 lg:block lg:border-r lg:border-app-baunilha-dourada/45 lg:pr-5">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-chantilly text-app-caramelo-torrado"><RoutineIcon type="calendar" className="h-5 w-5" /></div>
                                        <div className="min-w-0 lg:mt-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-caramelo-torrado">{nomeJanela(janela, ui)}</p>
                                            <strong className="mt-1 block text-xl">{String(refeicao.horario_sugerido ?? "").slice(0, 5)}</strong>
                                            {janela?.nome && janela?.tipo ? <span className="mt-1 block text-xs text-app-cinza">{ui({ CAFE: "Café", ALMOCO: "Almoço", JANTAR: "Jantar", PERSONALIZADA: "Personalizada" }[janela.tipo] ?? janela.tipo)}</span> : null}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="min-w-0">
                                                <RoutineStatus status={refeicao.status} />
                                                <div className="mt-3 flex min-w-0 items-center gap-3">
                                                    {!semSugestao && restaurante?.logo_url ? <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px] border border-app-baunilha-dourada/60 bg-white"><Image src={restaurante.logo_url} alt="" fill sizes="48px" className="object-contain p-1.5" /></div> : <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-app-chantilly text-sm font-bold text-app-mocha">{restaurante?.nome?.slice(0, 1)?.toUpperCase() ?? "A"}</div>}
                                                    <h3 className="min-w-0 text-xl font-semibold sm:text-2xl">{semSugestao ? ui("Sem sugestão compatível") : restaurante?.nome ?? ui("Restaurante")}</h3>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-app-cinza">{refeicao.motivo_recomendacao}</p>
                                            </div>
                                            {!semSugestao ? (
                                                <div className="grid gap-2 rounded-[14px] bg-app-creme-leve/65 p-4 text-sm xl:min-w-64">
                                                    <span className="font-semibold">{produto?.nome ?? ui("Reserva sem item")}</span>
                                                    <span className="text-app-mocha">{moeda(refeicao.preco_estimado, localeUI)} · {distancia(refeicao.distancia_km)}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {!convertida ? <button type="button" disabled={Boolean(processando)} onClick={() => editar(refeicao)} className="min-h-10 rounded-full border border-app-baunilha-dourada px-4 py-2 text-sm font-bold text-app-mocha transition hover:bg-app-chantilly disabled:opacity-50">{ui("Ver ou alterar opções")}</button> : null}
                                            {!semSugestao && !convertida && refeicao.status !== "APROVADA" ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => atualizarStatus(refeicao, "aprovar")} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-app-cafe-profundo px-4 py-2 text-sm font-bold text-app-creme-leve transition hover:bg-app-caramelo-torrado disabled:opacity-50"><RoutineIcon type="check" className="h-4 w-4" />{ui("Gostei desta sugestão")}</button>
                                            ) : null}
                                            {!semSugestao && !convertida && refeicao.status !== "RECUSADA" ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmacaoRecusa(refeicao)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"><RoutineIcon type="x" className="h-4 w-4" />{ui("Não quero esta sugestão")}</button>
                                            ) : null}
                                            {!semSugestao && !convertida && refeicao.status === "APROVADA" ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmacao({ tipo: "reserva", refeicao })} className="min-h-10 rounded-full border border-app-baunilha-dourada px-4 py-2 text-sm font-bold text-app-mocha transition hover:bg-app-chantilly disabled:opacity-50">{ui("Reservar mesa")}</button>
                                            ) : null}
                                            {!semSugestao && !convertida && refeicao.status === "APROVADA" && refeicao.id_produto ? (
                                                <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmacao({ tipo: "pedido", refeicao })} className="min-h-10 rounded-full bg-app-caramelo-torrado px-4 py-2 text-sm font-bold text-white transition hover:bg-app-cafe-profundo disabled:opacity-50">{ui("Reservar e pedir")}</button>
                                            ) : null}
                                            {refeicao.id_reserva ? <Link href="/cliente/reservas" className="inline-flex h-10 items-center rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Ver reserva")}</Link> : null}
                                            {refeicao.id_pedido ? <Link href={`/cliente/pedidos/${refeicao.id_pedido}`} className="inline-flex h-10 items-center rounded-[8px] border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Ver pedido")}</Link> : null}
                                        </div>
                                        {experienciaConcluida ? (
                                            <section className="mt-5 rounded-[16px] border border-app-baunilha-dourada/60 bg-white p-4" aria-label={ui("Feedback da sugestão")}>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">{ui("Feedback da rotina")}</p>
                                                        <h4 className="mt-1 font-semibold">{feedback ? ui(feedback.gostou ? "Esta sugestão funcionou para você" : "Você marcou que a sugestão não funcionou") : ui("Como foi esta sugestão?")}</h4>
                                                        <p className="mt-1 text-sm text-app-cinza">{feedback ? ui("Você pode ajustar ou remover esse sinal das próximas sugestões.") : ui("Seu retorno melhora apenas suas próximas recomendações, quando você autorizar.")}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" disabled={Boolean(processando)} onClick={() => iniciarFeedback(refeicao)} className="min-h-10 rounded-full border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.1em] text-app-mocha transition hover:bg-app-chantilly disabled:opacity-50">{ui(feedback ? "Editar feedback" : "Avaliar sugestão")}</button>
                                                        {feedback ? <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmarExcluirFeedback(refeicao)} className="min-h-10 rounded-full border border-red-300 px-4 text-xs font-bold uppercase tracking-[0.1em] text-red-700 transition hover:bg-red-50 disabled:opacity-50">{ui("Remover")}</button> : null}
                                                    </div>
                                                </div>
                                                {feedback?.motivo ? <p className="mt-3 border-l-2 border-app-baunilha-dourada pl-3 text-sm text-app-mocha">{feedback.motivo}</p> : null}
                                            </section>
                                        ) : null}
                                        {feedbackEmEdicao?.id === refeicao.id_refeicao_planejada ? (
                                            <form onSubmit={salvarFeedback} className="mt-4 grid gap-4 rounded-[16px] border border-app-baunilha-dourada/60 bg-white p-4">
                                                <fieldset className="flex flex-wrap gap-2"><legend className="mb-2 text-sm font-semibold">{ui("A sugestão foi útil?")}</legend>
                                                    <button type="button" aria-pressed={feedbackEmEdicao.gostou} onClick={() => setFeedbackEmEdicao({ ...feedbackEmEdicao, gostou: true })} className={`min-h-10 rounded-full px-4 text-xs font-bold uppercase tracking-[0.1em] ${feedbackEmEdicao.gostou ? "bg-app-cafe-profundo text-white" : "border border-app-baunilha-dourada text-app-mocha"}`}>{ui("Gostei")}</button>
                                                    <button type="button" aria-pressed={!feedbackEmEdicao.gostou} onClick={() => setFeedbackEmEdicao({ ...feedbackEmEdicao, gostou: false })} className={`min-h-10 rounded-full px-4 text-xs font-bold uppercase tracking-[0.1em] ${!feedbackEmEdicao.gostou ? "bg-app-cafe-profundo text-white" : "border border-app-baunilha-dourada text-app-mocha"}`}>{ui("Não gostei")}</button>
                                                </fieldset>
                                                <label className="text-sm font-semibold">{ui("Você repetiria?")}<select value={String(feedbackEmEdicao.repetiria)} onChange={(event) => setFeedbackEmEdicao({ ...feedbackEmEdicao, repetiria: event.target.value === "true" })} className="mt-2 block min-h-11 w-full rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-sm"><option value="true">{ui("Sim")}</option><option value="false">{ui("Não")}</option></select></label>
                                                <label className="text-sm font-semibold">{ui("Comentário opcional")}<textarea value={feedbackEmEdicao.motivo} maxLength={500} onChange={(event) => setFeedbackEmEdicao({ ...feedbackEmEdicao, motivo: event.target.value })} rows={3} className="mt-2 block w-full rounded-[8px] border border-app-baunilha-dourada bg-white p-3 text-sm" placeholder={ui("Ex.: combinou com meu horário e orçamento")} /></label>
                                                <label className="text-sm font-semibold">{ui("Tags opcionais")}<input value={feedbackEmEdicao.tags} maxLength={320} onChange={(event) => setFeedbackEmEdicao({ ...feedbackEmEdicao, tags: event.target.value })} className="mt-2 block min-h-11 w-full rounded-[8px] border border-app-baunilha-dourada bg-white px-3 text-sm" placeholder={ui("Ex.: perto, preço justo")} /></label>
                                                <label className="flex items-start gap-3 text-sm text-app-mocha"><input type="checkbox" checked={feedbackEmEdicao.consentiu_personalizacao} onChange={(event) => setFeedbackEmEdicao({ ...feedbackEmEdicao, consentiu_personalizacao: event.target.checked })} className="mt-1 h-4 w-4" /><span>{ui("Usar este feedback para personalizar minhas próximas sugestões.")}</span></label>
                                                <div className="flex flex-wrap gap-2"><button disabled={Boolean(processando)} className="min-h-10 rounded-full bg-app-caramelo-torrado px-4 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50">{ui(processando.startsWith("feedback-") ? "Salvando..." : "Salvar feedback")}</button><button type="button" onClick={() => setFeedbackEmEdicao(null)} className="min-h-10 rounded-full border border-app-baunilha-dourada px-4 text-xs font-bold uppercase tracking-[0.1em] text-app-mocha hover:bg-app-chantilly">{ui("Cancelar")}</button></div>
                                            </form>
                                        ) : null}
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
                                                    <button disabled={Boolean(processando)} className="rounded-full bg-app-caramelo-torrado px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{ui("Salvar alteração")}</button>
                                                    <button type="button" disabled={Boolean(processando)} onClick={() => setConfirmarDescartar(true)} className="rounded-full border border-app-baunilha-dourada px-5 py-3 text-sm hover:bg-app-chantilly">{ui("Descartar edição")}</button>
                                                </div>
                                            </form>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                        </div>
                    </section>)}
                </div> : null}
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
            <ConfirmationDialog
                open={Boolean(confirmacaoRecusa)}
                eyebrow={ui("Recusar sugestão")}
                title={ui("Retirar esta refeição da semana?")}
                description={ui("A sugestão ficará marcada como recusada. Nenhuma reserva ou cobrança será criada.")}
                confirmLabel={ui("Recusar sugestão")}
                cancelLabel={ui("Manter sugestão")}
                loading={Boolean(processando?.startsWith("recusar-"))}
                onConfirm={() => atualizarStatus(confirmacaoRecusa, "recusar")}
                onCancel={() => setConfirmacaoRecusa(null)}
                details={confirmacaoRecusa ? <div><p className="font-semibold">{confirmacaoRecusa.restaurantes?.nome ?? ui("Restaurante")}</p><p className="mt-1 text-xs text-app-cinza">{dataCurta(confirmacaoRecusa.data_refeicao, localeUI)} · {confirmacaoRecusa.produtos?.nome ?? ui("Somente reserva")}</p></div> : null}
            />
            <ConfirmationDialog
                open={confirmarDescartar}
                eyebrow={ui("Alteração em andamento")}
                title={ui("Descartar esta edição?")}
                description={ui("A sugestão salva continuará igual. Somente as mudanças ainda não enviadas serão descartadas.")}
                confirmLabel={ui("Descartar edição")}
                cancelLabel={ui("Continuar editando")}
                loading={false}
                onConfirm={() => { setEdicao(null); setConfirmarDescartar(false); }}
                onCancel={() => setConfirmarDescartar(false)}
            />
            <ConfirmationDialog open={Boolean(confirmarOutraSugestao)} eyebrow={ui("Alternativa do dia")} title={ui("Trocar esta sugestão?")} description={ui("A Appono escolherá a próxima alternativa compatível para este dia, preservando o restante da semana.")} confirmLabel={ui("Buscar outra sugestão")} cancelLabel={ui("Manter atual")} variant="default" loading={Boolean(processando?.startsWith("alternativa-"))} onConfirm={pedirOutraSugestao} onCancel={() => setConfirmarOutraSugestao(null)} />
            <ConfirmationDialog open={Boolean(confirmarExcluirFeedback)} eyebrow={ui("Remover feedback")} title={ui("Remover este feedback da personalização?")} description={ui("Ele deixará de influenciar as próximas sugestões. Sua reserva, pedido e dados financeiros não serão alterados.")} confirmLabel={ui("Remover feedback")} cancelLabel={ui("Manter feedback")} variant="danger" loading={Boolean(processando?.startsWith("excluir-feedback-"))} onConfirm={excluirFeedback} onCancel={() => setConfirmarExcluirFeedback(null)} />
        </main>
    );
}
