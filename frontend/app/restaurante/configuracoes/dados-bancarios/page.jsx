"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ItemHeaderNotificacoes } from "@/components/notificacoes/contador-notificacoes";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraCnpj } from "@/lib/validacoes/cnpj";
import { somenteNumeros } from "@/lib/validacoes/comum";
import { aplicarMascaraAgencia, aplicarMascaraCodigoBanco, } from "@/lib/validacoes/dados-bancarios";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
const initialForm = {
    legalName: "",
    document: "",
    bankCode: "",
    agency: "",
    account: "",
    accountDigit: "",
    accountType: "checking",
    pixKeyType: "document",
    pixKey: "",
    payoutCadence: "weekly",
};
const initialBankSummary = {
    status: "nao_configurado",
    provider: "integracao_externa_pendente",
    updatedAt: "",
};
function Icon({ type, className = "h-5 w-5", }) {
    const paths = {
        "arrow-left": "M19 12H5M12 19l-7-7 7-7",
        bank: "M3 10h18L12 4 3 10z M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18",
        card: "M4 7h16v10H4V7z M4 10h16M8 14h3",
        help: "M9.1 9a3 3 0 1 1 4.9 2.3c-1 .6-1.5 1.1-1.5 2.2M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
        lock: "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v11H5V10z",
        pix: "M12 3 21 12 12 21 3 12 12 3z M8 12l4-4 4 4-4 4-4-4z",
        shield: "M12 21s7-3.2 7-9.8V5l-7-3-7 3v6.2C5 17.8 12 21 12 21z",
    };
    return (<svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d={paths[type]} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"/>
    </svg>);
}
function Field({ label, value, onChange, className = "", inputMode, maxLength, disabled = false, }) {
    return (<label className={`grid gap-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
        {label}
      </span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} maxLength={maxLength} disabled={disabled} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado focus:ring-2 focus:ring-app-dourado-mel/20 disabled:cursor-not-allowed disabled:opacity-65"/>
    </label>);
}
export default function RestaurantBankSettingsPage() {
    const { sessao, sessaoCarregada } = useSessaoLocal();
    const [form, setForm] = useState(initialForm);
    const [bankSummary, setBankSummary] = useState(initialBankSummary);
    const [message, setMessage] = useState("Carregando dados bancarios...");
    const [salvando, setSalvando] = useState(false);
    useEffect(() => {
        if (!sessaoCarregada || sessao?.type !== "restaurant") {
            return;
        }
        async function carregarDadosBancarios() {
            try {
                const resposta = await apiRequest("/me");
                const restaurante = resposta.perfil;
                const dadosBancarios = restaurante.dados_bancarios_restaurante?.[0];
                setForm((atual) => ({
                    ...atual,
                    legalName: restaurante.razao_social ?? restaurante.nome ?? "",
                    document: aplicarMascaraCnpj(restaurante.cnpj ?? ""),
                }));
                setBankSummary({
                    status: dadosBancarios?.status_cadastro ?? "nao_configurado",
                    provider: dadosBancarios?.provedor_pagamento ?? "integracao_externa_pendente",
                    updatedAt: dadosBancarios?.updated_at ?? "",
                });
                setMessage("");
            }
            catch (error) {
                setMessage(error instanceof Error
                    ? error.message
                    : "Nao foi possivel carregar os dados bancarios.");
            }
        }
        carregarDadosBancarios();
    }, [sessao, sessaoCarregada]);
    function atualizarCampo(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }
    async function enviarFormulario(event) {
        event.preventDefault();
        if (!form.bankCode || !form.agency || !form.account) {
            setMessage("Para alterar os dados bancarios, informe banco, agencia e conta completos.");
            return;
        }
        if (form.bankCode && somenteNumeros(form.bankCode).length !== 3) {
            setMessage("O codigo do banco deve possuir 3 digitos.");
            return;
        }
        if (form.agency && somenteNumeros(form.agency).length > 5) {
            setMessage("A agencia deve possuir no maximo 5 digitos.");
            return;
        }
        setSalvando(true);
        try {
            const contaCorrente = form.accountDigit
                ? `${form.account}-${form.accountDigit}`
                : form.account;
            const resposta = await apiRequest("/me/dados-bancarios", {
                method: "PATCH",
                body: JSON.stringify({
                    bankCode: form.bankCode,
                    agency: form.agency,
                    checkingAccount: contaCorrente,
                    pixKey: form.pixKey,
                }),
            });
            const dadosBancarios = resposta.perfil?.dados_bancarios_restaurante?.[0];
            setBankSummary({
                status: dadosBancarios?.status_cadastro ?? "pendente_validacao",
                provider: dadosBancarios?.provedor_pagamento ?? "integracao_financeira_externa",
                updatedAt: dadosBancarios?.updated_at ?? "",
            });
            setForm((atual) => ({
                ...atual,
                bankCode: "",
                agency: "",
                account: "",
                accountDigit: "",
                pixKey: "",
            }));
            setMessage(resposta.message ?? "Dados bancarios salvos com sucesso.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar os dados.");
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
          <div className="flex items-center justify-self-end gap-3 text-app-cafe-profundo">
            <ItemHeaderNotificacoes href="/restaurante/notificacoes" />
            <Icon type="help" className="hidden h-5 w-5 justify-self-end text-app-mocha sm:block"/>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:py-14">
        <div className="border-t border-app-baunilha-dourada/60 pt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-caramelo-torrado">
            Repasses e conciliacao
          </p>
          <h2 className="mt-3 text-4xl font-medium leading-tight text-app-cafe-profundo sm:text-5xl">
            Dados Bancarios
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-app-cinza sm:text-base">
            Cadastre a conta juridica que recebera os repasses. A validacao
            definitiva fica pendente ate a integracao financeira estar ativa.
          </p>
        </div>

        <form onSubmit={enviarFormulario} className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.5fr]">
          <section className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-app-baunilha-dourada/60 pb-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-medium text-app-cafe-profundo">
                  Conta de repasse
                </h3>
                <p className="mt-2 text-sm leading-6 text-app-cinza">
                  Os dados devem pertencer ao mesmo CNPJ do restaurante.
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                <Icon type="bank" className="h-6 w-6"/>
              </span>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Razao social titular" value={form.legalName} onChange={(value) => atualizarCampo("legalName", value)} className="sm:col-span-2" disabled/>
              <Field label="CNPJ titular" value={form.document} onChange={(value) => atualizarCampo("document", aplicarMascaraCnpj(value))} inputMode="numeric" maxLength={18} disabled/>
              <div className="rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave p-4 text-sm leading-6 text-app-mocha sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  Dados cadastrados
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <span>Status: <strong>{bankSummary.status === "pendente_validacao"
                ? "Pendente de validacao"
                : bankSummary.status === "validado"
                    ? "Validado"
                    : "Nao configurado"}</strong></span>
                  <span>Provedor: <strong>{bankSummary.provider}</strong></span>
                  <span>Atualizacao: <strong>{bankSummary.updatedAt
                ? new Date(bankSummary.updatedAt).toLocaleDateString("pt-BR")
                : "Sem registro"}</strong></span>
                </div>
                <p className="mt-3 text-xs text-app-cinza">
                  Por seguranca, a Appono nao armazena banco, agencia, conta ou
                  Pix. No MVP, o envio abaixo apenas muda o status para validacao
                  externa pendente.
                </p>
              </div>
              <Field label="Codigo do banco" value={form.bankCode} onChange={(value) => atualizarCampo("bankCode", aplicarMascaraCodigoBanco(value))} inputMode="numeric" maxLength={3}/>
              <Field label="Agencia" value={form.agency} onChange={(value) => atualizarCampo("agency", aplicarMascaraAgencia(value))} inputMode="numeric" maxLength={5}/>
              <div className="grid gap-5 sm:grid-cols-[1fr_0.38fr]">
                <Field label="Conta" value={form.account} onChange={(value) => atualizarCampo("account", somenteNumeros(value).slice(0, 20))} inputMode="numeric" maxLength={20}/>
                <Field label="Digito" value={form.accountDigit} onChange={(value) => atualizarCampo("accountDigit", value.replace(/[^\dXx]/g, "").slice(0, 1).toUpperCase())} maxLength={1}/>
              </div>
              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  Tipo de conta
                </span>
                <select value={form.accountType} onChange={(event) => atualizarCampo("accountType", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado">
                  <option value="checking">Conta corrente</option>
                  <option value="savings">Conta poupanca</option>
                </select>
              </label>
            </div>

            <section className="mt-8 border-t border-app-baunilha-dourada/60 pt-8">
              <h3 className="flex items-center gap-3 text-2xl font-medium text-app-cafe-profundo">
                <Icon type="pix" className="h-6 w-6 text-app-caramelo-torrado"/>
                Chave Pix de contingencia
              </h3>
              <div className="mt-6 grid gap-5 sm:grid-cols-[0.46fr_1fr]">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                    Tipo da chave
                  </span>
                  <select value={form.pixKeyType} onChange={(event) => atualizarCampo("pixKeyType", event.target.value)} className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm outline-none transition focus:border-app-caramelo-torrado">
                    <option value="document">CNPJ</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave aleatoria</option>
                  </select>
                </label>
                <Field label="Chave Pix" value={form.pixKey} onChange={(value) => atualizarCampo("pixKey", form.pixKeyType === "document"
            ? aplicarMascaraCnpj(value)
            : form.pixKeyType === "phone"
                ? aplicarMascaraTelefone(value)
                : value)} inputMode={form.pixKeyType === "phone" ? "tel" : "text"}/>
              </div>
            </section>

            <section className="mt-8 border-t border-app-baunilha-dourada/60 pt-8">
              <h3 className="text-2xl font-medium text-app-cafe-profundo">
                Frequencia de repasse
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
            ["daily", "Diario"],
            ["weekly", "Semanal"],
            ["biweekly", "Quinzenal"],
        ].map(([value, label]) => (<button key={value} type="button" onClick={() => atualizarCampo("payoutCadence", value)} className={`rounded-[8px] px-5 py-4 text-sm font-bold uppercase transition ${form.payoutCadence === value
                ? "bg-app-cafe-profundo text-app-creme-leve"
                : "bg-app-creme-suave text-app-mocha hover:bg-app-baunilha-dourada"}`}>
                    {label}
                  </button>))}
              </div>
            </section>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/restaurante/configuracoes" className="flex h-12 items-center justify-center rounded-[8px] border border-app-mocha px-8 text-xs font-bold uppercase tracking-wide text-app-mocha transition hover:bg-app-creme-leve">
                Cancelar
              </Link>
              <button type="submit" disabled={salvando} className="h-12 rounded-[8px] bg-app-dourado-mel px-8 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-app-caramelo-torrado disabled:cursor-not-allowed disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar dados"}
              </button>
            </div>
            {message ? <p className="mt-4 text-sm font-semibold text-app-caramelo-torrado">{message}</p> : null}
          </section>

          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-cafe-profundo text-app-creme-leve">
                <Icon type="shield" className="h-6 w-6"/>
              </span>
              <h3 className="mt-5 text-2xl font-medium text-app-cafe-profundo">
                Validacao financeira
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-mocha">
                Em producao, os dados bancarios seriam enviados diretamente para
                um provedor financeiro. A Appono guardaria apenas o identificador
                seguro retornado por esse provedor.
              </p>
            </section>

            <section className="rounded-[8px] bg-app-chantilly p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
              <h3 className="flex items-center gap-3 text-xl font-medium text-app-cafe-profundo">
                <Icon type="lock" className="h-5 w-5 text-app-caramelo-torrado"/>
                Dados sensiveis
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-cinza">
                Banco, agencia, conta e Pix nao ficam salvos na base da Appono.
                Essa decisao reduz exposicao de dados sensiveis e melhora a
                aderencia a boas praticas de seguranca.
              </p>
            </section>

            <section className="rounded-[8px] bg-app-baunilha-dourada p-6 shadow-sm">
              <h3 className="flex items-center gap-3 text-xl font-medium text-app-cafe-profundo">
                <Icon type="card" className="h-5 w-5"/>
                Status de repasse
              </h3>
              <div className="mt-5 rounded-[8px] bg-app-chantilly p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-cinza">
                  Integracao financeira pendente
                </p>
                <p className="mt-2 text-sm leading-6 text-app-mocha">
                  O historico de repasses aparecera aqui quando a integracao
                  financeira estiver disponivel.
                </p>
              </div>
            </section>
          </aside>
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
