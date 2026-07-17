"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
const initialRules = [
    {
        key: "newReservation",
        title: "Novas reservas",
        description: "Avise a equipe quando uma reserva for criada pelo cliente.",
        required: true,
        channels: { email: false, whatsapp: false, push: true, sms: false },
    },
    {
        key: "reservationChange",
        title: "Alteracoes e cancelamentos",
        description: "Notifique mudancas que podem afetar salao, fila ou cozinha.",
        required: true,
        channels: { email: false, whatsapp: false, push: true, sms: false },
    },
    {
        key: "orderAhead",
        title: "Pedidos antecipados",
        description: "Receba alertas quando houver itens para preparo antes da chegada.",
        channels: { email: false, whatsapp: false, push: false, sms: false },
    },
    {
        key: "lowStock",
        title: "Alertas de disponibilidade",
        description: "Sinalize itens do cardapio marcados como indisponiveis ou em falta.",
        channels: { email: false, whatsapp: false, push: false, sms: false },
    },
    {
        key: "billing",
        title: "Financeiro e repasses",
        description: "Envie comunicados sobre repasses, falhas de pagamento e taxas.",
        channels: { email: false, whatsapp: false, push: false, sms: false },
    },
];
const initialForm = {
    contactEmail: "",
    contactPhone: "",
    quietStart: "",
    quietEnd: "",
    rules: initialRules,
};
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
        check: "m5 12 4 4L19 6",
        help: "M9.1 9a3 3 0 1 1 4.9 2.3c-1 .6-1.5 1.1-1.5 2.2M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        mail: "M4 6h16v12H4V6z M4 8l8 6 8-6",
        message: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-4-.9L3 20l1.1-4.6a8.2 8.2 0 1 1 16.9-3.9z",
        phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.9 9.7a16 16 0 0 0 5.4 5.4l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function Toggle({ checked, onChange, label, }) {
    return (<button type="button" onClick={onChange} className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-app-mocha" : "bg-app-cinza/35"}`} aria-label={label}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-app-chantilly transition ${checked ? "left-7" : "left-1"}`}/>
    </button>);
}
export default function RestaurantNotificationSettingsPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("Carregando preferencias...");
    const [salvando, setSalvando] = useState(false);
    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        apiRequest("/me")
            .then(({ perfil }) => {
            const preferencias = perfil.preferencias_notificacao ?? {};
            setForm({
                contactEmail: preferencias.contactEmail ?? perfil.email ?? "",
                contactPhone: aplicarMascaraTelefone(preferencias.contactPhone ?? perfil.telefone ?? ""),
                quietStart: preferencias.quietStart ?? "",
                quietEnd: preferencias.quietEnd ?? "",
                rules: preferencias.rules ?? initialRules,
            });
            setMessage("");
        })
            .catch((error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as preferencias."));
    }, [sessao, sessaoCarregada]);
    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    function toggleChannel(ruleKey, channel) {
        setForm((current) => ({
            ...current,
            rules: current.rules.map((rule) => rule.key === ruleKey
                ? {
                    ...rule,
                    channels: { ...rule.channels, [channel]: !rule.channels[channel] },
                }
                : rule),
        }));
        setMessage("");
    }
    async function submitForm(event) {
        event.preventDefault();
        setSalvando(true);
        try {
            const resposta = await apiRequest("/me", {
                method: "PATCH",
                body: JSON.stringify({
                    email: form.contactEmail,
                    telefone: form.contactPhone,
                    preferencias_notificacao: form,
                }),
            });
            setMessage(resposta.message ?? "Preferencias salvas com sucesso.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar as preferencias.");
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
            Comunicacao operacional
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Preferencias de Notificacao
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-app-cinza sm:text-base">
            Defina quais eventos exigem aviso imediato e quais canais a equipe
            deve usar durante o expediente.
          </p>
        </div>

        <form onSubmit={submitForm} className="mt-10 grid gap-8 lg:grid-cols-[0.72fr_1fr]">
          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                  <Icon type="bell" className="h-6 w-6"/>
                </span>
                <div>
                  <h3 className="text-2xl font-medium text-app-cafe-profundo">
                    Canais principais
                  </h3>
                  <p className="mt-1 text-sm text-app-cinza">
                    Contatos usados para comunicados administrativos.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Email operacional
                  </span>
                  <span className="relative">
                    <Icon type="mail" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza"/>
                    <input type="email" value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} className="h-12 w-full rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-4 pl-10 text-sm outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20"/>
                  </span>
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Telefone da operacao
                  </span>
                  <span className="relative">
                    <Icon type="phone" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-cinza"/>
                    <input value={form.contactPhone} onChange={(event) => updateField("contactPhone", aplicarMascaraTelefone(event.target.value))} className="h-12 w-full rounded-[8px] border border-app-baunilha-dourada bg-app-chantilly px-4 pl-10 text-sm outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20"/>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
              <h3 className="text-2xl font-medium text-app-cafe-profundo">
                Janela silenciosa
              </h3>
              <p className="mt-2 text-sm leading-6 text-app-cinza">
                Alertas criticos continuam ativos; comunicados de rotina ficam
                retidos nesse intervalo.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Inicio
                  </span>
                  <input type="time" value={form.quietStart} onChange={(event) => updateField("quietStart", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado"/>
                </label>
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Fim
                  </span>
                  <input type="time" value={form.quietEnd} onChange={(event) => updateField("quietEnd", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado"/>
                </label>
              </div>
            </section>
          </aside>

          <section className="rounded-[8px] bg-app-baunilha-dourada p-5 shadow-sm ring-1 ring-app-caramelo-torrado/15 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-medium text-app-cafe-profundo">
                  Eventos monitorados
                </h3>
                <p className="mt-2 text-sm leading-6 text-app-mocha">
                  Mantenha reservas e repasses com canais confiaveis para cada
                  tipo de aviso.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-[8px] bg-app-chantilly px-4 py-2 text-xs font-bold uppercase text-app-mocha">
                <Icon type="check" className="h-4 w-4 text-app-caramelo-torrado"/>
                Rascunho local
              </span>
            </div>

            <div className="mt-7 grid gap-4">
              {form.rules.map((rule) => (<article key={rule.key} className="rounded-[8px] bg-app-chantilly p-5 ring-1 ring-app-baunilha-dourada/50">
                  <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-medium text-app-cafe-profundo">
                          {rule.title}
                        </h4>
                        {rule.required ? (<span className="rounded-full bg-app-creme-suave px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-app-caramelo-torrado">
                            Critico
                          </span>) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-app-cinza">
                        {rule.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[360px]">
                      {[
                ["email", "Email"],
                ["whatsapp", "WhatsApp"],
                ["push", "App"],
                ["sms", "SMS"],
            ].map(([channel, label]) => (<div key={channel} className="flex items-center justify-between gap-3 rounded-[8px] bg-app-creme-suave px-3 py-2">
                          <span className="text-xs font-bold uppercase text-app-mocha">
                            {label}
                          </span>
                          <Toggle checked={rule.channels[channel]} onChange={() => toggleChannel(rule.key, channel)} label={`${rule.channels[channel] ? "Desativar" : "Ativar"} ${label} em ${rule.title}`}/>
                        </div>))}
                    </div>
                  </div>
                </article>))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Link href="/restaurante/configuracoes" className="flex h-12 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve">
                Cancelar
              </Link>
              <button type="submit" disabled={salvando} className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar preferencias"}
              </button>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-app-mocha">{message}</p> : null}
          </section>
        </form>
      </section>

      <footer className="border-t border-app-cacau-intenso/20 bg-app-cafe-profundo px-5 py-7 text-app-creme-leve">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-between">
          <Image src="/brand/appono-mark.svg" alt="Appono" width={80} height={80} className="h-14 w-14 brightness-0 invert"/>
          <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase text-app-baunilha-dourada">
            <Link href="#" className="transition hover:text-app-chantilly">Politica de Privacidade</Link>
            <Link href="#" className="transition hover:text-app-chantilly">Termos de Uso</Link>
            <Link href="#" className="transition hover:text-app-chantilly">Contato</Link>
          </nav>
          <p className="text-xs font-semibold text-app-creme-suave">
            &copy; 2026 APPONO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>);
}
