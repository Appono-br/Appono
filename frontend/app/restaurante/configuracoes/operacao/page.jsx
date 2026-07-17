"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { atualizarNomeSessao } from "@/lib/session";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
const initialDays = [
    { id: "monday", label: "Segunda-feira", helper: "Dia util", enabled: false, shifts: [{ open: "", close: "" }] },
    { id: "tuesday", label: "Terca-feira", helper: "Dia util", enabled: false, shifts: [{ open: "", close: "" }] },
    { id: "wednesday", label: "Quarta-feira", helper: "Dia util", enabled: false, shifts: [{ open: "", close: "" }] },
    { id: "thursday", label: "Quinta-feira", helper: "Dia util", enabled: false, shifts: [{ open: "", close: "" }] },
    { id: "friday", label: "Sexta-feira", helper: "Dia util", enabled: false, shifts: [{ open: "", close: "" }] },
    { id: "saturday", label: "Sabado", helper: "Fim de semana", enabled: false, shifts: [{ open: "", close: "" }] },
    { id: "sunday", label: "Domingo", helper: "Fim de semana", enabled: false, shifts: [{ open: "", close: "" }] },
];
const initialForm = {
    storeName: "",
    storeId: "",
    phone: "",
    days: initialDays,
};
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        "arrow-right": "M5 12h14M13 6l6 6-6 6",
        clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        help: "M9.1 9a3 3 0 1 1 4.9 2.3c-1 .6-1.5 1.1-1.5 2.2M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        "map-pin": "M12 21s6-5.2 6-11a6 6 0 0 0-12 0c0 5.8 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
        minus: "M5 12h14",
        plus: "M12 5v14M5 12h14",
        store: "M4 10h16l-1-5H5l-1 5z M6 10v10h12V10M9 20v-6h6v6",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function TextField({ label, value, onChange, className = "", }) {
    return (<label className={`grid gap-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {label}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 border-b border-app-baunilha-dourada bg-app-creme-suave px-3 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"/>
    </label>);
}
export default function RestaurantOperationSettingsPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("Carregando configuracoes...");
    const [salvando, setSalvando] = useState(false);
    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        apiRequest("/me")
            .then(({ perfil }) => {
            const configuracao = perfil.configuracao_operacao ?? {};
            setForm({
                storeName: perfil.nome ?? configuracao.storeName ?? "",
                storeId: configuracao.storeId ?? String(perfil.id_restaurante ?? ""),
                phone: aplicarMascaraTelefone(configuracao.phone ?? perfil.telefone ?? ""),
                days: configuracao.days ?? initialDays,
            });
            setMessage("");
        })
            .catch((error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as configuracoes."));
    }, [sessao, sessaoCarregada]);
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    function updateDay(dayId, updater) {
        setForm((current) => ({
            ...current,
            days: current.days.map((day) => (day.id === dayId ? updater(day) : day)),
        }));
        setMessage("");
    }
    function updateShift(dayId, index, field, value) {
        updateDay(dayId, (day) => ({
            ...day,
            shifts: day.shifts.map((shift, shiftIndex) => shiftIndex === index ? { ...shift, [field]: value } : shift),
        }));
    }
    async function submitForm(event) {
        event.preventDefault();
        setSalvando(true);
        try {
            const resposta = await apiRequest("/me", {
                method: "PATCH",
                body: JSON.stringify({
                    nome: form.storeName,
                    telefone: form.phone,
                    configuracao_operacao: form,
                }),
            });
            atualizarNomeSessao(resposta.perfil.nome);
            setMessage(resposta.message ?? "Configuracoes salvas com sucesso.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar as configuracoes.");
        }
        finally {
            setSalvando(false);
        }
    }
    if (!sessaoCarregada) {
        return <TelaCarregandoSessao />;
    }
    if (sessao?.type !== "restaurant") {
        return (<main className="flex min-h-screen items-center justify-center bg-app-chantilly px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={88} height={88} className="mx-auto h-20 w-20" priority/>
          <h1 className="mt-6 text-3xl font-semibold">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">
            Esta area e destinada a contas de restaurante.
          </p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">
            Entrar
          </Link>
        </section>
      </main>);
    }
    return (<main className="flex min-h-screen flex-col bg-app-chantilly text-app-cafe-profundo">
      <header className="sticky top-0 z-30 border-b border-app-baunilha-dourada/50 bg-app-creme-leve/90 text-app-cafe-profundo shadow-sm backdrop-blur-md">
        <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-2">
          <div aria-label="Appono">
            <Image src="/brand/appono-mark.svg" alt="Appono" width={72} height={72} className="h-11 w-11" priority/>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Link href="/restaurante/configuracoes" className="transition hover:text-app-caramelo-torrado" aria-label="Voltar para configuracoes">
              <Icon type="arrow-left" className="h-5 w-5"/>
            </Link>
            <h1 className="text-lg font-bold uppercase tracking-[0.14em] sm:text-2xl">
              Configuracoes
            </h1>
          </div>
          <Icon type="help" className="hidden h-5 w-5 justify-self-end text-app-mocha sm:block"/>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="border-t border-app-baunilha-dourada/60 pt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
            Painel de administracao
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Operacao & Logistica
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-app-cinza sm:text-base">
            Gerencie a identidade digital da unidade, defina os horarios de
            servico e mantenha as informacoes de contato atualizadas.
          </p>
        </div>

        <form onSubmit={submitForm} className="mt-10 grid gap-8 xl:grid-cols-[0.72fr_1fr]">
          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-medium text-app-cafe-profundo">
                  Identidade da Unidade
                </h3>
                <Icon type="store" className="h-12 w-12 text-app-baunilha-dourada"/>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <TextField label="Nome do restaurante" value={form.storeName} onChange={(value) => updateField("storeName", value)} className="sm:col-span-2"/>
                <TextField label="ID da loja" value={form.storeId} onChange={(value) => updateField("storeId", value)}/>
                <TextField label="Telefone de contato" value={form.phone} onChange={(value) => updateField("phone", aplicarMascaraTelefone(value))}/>
              </div>
              <Link href="/restaurante/configuracoes/endereco" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-app-caramelo-torrado transition hover:text-app-cafe-profundo">
                <Icon type="map-pin" className="h-4 w-4"/>
                Atualizar localizacao no mapa
              </Link>
            </section>

            <section className="overflow-hidden rounded-[8px] bg-app-creme-suave shadow-sm ring-1 ring-app-baunilha-dourada/60">
              <div className="relative flex min-h-[260px] items-center justify-center bg-app-baunilha-dourada/45">
                <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(30deg,rgba(138,85,42,.22)_1px,transparent_1px),linear-gradient(120deg,rgba(47,27,16,.16)_1px,transparent_1px)] [background-size:42px_42px]"/>
                <span className="relative rounded-[8px] bg-app-chantilly px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-app-mocha">
                  Mapa sem endereco definido
                </span>
              </div>
            </section>
          </aside>

          <section className="rounded-[8px] bg-app-baunilha-dourada p-5 shadow-sm ring-1 ring-app-caramelo-torrado/15 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-medium text-app-cafe-profundo">
                  Horarios de Funcionamento
                </h3>
                <p className="mt-2 text-sm leading-6 text-app-mocha">
                  Configure os turnos por dia da semana.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase text-app-mocha">
                <span className="h-2 w-2 rounded-full bg-emerald-500"/>
                Aberto
              </span>
            </div>

            <div className="mt-7 grid gap-4">
              {form.days.map((day) => (<article key={day.id} className="grid gap-5 rounded-[8px] border-l-4 border-app-caramelo-torrado bg-app-chantilly p-5 sm:grid-cols-[0.34fr_1fr_auto] sm:items-center">
                  <div>
                    <h4 className="text-lg font-medium text-app-cafe-profundo">
                      {day.label}
                    </h4>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-app-cinza">
                      {day.helper}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {day.shifts.map((shift, index) => (<div key={`${day.id}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                        <label className="relative">
                          <Icon type="clock" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza"/>
                          <input type="time" value={shift.open} onChange={(event) => updateShift(day.id, index, "open", event.target.value)} className="h-11 w-full rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave pl-10 pr-3 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"/>
                        </label>
                        <span className="hidden items-center text-sm text-app-cinza sm:flex">
                          as
                        </span>
                        <input type="time" value={shift.close} onChange={(event) => updateShift(day.id, index, "close", event.target.value)} className="h-11 w-full rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-3 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado"/>
                      </div>))}
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <button type="button" onClick={() => updateDay(day.id, (current) => ({
                ...current,
                shifts: current.shifts.length > 1
                    ? current.shifts.slice(0, -1)
                    : current.shifts,
            }))} className="flex h-9 w-9 items-center justify-center rounded-full bg-app-creme-suave text-app-vermelho-erro transition hover:bg-app-areia-quente" aria-label={`Remover turno de ${day.label}`}>
                      <Icon type="minus" className="h-4 w-4"/>
                    </button>
                    <button type="button" onClick={() => updateDay(day.id, (current) => ({
                ...current,
                shifts: [...current.shifts, { open: "", close: "" }],
            }))} className="flex h-9 w-9 items-center justify-center rounded-full bg-app-creme-suave text-app-cafe-profundo transition hover:bg-app-areia-quente" aria-label={`Adicionar turno em ${day.label}`}>
                      <Icon type="plus" className="h-4 w-4"/>
                    </button>
                    <button type="button" onClick={() => updateDay(day.id, (current) => ({
                ...current,
                enabled: !current.enabled,
            }))} className={`relative h-8 w-14 rounded-full transition ${day.enabled ? "bg-app-mocha" : "bg-app-cinza/35"}`} aria-label={`${day.enabled ? "Desativar" : "Ativar"} ${day.label}`}>
                      <span className={`absolute top-1 h-6 w-6 rounded-full bg-app-chantilly transition ${day.enabled ? "left-7" : "left-1"}`}/>
                    </button>
                  </div>
                </article>))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-sm text-app-mocha">
                Alteracoes ficam locais ate a integracao com o backend.
              </p>
              <button type="submit" disabled={salvando} className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </div>

            {message ? (<p className="mt-4 text-sm font-semibold text-app-mocha">{message}</p>) : null}
          </section>
        </form>

        <section className="mt-10 rounded-[8px] bg-app-creme-suave p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:grid sm:grid-cols-[1fr_0.42fr] sm:gap-8 sm:p-8">
          <div>
            <h3 className="text-xl font-medium text-app-cafe-profundo">
              Informacoes Complementares
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-app-mocha">
              Mudancas nos horarios serao refletidas no aplicativo do cliente
              quando a sincronizacao estiver disponivel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#" className="rounded-[8px] bg-app-baunilha-dourada px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-app-mocha transition hover:bg-app-areia-quente">
                Politica de reservas
              </Link>
              <Link href="#" className="rounded-[8px] bg-app-baunilha-dourada px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-app-mocha transition hover:bg-app-areia-quente">
                Termos de uso
              </Link>
            </div>
          </div>
          <aside className="mt-6 rounded-[8px] bg-app-chantilly p-6 ring-1 ring-app-baunilha-dourada/45 sm:mt-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
              Canal de ajuda
            </p>
            <h4 className="mt-3 text-lg font-medium text-app-cafe-profundo">
              Duvidas com a integracao?
            </h4>
            <Link href="#" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-app-cafe-profundo transition hover:text-app-caramelo-torrado">
              Falar com suporte
              <Icon type="arrow-right" className="h-4 w-4"/>
            </Link>
          </aside>
        </section>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">
              Politica de Privacidade
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Termos de Uso
            </Link>
            <Link href="#" className="transition hover:text-app-chantilly">
              Contato
            </Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>);
}
