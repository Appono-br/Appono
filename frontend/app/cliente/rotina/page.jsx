"use client";

import { RoutineHero, RoutineIcon, RoutineNotice, RoutineSkeleton, RoutineStatus } from "@/components/cliente/rotina/routine-ui";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { apiRequest } from "@/lib/api";
import { estadoPlanejamento } from "@/lib/routine-view.mjs";
import { useInterface } from "@/lib/use-interface";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
    const router = useRouter();
    const [perfil, setPerfil] = useState(null);
    const [planejamento, setPlanejamento] = useState(null);
    const [refeicoes, setRefeicoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState("");
    const [gerando, setGerando] = useState(false);
    const [confirmarGeracao, setConfirmarGeracao] = useState(false);
    const [recarregar, setRecarregar] = useState(0);

    useEffect(() => {
        let cancelado = false;
        const parametros = new URLSearchParams(window.location.search);
        const semanaUrl = /^\d{4}-\d{2}-\d{2}$/.test(parametros.get("semana_inicio") ?? "")
            ? parametros.get("semana_inicio") : "";
        const resultado = parametros.get("resultado");
        const agendaResultado = parametros.get("agenda");
        async function carregar() {
            setCarregando(true);
            try {
                const [perfilResposta, planejamentoResposta] = await Promise.all([
                    apiRequest("/rotina/perfil", { forceRefresh: true }),
                    apiRequest(`/rotina/planejamento${semanaUrl ? `?semana_inicio=${semanaUrl}` : ""}`, { forceRefresh: true }),
                ]);
                if (cancelado) return;
                setPerfil(perfilResposta);
                setPlanejamento(planejamentoResposta?.planejamento ?? null);
                setRefeicoes(planejamentoResposta?.refeicoes ?? []);
                if (resultado === "salvo") setMensagem("Rotina salva. Você pode gerar sua semana quando quiser.");
                if (resultado === "gerado") setMensagem("Semana gerada com sucesso.");
                if (resultado === "gerado_sem_opcoes") setMensagem("Semana gerada, mas nenhum restaurante atende aos critérios atuais.");
                if (resultado === "geracao_erro") setMensagem("A rotina foi salva, mas não foi possível gerar a semana. Revise os dados e tente novamente.");
                if (agendaResultado === "sincronizada") setMensagem("Semana gerada e enviada ao Google Agenda.");
                if (agendaResultado === "parcial") setMensagem("Semana gerada. Alguns eventos do Google Agenda precisarão de uma nova sincronização.");
                if (agendaResultado === "erro") setMensagem("Semana gerada. O Google Agenda não respondeu, mas seu planejamento foi preservado.");
                if (agendaResultado === "reconectar") setMensagem("Semana gerada. Reconecte o Google Agenda para autorizar a criação dos eventos.");
            } catch (error) {
                if (!cancelado) setMensagem(error instanceof Error ? error.message : "Não foi possível carregar sua rotina.");
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }
        carregar();
        return () => { cancelado = true; };
    }, [recarregar]);

    useEffect(() => {
        const veioDaConfiguracao = new URLSearchParams(window.location.search).get("origem") === "configuracao";
        if (!carregando && planejamento && !veioDaConfiguracao) router.replace("/cliente/rotina/planejamento");
    }, [carregando, planejamento, router]);

    const estado = useMemo(() => estadoPlanejamento({ perfil, planejamento, refeicoes }), [perfil, planejamento, refeicoes]);
    const resumo = useMemo(() => ({
        total: refeicoes.length,
        aprovadas: refeicoes.filter((item) => item.status === "APROVADA").length,
        convertidas: refeicoes.filter((item) => item.status?.startsWith("CONVERTIDA")).length,
    }), [refeicoes]);

    async function gerarSemana() {
        if (gerando || !perfil) return;
        setGerando(true);
        setMensagem("");
        try {
            const resposta = await apiRequest("/rotina/planejamento/gerar", {
                method: "POST",
                body: JSON.stringify({
                    versao_perfil: Number(perfil.versao ?? 0),
                    versao_planejamento: Number(planejamento?.versao ?? 0),
                    semana_base: planejamento?.semana_inicio,
                }),
            });
            setPlanejamento(resposta.planejamento);
            setRefeicoes(resposta.refeicoes ?? []);
            setMensagem("Planejamento atualizado.");
            setConfirmarGeracao(false);
        } catch (error) {
            setMensagem(error instanceof Error ? error.message : "Não foi possível gerar o planejamento.");
        } finally {
            setGerando(false);
        }
    }

    const acaoPrincipal = !planejamento
        ? <Link href="/cliente/rotina/configurar" className="inline-flex min-h-11 items-center justify-center rounded-full bg-app-cafe-profundo px-6 py-3 text-sm font-bold text-app-creme-leve hover:bg-app-caramelo-torrado">{ui("Configurar rotina")}</Link>
        : estado.acao === "configurar"
        ? <Link href="/cliente/rotina/configurar" className="inline-flex min-h-11 items-center justify-center rounded-full bg-app-cafe-profundo px-6 py-3 text-sm font-bold text-app-creme-leve hover:bg-app-caramelo-torrado">{ui("Começar configuração")}</Link>
        : estado.acao === "gerar"
            ? <button type="button" disabled={gerando} onClick={() => planejamento ? setConfirmarGeracao(true) : gerarSemana()} className="min-h-11 rounded-full bg-app-cafe-profundo px-6 py-3 text-sm font-bold text-app-creme-leve hover:bg-app-caramelo-torrado disabled:opacity-50">{ui(gerando ? "Gerando sugestões..." : "Gerar minha semana")}</button>
            : <Link href="/cliente/rotina/planejamento" className="inline-flex min-h-11 items-center justify-center rounded-full bg-app-cafe-profundo px-6 py-3 text-sm font-bold text-app-creme-leve hover:bg-app-caramelo-torrado">{ui(estado.proxima ? "Ver minha semana" : "Ajustar critérios")}</Link>;

    return <main className="min-h-screen bg-white px-4 py-6 text-app-cafe-profundo sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl">
            <RoutineHero
                eyebrow={ui("Appono Rotina")}
                title={ui(perfil ? "Sua próxima decisão, em um só lugar." : "Vamos organizar suas refeições.")}
                description={ui("Defina sua rotina, receba sugestões e reserve somente quando fizer sentido para você.")}
                aside={<div className="grid grid-cols-3 gap-2 rounded-[18px] bg-white/10 p-4 text-center ring-1 ring-white/15 sm:min-w-80">
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-app-baunilha-dourada">{ui("Dias")}</p><strong className="mt-1 block text-2xl">{resumo.total}</strong></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-app-baunilha-dourada">{ui("Aprovadas")}</p><strong className="mt-1 block text-2xl">{resumo.aprovadas}</strong></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-app-baunilha-dourada">{ui("Reservadas")}</p><strong className="mt-1 block text-2xl">{resumo.convertidas}</strong></div>
                </div>}
            />

            {mensagem ? <div className="mt-5"><RoutineNotice type={mensagem.includes("não respondeu") || mensagem.includes("Reconecte") || mensagem.includes("Alguns eventos") || mensagem.includes("não foi possível gerar") || mensagem.includes("nenhum restaurante") ? "warning" : mensagem.includes("salva") || mensagem.includes("gerada") || mensagem === "Planejamento atualizado." ? "success" : "error"} action={mensagem.includes("não respondeu") || mensagem.includes("Reconecte") || mensagem.includes("Alguns eventos") || mensagem.includes("salva") || mensagem.includes("gerada") || mensagem.includes("não foi possível gerar") || mensagem.includes("nenhum restaurante") || mensagem === "Planejamento atualizado." ? null : <button type="button" disabled={carregando || gerando} onClick={() => setRecarregar((valor) => valor + 1)} className="min-h-10 rounded-full border border-current px-4 text-xs font-bold uppercase tracking-wider">{ui("Recarregar")}</button>}>{ui(mensagem)}</RoutineNotice></div> : null}
            {carregando ? <div className="mt-5"><RoutineSkeleton /></div> : null}


            {!carregando ? <div className="mt-5 grid items-start gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                <article className="hidden">
                    <div className="flex items-start justify-between gap-4">
                        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Seu perfil")}</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{perfil?.nome ?? ui("Rotina ainda não configurada")}</h2></div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve"><RoutineIcon type="route" /></div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-app-cinza">{perfil ? (perfil.endereco_base || ui("Base definida pela sua localização.")) : ui("Defina dias, horários, orçamento e preferências para começar.")}</p>
                    <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <div className="rounded-[16px] border border-app-baunilha-dourada/45 p-4"><dt className="text-[10px] font-bold uppercase tracking-wider text-app-caramelo-torrado">{ui("Orçamento diário")}</dt><dd className="mt-1 text-xl font-semibold">{formatarMoeda(perfil?.orcamento_diario, localeUI)}</dd></div>
                        <div className="rounded-[16px] border border-app-baunilha-dourada/45 p-4"><dt className="text-[10px] font-bold uppercase tracking-wider text-app-caramelo-torrado">{ui("Raio máximo")}</dt><dd className="mt-1 text-xl font-semibold">{perfil?.raio_km ? `${perfil.raio_km} km` : "--"}</dd></div>
                    </dl>
                    {perfil ? <p className="mt-4 text-sm leading-6 text-app-cinza">{perfil.dias_semana.length} {ui("dias por semana")} · {String(perfil.horario_inicio).slice(0, 5)}–{String(perfil.horario_fim).slice(0, 5)} · {ui("saída de até")} {perfil.tempo_maximo_minutos} min</p> : null}
                    <Link href="/cliente/rotina/configurar" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-app-baunilha-dourada px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha hover:bg-app-chantilly">{ui(perfil ? "Editar preferências" : "Configurar rotina")}</Link>
                </article>

                <article className={`rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/55 sm:p-7 ${planejamento ? "order-1" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui(planejamento ? "Próxima refeição" : "Comece por aqui")}</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{ui(planejamento ? estado.titulo : "Configure sua rotina")}</h2></div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-app-cafe-profundo text-app-creme-leve"><RoutineIcon type="spark" /></div>
                    </div>
                    {planejamento && estado.proxima ? <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="rounded-[16px] border border-app-baunilha-dourada/45 p-5"><p className="font-semibold capitalize">{formatarData(estado.proxima.data_refeicao, localeUI)} {ui("às")} {String(estado.proxima.horario_sugerido ?? "").slice(0, 5)}</p><p className="mt-2 text-sm text-app-cinza">{estado.proxima.produtos?.nome ?? ui("Reserva sem item definido")}</p><div className="mt-3"><RoutineStatus status={estado.proxima.status} /></div></div>
                        <p className="max-w-sm text-sm leading-6 text-app-cinza">{estado.proxima.motivo_recomendacao}</p>
                    </div> : <p className="mt-5 max-w-2xl text-sm leading-6 text-app-cinza">{ui(planejamento ? estado.descricao : "Informe seus horários, ponto de partida e preferências. Depois a Appono encontrará sugestões que se encaixem no seu dia.")}</p>}
                    <div className="mt-6 flex flex-wrap gap-3">{acaoPrincipal}{planejamento ? <Link href="/cliente/rotina/planejamento" className="inline-flex min-h-11 items-center justify-center rounded-full border border-app-baunilha-dourada px-6 py-3 text-sm font-bold text-app-mocha hover:bg-app-chantilly">{ui("Abrir semana")}</Link> : null}</div>
                </article>

            </div> : null}
        </div>

        <ConfirmationDialog open={confirmarGeracao} eyebrow={ui("Atualizar semana")} title={ui("Gerar novas sugestões?")} description={ui("As sugestões ainda não convertidas serão recalculadas. Reservas e pedidos já criados permanecem preservados.")} confirmLabel={ui("Gerar sugestões")} cancelLabel={ui("Manter planejamento")} variant="default" loading={gerando} onConfirm={gerarSemana} onCancel={() => setConfirmarGeracao(false)} />
    </main>;
}
