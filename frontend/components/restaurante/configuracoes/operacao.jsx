"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Store,
  Clock,
  Phone,
  Timer,
  Plus,
  Minus,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";

import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { atualizarNomeSessao } from "@/lib/session";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import { FormInput } from "@/components/ui/form-input";

const initialDays = [
  { id: "monday",    label: "Segunda-feira", helper: "Dia útil",       enabled: false, shifts: [{ open: "", close: "" }] },
  { id: "tuesday",   label: "Terça-feira",   helper: "Dia útil",       enabled: false, shifts: [{ open: "", close: "" }] },
  { id: "wednesday", label: "Quarta-feira",  helper: "Dia útil",       enabled: false, shifts: [{ open: "", close: "" }] },
  { id: "thursday",  label: "Quinta-feira",  helper: "Dia útil",       enabled: false, shifts: [{ open: "", close: "" }] },
  { id: "friday",    label: "Sexta-feira",   helper: "Dia útil",       enabled: false, shifts: [{ open: "", close: "" }] },
  { id: "saturday",  label: "Sábado",        helper: "Fim de semana",  enabled: false, shifts: [{ open: "", close: "" }] },
  { id: "sunday",    label: "Domingo",       helper: "Fim de semana",  enabled: false, shifts: [{ open: "", close: "" }] },
];

function turnoValido(shift) {
  return Boolean(shift.open && shift.close && shift.open < shift.close);
}

function diaTemTurnoValido(day) {
  return day.enabled && day.shifts.some(turnoValido);
}

function resumirHorarioFuncionamento(days) {
  const ativos = days
    .filter((d) => d.enabled && d.shifts.some((s) => s.open && s.close))
    .map((d) => {
      const turnos = d.shifts
        .filter((s) => s.open && s.close)
        .map((s) => `${s.open}-${s.close}`)
        .join(", ");
      return `${d.label}: ${turnos}`;
    });
  return ativos.length ? ativos.join(" | ") : "A definir";
}

function obterResumoCliente(days) {
  return days
    .filter(diaTemTurnoValido)
    .map((d) => {
      const turnos = d.shifts
        .filter(turnoValido)
        .map((s) => `${s.open} às ${s.close}`)
        .join(", ");
      return `${d.label}: ${turnos}`;
    });
}

export default function RestaurantOperationSettingsPage() {
  const { ui, horarioUI } = useInterface();
  const { sessao, sessaoCarregada } = useSessaoLocal();
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [antecedencia, setAntecedencia] = useState(60);
  const [days, setDays] = useState(initialDays);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [apiSuccess, setApiSuccess] = useState(false);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (!sessaoCarregada || sessao?.type !== "restaurant") return;
    apiRequest("/me")
      .then(({ perfil }) => {
        const cfg = perfil.configuracao_operacao ?? {};
        setStoreName(perfil.nome ?? cfg.storeName ?? "");
        setPhone(aplicarMascaraTelefone(cfg.phone ?? perfil.telefone ?? ""));
        setAntecedencia(Number(cfg.antecedenciaMinutosReserva ?? 60));
        setDays(cfg.days ?? initialDays);
      })
      .catch((error) => {
        setApiMessage(error instanceof Error ? error.message : "Não foi possível carregar as configurações.");
        setApiSuccess(false);
      });
  }, [sessao, sessaoCarregada]);

  function updateDay(dayId, updater) {
    setDays((current) => current.map((d) => (d.id === dayId ? updater(d) : d)));
  }

  function updateShift(dayId, index, field, value) {
    updateDay(dayId, (d) => ({
      ...d,
      shifts: d.shifts.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function copiarParaDiasUteis() {
    const origem = days.find((d) => d.shifts.some(turnoValido));
    if (!origem) {
      setApiMessage("Configure ao menos um turno válido antes de copiar para os dias úteis.");
      setApiSuccess(false);
      return;
    }
    const turnosValidos = origem.shifts.filter(turnoValido).map((s) => ({ ...s }));
    const uteis = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"]);
    setDays((current) =>
      current.map((d) =>
        uteis.has(d.id)
          ? { ...d, enabled: true, shifts: turnosValidos.map((s) => ({ ...s })) }
          : d
      )
    );
    setApiMessage("Horário copiado para os dias úteis.");
    setApiSuccess(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const resumo = obterResumoCliente(days);
    const novosErros = {};

    if (!storeName.trim()) novosErros.storeName = "O nome do estabelecimento é obrigatório.";
    if (!phone.trim()) novosErros.phone = "O telefone é obrigatório.";
    if (!resumo.length) novosErros.schedule = "Ative ao menos um dia e configure um turno válido para receber reservas.";

    const turnoInvalido = days.some((d) =>
      d.enabled && d.shifts.some((s) => (s.open || s.close) && !turnoValido(s))
    );
    if (turnoInvalido) novosErros.schedule = "Corrija os turnos com horário de fechamento vazio ou menor que a abertura.";

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setIsSubmitting(true);
    setApiMessage("");
    setApiSuccess(false);
    try {
      const resposta = await apiRequest("/me", {
        method: "PATCH",
        body: JSON.stringify({
          nome: storeName,
          telefone: phone,
          horario_funcionamento: resumirHorarioFuncionamento(days),
          configuracao_operacao: { storeName, phone, antecedenciaMinutosReserva: antecedencia, days },
        }),
      });
      atualizarNomeSessao(resposta.perfil.nome);
      setApiMessage(resposta.message ?? "Configurações salvas com sucesso.");
      setApiSuccess(true);
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Não foi possível salvar as configurações.");
      setApiSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!sessaoCarregada) return <TelaCarregandoSessao />;

  if (sessao?.type !== "restaurant") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5 text-app-cafe-profundo">
        <section className="w-full max-w-lg rounded-[8px] bg-app-creme-leve p-8 text-center shadow-sm ring-1 ring-app-baunilha-dourada">
          <Image src="/brand/appono-mark.svg" alt={ui("Appono")} width={88} height={88} className="mx-auto h-20 w-20" priority />
          <h1 className="mt-6 text-3xl font-semibold">{ui("Acesso restrito")}</h1>
          <p className="mt-3 text-sm leading-6 text-app-cinza">{ui("Esta área é destinada a contas de restaurante.")}</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-[8px] bg-app-dourado-mel px-6 text-sm font-bold text-white transition hover:bg-app-caramelo-torrado">{ui("Entrar")}</Link>
        </section>
      </main>
    );
  }

  const resumoCliente = obterResumoCliente(days);

  return (
    <div className="min-w-0 text-app-cafe-profundo">
      <section className="w-full min-w-0">
        <div className="border-b border-app-baunilha-dourada/60 pb-6">
          <h2 className="text-3xl font-medium leading-tight text-app-cafe-profundo">
            {ui("Disponibilidade")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[400px_1fr]" noValidate>
          {/* Painel lateral: informações gerais */}
          <aside className="h-fit rounded-2xl border border-app-baunilha-dourada/60 bg-app-creme-leve p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                  {ui("Regras gerais")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-app-cafe-profundo">
                  {ui("Atendimento")}
                </h3>
              </div>
              <Store className="h-8 w-8 text-app-baunilha-dourada" aria-hidden="true" />
            </div>

            <div className="mt-6 grid gap-5">
              <div className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  {ui("Nome exibido")} <span className="text-red-500">*</span>
                </span>
                <input
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    setErros((prev) => ({ ...prev, storeName: "" }));
                  }}
                  className={`h-12 rounded-xl border px-4 text-sm text-app-cafe-profundo outline-none transition focus:ring-2 focus:ring-app-dourado-mel/20 ${
                    erros.storeName
                      ? "border-red-400 bg-red-50 focus:border-red-400"
                      : "border-app-baunilha-dourada bg-app-creme-suave focus:border-app-caramelo-torrado"
                  }`}
                />
                {erros.storeName && (
                  <p className="text-xs font-semibold text-red-600">{erros.storeName}</p>
                )}
              </div>

              <div className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  {ui("Telefone")} <span className="text-red-500">*</span>
                </span>
                <div className={`flex h-12 items-center rounded-xl border px-3 transition focus-within:ring-2 focus-within:ring-app-dourado-mel/20 ${
                  erros.phone
                    ? "border-red-400 bg-red-50 focus-within:border-red-400"
                    : "border-app-baunilha-dourada bg-app-creme-suave focus-within:border-app-caramelo-torrado"
                }`}>
                  <Phone className="h-4 w-4 shrink-0 text-app-cinza mr-2" aria-hidden="true" />
                  <input
                    value={phone}
                    inputMode="tel"
                    onChange={(e) => {
                      setPhone(aplicarMascaraTelefone(e.target.value));
                      setErros((prev) => ({ ...prev, phone: "" }));
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none"
                  />
                </div>
                {erros.phone && (
                  <p className="text-xs font-semibold text-red-600">{erros.phone}</p>
                )}
              </div>

              <div className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  {ui("Antecedência mínima (min)")}
                </span>
                <div className="flex h-12 items-center rounded-xl border border-app-baunilha-dourada bg-app-creme-suave px-3 gap-2 focus-within:border-app-caramelo-torrado focus-within:ring-2 focus-within:ring-app-dourado-mel/20 transition">
                  <Timer className="h-4 w-4 shrink-0 text-app-cinza" aria-hidden="true" />
                  <input
                    type="number"
                    min={0}
                    max={720}
                    value={antecedencia}
                    onChange={(e) => setAntecedencia(Number(e.target.value) || 0)}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-app-cafe-profundo outline-none"
                  />
                </div>
                <span className="text-xs leading-5 text-app-cinza">
                  {ui("Tempo mínimo, em minutos, entre o momento atual e a reserva.")}
                </span>
              </div>
            </div>

            {/* Preview visível ao cliente */}
            <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-app-baunilha-dourada/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-caramelo-torrado">
                {ui("Visível ao cliente")}
              </p>
              {resumoCliente.length ? (
                <div className="mt-3 grid gap-1.5 text-sm text-app-mocha">
                  {resumoCliente.map((linha) => (
                    <p key={horarioUI ? horarioUI(linha) : linha}>{linha}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {ui("Nenhum horário válido configurado.")}
                </p>
              )}
            </div>

            {erros.schedule && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/60 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{erros.schedule}</span>
              </div>
            )}

            {apiMessage && (
              <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border ${
                apiSuccess
                  ? "bg-emerald-50 border-emerald-200/60 text-emerald-800"
                  : "bg-amber-50 border-amber-200/60 text-amber-800"
              }`}>
                {apiSuccess ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                )}
                <span>{ui(apiMessage)}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-8 text-xs font-bold uppercase tracking-wide text-white transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Salvando...</span></>
              ) : (
                <><Save className="h-4 w-4" /><span>{ui("Salvar operação")}</span></>
              )}
            </button>
          </aside>

          {/* Grade de agenda semanal */}
          <section className="rounded-2xl border border-app-baunilha-dourada/60 bg-app-creme-leve p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-app-cafe-profundo">
                  {ui("Agenda semanal")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-app-mocha">
                  {ui("Ative os dias e informe os turnos de funcionamento.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copiarParaDiasUteis}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-app-creme-suave hover:bg-app-areia-quente px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-app-mocha transition"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  {ui("Copiar para dias úteis")}
                </button>
                <span className="inline-flex items-center gap-2 rounded-xl bg-app-creme-suave px-4 py-2 text-xs font-bold uppercase text-app-mocha">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {ui("Aberto")}
                </span>
              </div>
            </div>

            <div className="mt-7 grid gap-4">
              {days.map((day) => (
                <article
                  key={day.id}
                  className="grid gap-5 rounded-xl border border-app-baunilha-dourada/45 bg-white p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center"
                >
                  <div>
                    <h4 className="font-semibold text-app-cafe-profundo">{ui(day.label)}</h4>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-app-cinza">
                      {ui(day.helper)}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {day.shifts.map((shift, index) => (
                      <div key={`${day.id}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                        <label className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza" aria-hidden="true" />
                          <input
                            type="time"
                            value={shift.open}
                            onChange={(e) => updateShift(day.id, index, "open", e.target.value)}
                            className="h-11 w-full rounded-xl border border-app-baunilha-dourada bg-app-creme-suave pl-10 pr-3 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20"
                          />
                        </label>
                        <span className="hidden items-center text-sm text-app-cinza sm:flex">
                          {ui("às")}
                        </span>
                        <input
                          type="time"
                          value={shift.close}
                          onChange={(e) => updateShift(day.id, index, "close", e.target.value)}
                          className="h-11 w-full rounded-xl border border-app-baunilha-dourada bg-app-creme-suave px-3 text-sm text-app-cafe-profundo outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20"
                        />
                        {(shift.open || shift.close) && !turnoValido(shift) ? (
                          <p className="text-xs font-semibold text-red-600 sm:col-span-3">
                            {ui("Informe abertura e fechamento, com fechamento depois da abertura.")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 sm:col-span-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(day.id, (d) => ({
                          ...d,
                          shifts: d.shifts.length > 1 ? d.shifts.slice(0, -1) : d.shifts,
                        }))
                      }
                      className="app-icon-button flex h-9 w-9 items-center justify-center rounded-full bg-app-creme-suave text-red-600 transition hover:bg-red-50"
                      aria-label={ui("Remover turno de {0}", [ui(day.label)])}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(day.id, (d) => ({
                          ...d,
                          shifts: [...d.shifts, { open: "", close: "" }],
                        }))
                      }
                      className="app-icon-button flex h-9 w-9 items-center justify-center rounded-full bg-app-creme-suave text-app-cafe-profundo transition hover:bg-app-areia-quente"
                      aria-label={ui("Adicionar turno em {0}", [ui(day.label)])}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {/* Toggle ativo/inativo */}
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(day.id, (d) => ({ ...d, enabled: !d.enabled }))
                      }
                      className={`relative h-8 w-14 rounded-full transition ${
                        day.enabled ? "bg-red-600" : "bg-app-cinza/35"
                      }`}
                      aria-label={ui("{0} {1}", [
                        ui(day.enabled ? "Desativar" : "Ativar"),
                        ui(day.label),
                      ])}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                          day.enabled ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </form>
      </section>
    </div>
  );
}
