"use client";

import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { validarJanela } from "@/lib/routine-view.mjs";
import Image from "next/image";
import Link from "next/link";
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
    latitude: "",
    longitude: "",
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
};

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
    const [form, setForm] = useState(estadoInicial);
    const [mensagem, setMensagem] = useState("Carregando rotina...");
    const [salvando, setSalvando] = useState(false);
    const [localizando, setLocalizando] = useState(false);
    const [catalogo, setCatalogo] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [falhaCarga, setFalhaCarga] = useState(false);
    const [versaoPerfil, setVersaoPerfil] = useState(null);
    const [conflito, setConflito] = useState(false);
    const [recarregar, setRecarregar] = useState(0);
    const [rascunho, setRascunho] = useState(null);
    const [buscaPreferidos, setBuscaPreferidos] = useState("");
    const erroJanela = validarJanela(form);
    const [inicioHora, inicioMinuto] = form.horario_inicio.split(":").map(Number);
    const [fimHora, fimMinuto] = form.horario_fim.split(":").map(Number);
    const duracaoJanela = (fimHora * 60 + fimMinuto) - (inicioHora * 60 + inicioMinuto);
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
                if (perfil) {
                    setForm({
                        ...estadoInicial,
                        nome: perfil.nome ?? estadoInicial.nome,
                        endereco_base: perfil.endereco_base ?? "",
                        latitude: perfil.latitude ?? "",
                        longitude: perfil.longitude ?? "",
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
                    });
                }
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

    function usarLocalizacao() {
        if (!("geolocation" in navigator)) {
            setMensagem("Seu navegador não oferece suporte à localização automática.");
            return;
        }
        setLocalizando(true);
        navigator.geolocation.getCurrentPosition((posicao) => {
            setForm((atual) => ({
                ...atual,
                latitude: Number(posicao.coords.latitude.toFixed(7)),
                longitude: Number(posicao.coords.longitude.toFixed(7)),
            }));
            setMensagem("Localização preenchida. Você ainda pode informar um endereço de referência.");
            setLocalizando(false);
        }, () => {
            setMensagem("Não foi possível acessar a localização do navegador.");
            setLocalizando(false);
        }, { enableHighAccuracy: true, timeout: 8000 });
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
            const perfilSalvo = await apiRequest("/rotina/perfil", {
                method: "POST",
                body: JSON.stringify({
                    versao_perfil: versaoPerfil,
                    nome: form.nome,
                    endereco_base: form.endereco_base,
                    latitude: campoNumero(form.latitude),
                    longitude: campoNumero(form.longitude),
                    dias_semana: form.dias_semana,
                    horario_inicio: form.horario_inicio,
                    horario_fim: form.horario_fim,
                    tempo_maximo_minutos: campoNumero(form.tempo_maximo_minutos),
                    orcamento_diario: campoNumero(form.orcamento_diario),
                    orcamento_semanal: campoNumero(form.orcamento_semanal),
                    raio_km: campoNumero(form.raio_km),
                    preferencias: textoParaLista(form.preferencias),
                    restricoes: textoParaLista(form.restricoes),
                    alergias: textoParaLista(form.alergias),
                    restaurantes_favoritos_rotina: form.restaurantes_favoritos_rotina,
                    pratos_favoritos_rotina: form.pratos_favoritos_rotina,
                }),
            });
            setVersaoPerfil(Number(perfilSalvo.versao));
            setRascunho(null);
            setMensagem("Rotina salva. Agora você pode gerar o planejamento semanal.");
        } catch (error) {
            if (error.status === 409) setConflito(true);
            setMensagem(error instanceof Error ? error.message : "Não foi possível salvar a rotina.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className="min-h-screen bg-white px-5 py-8 text-app-cafe-profundo">
            <section className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/cliente/rotina" className="inline-flex items-center gap-2 text-sm font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"><Icon type="arrow" className="h-4 w-4" />{ui("Voltar")}</Link>
                    <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={72} height={72} className="h-12 w-12" />
                </div>

                <header className="mt-8 rounded-[18px] bg-app-cafe-profundo p-6 text-app-creme-leve shadow-sm ring-1 ring-app-baunilha-dourada/40 sm:p-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-baunilha-dourada">{ui("Configuração")}</p>
                    <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{ui("Monte sua rotina de almoço.")}</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-app-creme-suave">{ui("Seus horários, orçamento e preferências em um só lugar.")}</p>
                </header>

                {mensagem ? <p role="status" className="mt-6 rounded-[12px] border border-app-baunilha-dourada bg-white p-4 text-sm font-semibold text-app-caramelo-torrado">{ui(mensagem)}</p> : null}
                {conflito || falhaCarga ? <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <p>{ui("Sua edição permanece nesta tela. Recarregue para comparar com os dados salvos.")}</p>
                    <button type="button" disabled={carregando} className="rounded-lg border px-4 py-2 font-semibold" onClick={() => {
                        setRascunho(form); setCarregando(true); setRecarregar((valor) => valor + 1);
                    }}>{ui("Recarregar dados salvos")}</button>
                </div> : null}
                {rascunho && !conflito && !carregando && !falhaCarga ? <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <p>{ui("Dados atualizados. Seu rascunho anterior foi preservado para revisão.")}</p>
                    <button type="button" className="rounded-lg border px-4 py-2 font-semibold" onClick={() => {
                        setForm(rascunho); setRascunho(null); setMensagem("Rascunho restaurado. Revise antes de salvar sobre a versão atual.");
                    }}>{ui("Restaurar meu rascunho")}</button>
                </div> : null}

                <form onSubmit={salvar} className="mt-6 grid gap-5">
                    <fieldset disabled={carregando || salvando || falhaCarga} className="grid min-w-0 gap-5">
                    <section className="rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/65">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Base")}</p>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Nome da rotina")}
                                <input value={form.nome} onChange={(event) => atualizar("nome", event.target.value)} className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Endereço base")}
                                <input value={form.endereco_base} onChange={(event) => atualizar("endereco_base", event.target.value)} placeholder={ui("Ex: escritório, faculdade, casa...")} className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Latitude")}
                                <input value={form.latitude} onChange={(event) => atualizar("latitude", event.target.value)} inputMode="decimal" className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Longitude")}
                                <input value={form.longitude} onChange={(event) => atualizar("longitude", event.target.value)} inputMode="decimal" className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                        </div>
                        <button type="button" onClick={usarLocalizacao} disabled={localizando} className="mt-5 inline-flex h-11 items-center gap-2 rounded-[8px] border border-app-baunilha-dourada px-5 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly disabled:opacity-50">
                            <Icon type="pin" className="h-4 w-4" />{ui(localizando ? "Localizando..." : "Usar localização atual")}
                        </button>
                    </section>

                    <section className="rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/65">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">{ui("Janela de almoço")}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {diasSemana.map((dia) => (
                                <button key={dia.id} type="button" aria-pressed={form.dias_semana.includes(dia.id)} onClick={() => alternarDia(dia.id)} className={`h-10 rounded-[8px] px-4 text-xs font-bold uppercase tracking-[0.1em] transition ${form.dias_semana.includes(dia.id) ? "bg-app-cafe-profundo text-app-creme-leve" : "border border-app-baunilha-dourada text-app-mocha hover:bg-app-chantilly"}`}>
                                    {ui(dia.label)}
                                </button>
                            ))}
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Início")}
                                <input type="time" value={form.horario_inicio} onChange={(event) => atualizar("horario_inicio", event.target.value)} className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Fim")}
                                <input type="time" value={form.horario_fim} onChange={(event) => atualizar("horario_fim", event.target.value)} className="h-12 rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Limite da saída (min)")}
                                <input type="number" min={30} max={Math.min(240, Math.max(30, duracaoJanela || 30))} step={1} required aria-describedby="resumo-janela" value={form.tempo_maximo_minutos} onChange={(event) => atualizar("tempo_maximo_minutos", event.target.value)} inputMode="numeric" className="h-12 min-w-0 w-full rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase tracking-[0.14em] text-app-mocha">{ui("Distância máxima (km)")}
                                <input type="number" min={1} max={100} step="0.1" required value={form.raio_km} onChange={(event) => atualizar("raio_km", event.target.value)} inputMode="decimal" className="h-12 min-w-0 w-full rounded-[10px] border border-app-baunilha-dourada bg-white px-4 text-sm font-semibold normal-case tracking-normal text-app-cafe-profundo outline-none focus:border-app-caramelo-torrado" />
                            </label>
                        </div>
                        <p id="resumo-janela" className="mt-4 text-sm leading-6 text-app-cinza" aria-live="polite">{erroJanela || ui(`Janela de ${duracaoJanela} min: sua saída pode durar até ${form.tempo_maximo_minutos} min, incluindo ida, refeição e volta. A distância também precisa caber nesse tempo.`)}</p>
                    </section>

                    <section className="rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/65">
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

                    <section className="grid gap-5 rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-app-baunilha-dourada/65 sm:grid-cols-2">
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
                        <Link href="/cliente/rotina" className="inline-flex h-12 items-center justify-center rounded-[8px] border border-app-baunilha-dourada px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-mocha transition hover:bg-app-chantilly">{ui("Cancelar")}</Link>
                        <button type="submit" disabled={carregando || salvando || falhaCarga || Boolean(erroJanela)} className="h-12 rounded-[8px] bg-app-caramelo-torrado px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-app-cafe-profundo disabled:opacity-50">{ui(salvando ? "Salvando..." : "Salvar rotina")}</button>
                        <Link href="/cliente/rotina/planejamento" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-app-cafe-profundo px-6 text-xs font-bold uppercase tracking-[0.12em] text-app-creme-leve transition hover:bg-app-caramelo-torrado">{ui("Ir ao planejamento")}</Link>
                    </div>
                </form>
            </section>
        </main>
    );
}
