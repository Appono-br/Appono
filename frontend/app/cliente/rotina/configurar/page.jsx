"use client";

import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { validarJanela } from "@/lib/routine-view.mjs";
import { RoutineBreadcrumb, RoutineHero, RoutineNotice, RoutineSkeleton } from "@/components/cliente/rotina/routine-ui";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const diasSemana = [
    { id: "monday", label: "Segunda" },
    { id: "tuesday", label: "Terça" },
    { id: "wednesday", label: "Quarta" },
    { id: "thursday", label: "Quinta" },
    { id: "friday", label: "Sexta" },
    { id: "saturday", label: "Sábado" },
    { id: "sunday", label: "Domingo" },
];

const estadoInicial = {
    nome: "Rotina principal",
    endereco_base: "",
    dias_semana: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    horario_inicio: "12:00",
    horario_fim: "14:00",
    tempo_maximo_minutos: 60,
    orcamento_diario: "",
    orcamento_semanal: "",
    raio_km: 5,
    preferencias: "",
    restricoes: "",
    alergias: "",
    restaurantes_favoritos_rotina: [],
    pratos_favoritos_rotina: [],
    janelas_alimentacao: [{
        tipo: "ALMOCO", nome: "Almoço", dias_semana: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        horario_inicio: "12:00", horario_fim: "14:00", tempo_maximo_minutos: 60,
        orcamento_por_refeicao: "", raio_km: 5, ativa: true, ordem: 0,
    }],
};

const rotulosJanela = { CAFE: "Café", ALMOCO: "Almoço", JANTAR: "Jantar", PERSONALIZADA: "Personalizada" };

function janelaPadrao(tipo = "ALMOCO", ordem = 0) {
    const horarios = { CAFE: ["07:00", "09:30"], ALMOCO: ["12:00", "14:00"], JANTAR: ["19:00", "21:30"], PERSONALIZADA: ["15:00", "17:00"] };
    const [horario_inicio, horario_fim] = horarios[tipo] ?? horarios.PERSONALIZADA;
    return { ...estadoInicial.janelas_alimentacao[0], tipo, nome: rotulosJanela[tipo], horario_inicio, horario_fim, ordem };
}

function listaParaTexto(lista) {
    return Array.isArray(lista) ? lista.join(", ") : "";
}

function textoParaLista(texto) {
    return String(texto ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function campoNumero(valor) {
    return valor === "" || valor === null || valor === undefined ? null : Number(valor);
}

function Icon({ type, className = "h-5 w-5" }) {
    const paths = {
        arrow: "M19 12H5m6-6-6 6 6 6",
        pin: "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    };
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`}><path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export default function ConfigurarRotinaPage() {
    const { ui } = useInterface();
    const router = useRouter();
    const [form, setForm] = useState(estadoInicial);
    const [formSalvo, setFormSalvo] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [catalogo, setCatalogo] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [falhaCarga, setFalhaCarga] = useState(false);
    const [versaoPerfil, setVersaoPerfil] = useState(null);
    const [conflito, setConflito] = useState(false);
    const [recarregar, setRecarregar] = useState(0);
    const [rascunho, setRascunho] = useState(null);
    const [buscaPreferidos, setBuscaPreferidos] = useState("");
    const [confirmarDescartar, setConfirmarDescartar] = useState(false);
    const [agenda, setAgenda] = useState({ provedores: [], conexoes: [], janelas_ocupadas: [] });
    const [carregandoAgenda, setCarregandoAgenda] = useState(true);
    const [acaoAgenda, setAcaoAgenda] = useState(null);
    const [confirmarAgenda, setConfirmarAgenda] = useState(null);
    const [candidatosEndereco, setCandidatosEndereco] = useState([]);
    const [geocodificacaoSelecionada, setGeocodificacaoSelecionada] = useState("");
    const erroJanela = form.janelas_alimentacao.map((janela) => validarJanela(janela)).find(Boolean) ?? "";
    const correspondeBusca = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(buscaPreferidos.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());

    useEffect(() => {
        let cancelado = false;
        Promise.all([apiRequest("/rotina/perfil", { forceRefresh: true }), apiRequest("/rotina/catalogo")])
            .then(([perfil, restaurantes]) => {
                if (cancelado) return;
                setCatalogo(restaurantes);
                setVersaoPerfil(Number(perfil?.versao ?? 0));
                setFalhaCarga(false);
                setConflito(false);
                const proximoForm = perfil ? {
                        ...estadoInicial,
                        nome: perfil.nome ?? estadoInicial.nome,
                        endereco_base: perfil.endereco_base ?? "",
                        dias_semana: perfil.dias_semana?.length ? perfil.dias_semana : estadoInicial.dias_semana,
                        horario_inicio: String(perfil.horario_inicio ?? "12:00").slice(0, 5),
                        horario_fim: String(perfil.horario_fim ?? "14:00").slice(0, 5),
                        tempo_maximo_minutos: perfil.tempo_maximo_minutos ?? 60,
                        orcamento_diario: perfil.orcamento_diario ?? "",
                        orcamento_semanal: perfil.orcamento_semanal ?? "",
                        raio_km: perfil.raio_km ?? 5,
                        preferencias: listaParaTexto(perfil.preferencias),
                        restricoes: listaParaTexto(perfil.restricoes),
                        alergias: listaParaTexto(perfil.alergias),
                        restaurantes_favoritos_rotina: perfil.restaurantes_favoritos_rotina ?? [],
                        pratos_favoritos_rotina: perfil.pratos_favoritos_rotina ?? [],
                        janelas_alimentacao: perfil.janelas_alimentacao?.length
                            ? perfil.janelas_alimentacao.map((janela, ordem) => ({ ...janela, horario_inicio: String(janela.horario_inicio).slice(0, 5), horario_fim: String(janela.horario_fim).slice(0, 5), ordem }))
                            : [janelaPadrao("ALMOCO")],
                    } : estadoInicial;
                setForm(proximoForm);
                setFormSalvo(proximoForm);
                setMensagem("");
            })
            .catch((error) => {
                if (!cancelado) {
                    setMensagem(error instanceof Error ? error.message : "Não foi possível carregar sua rotina.");
                    setFalhaCarga(true);
                }
            }).finally(() => {
                if (!cancelado) setCarregando(false);
            });
        return () => { cancelado = true; };
    }, [recarregar]);

    useEffect(() => {
        let cancelado = false;
        const resultado = new URLSearchParams(window.location.search).get("agenda");
        apiRequest("/rotina/agenda", { forceRefresh: true, cacheTtlMs: 0 })
            .then((dados) => {
                if (cancelado) return;
                setAgenda(dados);
                if (resultado === "conectada") setMensagem("Agenda conectada. Sincronize para revisar seus horários ocupados.");
                if (resultado === "erro") setMensagem("Não foi possível concluir a conexão da agenda. Tente novamente.");
            })
            .catch((error) => { if (!cancelado) setMensagem(error.message); })
            .finally(() => { if (!cancelado) setCarregandoAgenda(false); });
        return () => { cancelado = true; };
    }, []);

    async function executarAcaoAgenda() {
        const acao = confirmarAgenda;
        if (!acao) return;
        setAcaoAgenda(`${acao.tipo}:${acao.provedor}`);
        try {
            if (acao.tipo === "conectar") {
                const resposta = await apiRequest(`/rotina/agenda/${acao.provedor.toLowerCase()}/conectar`, {
                    method: "POST", body: JSON.stringify({ retorno_path: "/cliente/rotina/configurar" }),
                });
                window.location.assign(resposta.authorization_url);
                return;
            }
            await apiRequest(`/rotina/agenda/${acao.provedor.toLowerCase()}`, { method: "DELETE" });
            setAgenda((atual) => ({
                ...atual,
                conexoes: atual.conexoes.map((item) => item.provedor === acao.provedor ? { ...item, status: "REVOGADO", ultima_sincronizacao_em: null } : item),
                janelas_ocupadas: atual.janelas_ocupadas.filter((janela) => {
                    const conexao = atual.conexoes.find((item) => item.id_conexao_agenda === janela.id_conexao_agenda);
                    return conexao?.provedor !== acao.provedor;
                }),
            }));
            setMensagem("Agenda desconectada e horários importados removidos.");
        } catch (error) {
            setMensagem(error.message);
        } finally {
            setAcaoAgenda(null);
            setConfirmarAgenda(null);
        }
    }

    async function sincronizarAgenda(provedor) {
        setAcaoAgenda(`sincronizar:${provedor}`);
        try {
            const resposta = await apiRequest(`/rotina/agenda/${provedor.toLowerCase()}/sincronizar`, {
                method: "POST", body: JSON.stringify({ chave_idempotencia: crypto.randomUUID() }),
            });
            setMensagem(`${resposta.intervalos} período(s) ocupado(s) sincronizado(s). Suas sugestões anteriores não foram alteradas.`);
            setAgenda(await apiRequest("/rotina/agenda", { forceRefresh: true, cacheTtlMs: 0 }));
        } catch (error) {
            setMensagem(error.message);
        } finally {
            setAcaoAgenda(null);
        }
    }

    function atualizar(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }));
    }

    function alternarDia(dia) {
        setForm((atual) => {
            const selecionado = atual.dias_semana.includes(dia);
            const dias = selecionado ? atual.dias_semana.filter((item) => item !== dia) : [...atual.dias_semana, dia];
            return { ...atual, dias_semana: dias };
        });
    }

    function atualizarJanela(indice, campo, valor) {
        setForm((atual) => ({ ...atual, janelas_alimentacao: atual.janelas_alimentacao.map((janela, posicao) => posicao === indice ? { ...janela, [campo]: valor } : janela) }));
    }

    function alternarDiaJanela(indice, dia) {
        setForm((atual) => ({ ...atual, janelas_alimentacao: atual.janelas_alimentacao.map((janela, posicao) => {
            if (posicao !== indice) return janela;
            return { ...janela, dias_semana: janela.dias_semana.includes(dia) ? janela.dias_semana.filter((item) => item !== dia) : [...janela.dias_semana, dia] };
        }) }));
    }

    function adicionarJanela(tipo) {
        setForm((atual) => {
            const repetidas = atual.janelas_alimentacao.filter((janela) => janela.tipo === tipo).length;
            const janela = janelaPadrao(tipo, atual.janelas_alimentacao.length);
            if (repetidas) janela.nome = `${rotulosJanela[tipo]} ${repetidas + 1}`;
            return { ...atual, janelas_alimentacao: [...atual.janelas_alimentacao, janela] };
        });
    }

    function removerJanela(indice) {
        setForm((atual) => atual.janelas_alimentacao.length <= 1 ? atual : ({ ...atual, janelas_alimentacao: atual.janelas_alimentacao.filter((_, posicao) => posicao !== indice).map((janela, ordem) => ({ ...janela, ordem })) }));
    }

    async function salvar(event) {
        event.preventDefault();
        if (erroJanela || falhaCarga || salvando || conflito || versaoPerfil === null) {
            setMensagem(erroJanela || "Recarregue a página para recuperar sua configuração antes de salvar.");
            return;
        }
        setSalvando(true);
        setMensagem("");
        try {
            const janelaPrincipal = form.janelas_alimentacao.find((janela) => janela.tipo === "ALMOCO") ?? form.janelas_alimentacao[0];
            const perfilSalvo = await apiRequest("/rotina/perfil", {
                method: "POST",
                body: JSON.stringify({
                    versao_perfil: versaoPerfil,
                    nome: form.nome,
                    endereco_base: form.endereco_base,
                    dias_semana: janelaPrincipal.dias_semana,
                    horario_inicio: janelaPrincipal.horario_inicio,
                    horario_fim: janelaPrincipal.horario_fim,
                    tempo_maximo_minutos: campoNumero(janelaPrincipal.tempo_maximo_minutos),
                    orcamento_diario: campoNumero(form.orcamento_diario),
                    orcamento_semanal: campoNumero(form.orcamento_semanal),
                    raio_km: campoNumero(janelaPrincipal.raio_km),
                    preferencias: textoParaLista(form.preferencias),
                    restricoes: textoParaLista(form.restricoes),
                    alergias: textoParaLista(form.alergias),
                    restaurantes_favoritos_rotina: form.restaurantes_favoritos_rotina,
                    pratos_favoritos_rotina: form.pratos_favoritos_rotina,
                    geocodificacao_selecionada: geocodificacaoSelecionada || undefined,
                    janelas_alimentacao: form.janelas_alimentacao.map((janela, ordem) => ({ ...janela, ordem, tempo_maximo_minutos: campoNumero(janela.tempo_maximo_minutos), orcamento_por_refeicao: campoNumero(janela.orcamento_por_refeicao), raio_km: campoNumero(janela.raio_km) })),
                }),
            });
            setVersaoPerfil(Number(perfilSalvo.versao));
            setFormSalvo(form);
            setRascunho(null);
            setCandidatosEndereco([]);
            setGeocodificacaoSelecionada("");
            setMensagem("Rotina salva. Agora você pode gerar o planejamento semanal.");
        } catch (error) {
            if (error.status === 409) setConflito(true);
            if (error.code === "ROUTINE_ADDRESS_AMBIGUOUS") {
                setCandidatosEndereco(error.details?.candidatos ?? []);
                setMensagem("Encontramos mais de um endereço. Escolha a opção correta e salve novamente.");
                return;
            }
            setMensagem(error instanceof Error ? error.message : "Não foi possível salvar a rotina.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className="min-h-screen bg-white px-4 py-6 text-app-cafe-profundo sm:px-6 sm:py-8">
            <section className="mx-auto max-w-6xl">
                <RoutineBreadcrumb>{ui("Voltar para Appono Rotina")}</RoutineBreadcrumb>
                <div className="mt-4"><RoutineHero eyebrow={ui("Configuração da rotina")} title={ui("Defina como sua semana deve funcionar.")} description={ui("Organize sua base, janela de almoço, orçamento e preferências. Você poderá revisar tudo antes de gerar sugestões.")} /></div>

                {mensagem ? <div className="mt-5"><RoutineNotice type={conflito || falhaCarga ? "error" : "success"}>{ui(mensagem)}</RoutineNotice></div> : null}
                {conflito || falhaCarga ? <div className="mt-4"><RoutineNotice type="warning" action={<button type="button" disabled={carregando} className="min-h-10 rounded-full border border-current px-4 text-xs font-bold uppercase tracking-wider" onClick={() => {
                        setRascunho(form); setCarregando(true); setRecarregar((valor) => valor + 1);
                    }}>{ui("Recarregar dados")}</button>}><p>{ui("Sua edição continua nesta tela. Recarregue para comparar com a versão salva.")}</p></RoutineNotice></div> : null}
                {rascunho && !conflito && !carregando && !falhaCarga ? <div className="mt-4"><RoutineNotice type="info" action={<button type="button" className="min-h-10 rounded-full border border-current px-4 text-xs font-bold uppercase tracking-wider" onClick={() => {
                        setForm(rascunho); setRascunho(null); setMensagem("Rascunho restaurado. Revise antes de salvar sobre a versão atual.");
                    }}>{ui("Restaurar rascunho")}</button>}><p>{ui("Os dados salvos foram recarregados e seu rascunho anterior foi preservado.")}</p></RoutineNotice></div> : null}

                {carregando ? <div className="mt-5"><RoutineSkeleton cards={3} /></div> : null}

                <form onSubmit={salvar} className={`${carregando ? "hidden" : "grid"} mt-5 gap-5`}>
                    <fieldset disabled={carregando || salvando || falhaCarga} className="grid min-w-0 gap-5">
                    <section className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/55">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Base")}</p>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Nome da rotina")}
                                <input value={form.nome} onChange={(event) => atualizar("nome", event.target.value)} className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">
                                {ui("Endereço-base")}
                                <input value={form.endereco_base} onChange={(event) => { atualizar("endereco_base", event.target.value); setCandidatosEndereco([]); setGeocodificacaoSelecionada(""); }} required placeholder={ui("Ex: Rua, número, bairro, cidade e UF")} className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                        </div>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-app-cinza">{ui("Usamos o endereço apenas para encontrar restaurantes próximos. As coordenadas são calculadas com segurança no servidor e não ficam editáveis nesta tela.")}</p>
                        {candidatosEndereco.length > 0 ? <fieldset className="mt-5 rounded-2xl border border-app-baunilha-dourada bg-app-chantilly/40 p-4"><legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Qual endereço corresponde à sua base?")}</legend><div className="mt-3 grid gap-2">{candidatosEndereco.map((candidato) => <label key={candidato.place_id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 text-sm text-app-cafe-profundo ring-1 ring-app-baunilha-dourada/55"><input type="radio" name="endereco-geocodificado" value={candidato.place_id} checked={geocodificacaoSelecionada === candidato.place_id} onChange={(event) => setGeocodificacaoSelecionada(event.target.value)} className="mt-0.5 accent-app-caramelo-torrado" /><span>{candidato.nome}</span></label>)}</div></fieldset> : null}
                    </section>

                    <section className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/55">
                        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Janelas alimentares")}</p><p className="mt-2 max-w-2xl text-sm leading-6 text-app-cinza">{ui("Organize café, almoço, jantar ou um horário próprio. Cada janela recebe sugestões, limites e distância compatíveis.")}</p></div><span className="rounded-full border border-app-baunilha-dourada px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-app-mocha">{form.janelas_alimentacao.length}/8</span></div>
                        <div className="mt-5 grid gap-4">
                            {form.janelas_alimentacao.map((janela, indice) => {
                                const [inicioHora, inicioMinuto] = String(janela.horario_inicio).split(":").map(Number);
                                const [fimHora, fimMinuto] = String(janela.horario_fim).split(":").map(Number);
                                const duracao = (fimHora * 60 + fimMinuto) - (inicioHora * 60 + inicioMinuto);
                                const erro = validarJanela(janela);
                                return <article key={janela.id_janela_alimentacao ?? `${janela.tipo}-${indice}`} className="rounded-2xl border border-app-baunilha-dourada/75 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><select aria-label={ui("Tipo da janela")} value={janela.tipo} onChange={(event) => { const tipo = event.target.value; atualizarJanela(indice, "tipo", tipo); if (janela.nome === rotulosJanela[janela.tipo]) atualizarJanela(indice, "nome", rotulosJanela[tipo]); }} className="h-10 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-xs font-bold uppercase tracking-wider text-app-mocha"><option value="CAFE">{ui("Café")}</option><option value="ALMOCO">{ui("Almoço")}</option><option value="JANTAR">{ui("Jantar")}</option><option value="PERSONALIZADA">{ui("Personalizada")}</option></select><input aria-label={ui("Nome da janela")} value={janela.nome} onChange={(event) => atualizarJanela(indice, "nome", event.target.value)} className="h-10 min-w-40 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" /></div>{form.janelas_alimentacao.length > 1 ? <button type="button" onClick={() => removerJanela(indice)} className="min-h-10 rounded-full px-3 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-50">{ui("Remover")}</button> : null}</div>
                                    <div className="mt-4 flex flex-wrap gap-2">{diasSemana.map((dia) => <button key={dia.id} type="button" aria-pressed={janela.dias_semana.includes(dia.id)} onClick={() => alternarDiaJanela(indice, dia.id)} className={`h-9 rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.1em] transition ${janela.dias_semana.includes(dia.id) ? "bg-app-cafe-profundo text-app-creme-leve" : "border border-app-baunilha-dourada text-app-mocha hover:bg-app-chantilly"}`}>{ui(dia.label)}</button>)}</div>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha">{ui("Início")}<input type="time" value={janela.horario_inicio} onChange={(event) => atualizarJanela(indice, "horario_inicio", event.target.value)} className="h-11 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha">{ui("Fim")}<input type="time" value={janela.horario_fim} onChange={(event) => atualizarJanela(indice, "horario_fim", event.target.value)} className="h-11 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha">{ui("Tempo máximo (min)")}<input type="number" min="30" max={Math.min(240, Math.max(30, duracao || 30))} value={janela.tempo_maximo_minutos} onChange={(event) => atualizarJanela(indice, "tempo_maximo_minutos", event.target.value)} className="h-11 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal" /></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha">{ui("Raio máximo (km)")}<input type="number" min="1" max="100" step="0.1" value={janela.raio_km} onChange={(event) => atualizarJanela(indice, "raio_km", event.target.value)} className="h-11 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal" /></label></div>
                                    <label className="mt-4 grid max-w-xs gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha">{ui("Orçamento por refeição (opcional)")}<input inputMode="decimal" placeholder={ui("Usar orçamento diário") } value={janela.orcamento_por_refeicao ?? ""} onChange={(event) => atualizarJanela(indice, "orcamento_por_refeicao", event.target.value)} className="h-11 rounded-lg border border-app-baunilha-dourada bg-white px-3 text-sm font-semibold normal-case tracking-normal" /></label>
                                    <p className={`mt-3 text-sm leading-6 ${erro ? "text-red-700" : "text-app-cinza"}`}>{erro || ui(`Janela de ${duracao} min; a saída pode durar até ${janela.tempo_maximo_minutos} min.`)}</p>
                                </article>;
                            })}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">{["CAFE", "ALMOCO", "JANTAR", "PERSONALIZADA"].map((tipo) => <button key={tipo} type="button" disabled={form.janelas_alimentacao.length >= 8} onClick={() => adicionarJanela(tipo)} className="min-h-10 rounded-full border border-app-baunilha-dourada px-4 text-[10px] font-bold uppercase tracking-wider text-app-mocha transition hover:bg-app-chantilly disabled:opacity-40">+ {ui(rotulosJanela[tipo])}</button>)}</div>
                    </section>

                    <section className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/55">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Preferências")}</p>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Orçamento diário")}
                                <input value={form.orcamento_diario} onChange={(event) => atualizar("orcamento_diario", event.target.value)} inputMode="decimal" placeholder="40" className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Orçamento semanal")}
                                <input value={form.orcamento_semanal} onChange={(event) => atualizar("orcamento_semanal", event.target.value)} inputMode="decimal" placeholder="200" className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha md:col-span-2">{ui("Preferências alimentares")}
                                <textarea value={form.preferencias} onChange={(event) => atualizar("preferencias", event.target.value)} placeholder={ui("Ex: massa, salada, japonês, frango...")} rows={3} className="rounded-[10px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Restrições")}
                                <textarea value={form.restricoes} onChange={(event) => atualizar("restricoes", event.target.value)} placeholder={ui("Ex: sem lactose, vegetariano...")} rows={3} className="rounded-[10px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Alergias")}
                                <textarea value={form.alergias} onChange={(event) => atualizar("alergias", event.target.value)} placeholder={ui("Ex: camarão, amendoim...")} rows={3} className="rounded-[10px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                        </div>
                    </section>

                    <section className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/55">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Agenda")}</p>
                                <h2 className="mt-2 text-xl font-semibold">{ui("Proteja sua janela de almoço")}</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-app-cinza">{ui("A Appono consulta somente períodos ocupados. Títulos, convidados e descrições dos eventos não são importados.")}</p>
                            </div>
                            <span className="rounded-full border border-app-baunilha-dourada px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-app-mocha">{agenda.janelas_ocupadas.length} {ui("períodos ocupados")}</span>
                        </div>
                        {carregandoAgenda ? <div className="mt-5 h-24 animate-pulse rounded-xl bg-app-chantilly" /> : (
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {agenda.provedores.map((item) => {
                                    const conexao = agenda.conexoes.find((conectada) => conectada.provedor === item.provedor);
                                    const conectado = conexao?.status === "CONECTADO" || conexao?.status === "ERRO";
                                    const nome = item.provedor === "GOOGLE" ? "Google Agenda" : "Outlook";
                                    return <article key={item.provedor} className="rounded-2xl border border-app-baunilha-dourada/70 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div><h3 className="font-semibold">{nome}</h3><p className="mt-1 text-xs text-app-cinza">{conectado ? conexao.identificador_conta || ui("Conta conectada") : item.configurado ? ui("Disponível para conexão") : ui("Indisponível neste ambiente")}</p></div>
                                            <span className={`text-xs font-bold ${conectado ? "text-emerald-700" : "text-app-cinza"}`}>{ui(conectado ? conexao.status === "ERRO" ? "Requer atenção" : "Conectada" : "Desconectada")}</span>
                                        </div>
                                        {conexao?.ultima_sincronizacao_em ? <p className="mt-3 text-xs text-app-cinza">{ui("Última sincronização")}: {new Date(conexao.ultima_sincronizacao_em).toLocaleString("pt-BR")}</p> : null}
                                        {conexao?.erro_codigo ? <p className="mt-2 text-xs font-semibold text-red-700">{ui("A última sincronização falhou; os dados anteriores foram preservados.")}</p> : null}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {conectado ? <>
                                                <button type="button" disabled={Boolean(acaoAgenda)} onClick={() => sincronizarAgenda(item.provedor)} className="min-h-10 rounded-full bg-app-cafe-profundo px-4 text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-50">{ui(acaoAgenda === `sincronizar:${item.provedor}` ? "Sincronizando..." : "Sincronizar")}</button>
                                                <button type="button" disabled={Boolean(acaoAgenda)} onClick={() => setConfirmarAgenda({ tipo: "desconectar", provedor: item.provedor, nome })} className="min-h-10 rounded-full border border-red-300 px-4 text-[10px] font-bold uppercase tracking-wider text-red-700 disabled:opacity-50">{ui("Desconectar")}</button>
                                            </> : <button type="button" disabled={!item.configurado || Boolean(acaoAgenda)} onClick={() => setConfirmarAgenda({ tipo: "conectar", provedor: item.provedor, nome })} className="min-h-10 rounded-full bg-app-cafe-profundo px-4 text-[10px] font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-40">{ui(`Conectar ${nome}`)}</button>}
                                        </div>
                                    </article>;
                                })}
                            </div>
                        )}
                    </section>

                    <section className="grid gap-5 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/55 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{ui("Buscar restaurante ou prato")}
                            <input type="search" value={buscaPreferidos} onChange={(event) => setBuscaPreferidos(event.target.value)} className="h-11 min-w-0 w-full rounded-lg border border-app-baunilha-dourada bg-white px-3" />
                        </label>
                        <fieldset className="min-w-0">
                            <legend className="text-sm font-semibold">{ui("Restaurantes para priorizar")} ({form.restaurantes_favoritos_rotina.length})</legend>
                            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
                                {catalogo.filter((item) => correspondeBusca(item.nome)).map((item) => <label key={item.id_restaurante} className="flex items-center gap-3 rounded-lg border border-app-baunilha-dourada/60 p-3 text-sm hover:bg-app-chantilly">
                                    <input type="checkbox" checked={form.restaurantes_favoritos_rotina.includes(item.id_restaurante)} onChange={(event) => atualizar("restaurantes_favoritos_rotina", event.target.checked ? [...form.restaurantes_favoritos_rotina, item.id_restaurante] : form.restaurantes_favoritos_rotina.filter((id) => id !== item.id_restaurante))} className="h-4 w-4 shrink-0 accent-app-caramelo-torrado" />
                                    <span>{item.nome}{item.favorito_cliente ? <span className="block text-xs text-app-cinza">{ui("Já está nos seus favoritos")}</span> : null}</span>
                                </label>)}
                                {!catalogo.some((item) => correspondeBusca(item.nome)) ? <p className="text-sm text-app-cinza">{ui("Nenhum restaurante encontrado.")}</p> : null}
                            </div>
                        </fieldset>
                        <fieldset className="min-w-0">
                            <legend className="text-sm font-semibold">{ui("Pratos para repetir")} ({form.pratos_favoritos_rotina.length})</legend>
                            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
                                {catalogo.flatMap((item) => item.produtos.filter((produto) => correspondeBusca(`${item.nome} ${produto.nome}`)).map((produto) => <label key={produto.id_produto} className="flex items-center gap-3 rounded-lg border border-app-baunilha-dourada/60 p-3 text-sm hover:bg-app-chantilly">
                                    <input type="checkbox" checked={form.pratos_favoritos_rotina.includes(produto.id_produto)} onChange={(event) => atualizar("pratos_favoritos_rotina", event.target.checked ? [...form.pratos_favoritos_rotina, produto.id_produto] : form.pratos_favoritos_rotina.filter((id) => id !== produto.id_produto))} className="h-4 w-4 shrink-0 accent-app-caramelo-torrado" />
                                    <span>{produto.nome}<span className="block text-xs text-app-cinza">{item.nome}</span></span>
                                </label>))}
                                {!catalogo.some((item) => item.produtos.some((produto) => correspondeBusca(`${item.nome} ${produto.nome}`))) ? <p className="text-sm text-app-cinza">{ui("Nenhum prato publicado encontrado.")}</p> : null}
                            </div>
                        </fieldset>
                        <p className="text-sm text-app-cinza sm:col-span-2">{ui("Seleção opcional. Seus favoritos já ganham prioridade; outros restaurantes e pratos continuam elegíveis. Somente pratos publicados aparecem aqui.")}</p>
                        {textoParaLista(form.alergias).length > 0 ? <p className="text-sm text-app-cinza sm:col-span-2">{ui("Com alergias informadas, as sugestões serão apenas de mesa. Os pratos selecionados ficam salvos, mas não serão recomendados. Confirme ingredientes e contaminação cruzada com o restaurante antes de pedir.")}</p> : null}
                    </section>
                    </fieldset>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={() => formSalvo && JSON.stringify(form) !== JSON.stringify(formSalvo) ? setConfirmarDescartar(true) : router.push("/cliente/rotina")} className="inline-flex min-h-12 items-center justify-center rounded-full border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Cancelar")}</button>
                        <button type="submit" disabled={carregando || salvando || falhaCarga || Boolean(erroJanela)} className="min-h-12 rounded-full bg-app-caramelo-torrado px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:opacity-50">{ui(salvando ? "Salvando..." : "Salvar rotina")}</button>
                        <Link href="/cliente/rotina/planejamento" className="inline-flex min-h-12 items-center justify-center rounded-full bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">{ui("Ir ao planejamento")}</Link>
                    </div>
                </form>
            </section>
            <ConfirmationDialog open={confirmarDescartar} eyebrow={ui("Alterações não salvas")} title={ui("Descartar suas alterações?")} description={ui("Os dados salvos continuam preservados, mas as edições feitas nesta tela serão perdidas.")} confirmLabel={ui("Descartar alterações")} cancelLabel={ui("Continuar editando")} loading={false} onCancel={() => setConfirmarDescartar(false)} onConfirm={() => router.push("/cliente/rotina")} />
            <ConfirmationDialog open={Boolean(confirmarAgenda)} eyebrow={ui("Integração de agenda")} title={ui(confirmarAgenda?.tipo === "conectar" ? `Conectar ${confirmarAgenda?.nome}?` : `Desconectar ${confirmarAgenda?.nome}?`)} description={ui(confirmarAgenda?.tipo === "conectar" ? "Você será direcionado ao provedor para autorizar a leitura dos períodos ocupados." : "O acesso será removido e os períodos importados dessa agenda serão apagados. Reservas e pedidos já criados não serão alterados.")} confirmLabel={ui(confirmarAgenda?.tipo === "conectar" ? "Continuar para conexão" : "Desconectar agenda")} cancelLabel={ui("Voltar")} variant={confirmarAgenda?.tipo === "desconectar" ? "danger" : "default"} loading={Boolean(acaoAgenda)} onCancel={() => setConfirmarAgenda(null)} onConfirm={executarAcaoAgenda} />
        </main>
    );
}
