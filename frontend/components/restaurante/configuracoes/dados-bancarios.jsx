"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Landmark,
  Shield,
  Lock,
  CreditCard,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraCnpj } from "@/lib/validacoes/cnpj";
import { somenteNumeros } from "@/lib/validacoes/comum";
import {
  aplicarMascaraAgencia,
  aplicarMascaraCodigoBanco,
} from "@/lib/validacoes/dados-bancarios";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";

const bancarioSchema = z.object({
  bankCode: z
    .string()
    .min(1, "Informe o código do banco.")
    .refine((v) => somenteNumeros(v).length === 3, "O código do banco deve ter 3 dígitos."),
  agency: z
    .string()
    .min(1, "Informe a agência.")
    .refine((v) => somenteNumeros(v).length <= 5, "A agência deve ter no máximo 5 dígitos."),
  account: z.string().min(1, "Informe o número da conta."),
  accountDigit: z.string().optional().default(""),
  accountType: z.enum(["checking", "savings"]).default("checking"),
  pixKeyType: z.enum(["document", "email", "phone", "random"]).default("document"),
  pixKey: z.string().optional().default(""),
  payoutCadence: z.enum(["daily", "weekly", "biweekly"]).default("weekly"),
});

const initialBankSummary = {
  status: "nao_configurado",
  provider: "integração_externa_pendente",
  updatedAt: "",
};

export default function RestaurantBankSettingsPage({ onVoltar }) {
  const { ui } = useInterface();
  const { sessao, sessaoCarregada } = useSessaoLocal();
  const [bankSummary, setBankSummary] = useState(initialBankSummary);
  const [legalName, setLegalName] = useState("");
  const [document, setDocument] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [apiSuccess, setApiSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bancarioSchema),
    mode: "onTouched",
    defaultValues: {
      bankCode: "",
      agency: "",
      account: "",
      accountDigit: "",
      accountType: "checking",
      pixKeyType: "document",
      pixKey: "",
      payoutCadence: "weekly",
    },
  });

  const pixKeyType = watch("pixKeyType");
  const payoutCadence = watch("payoutCadence");

  useEffect(() => {
    if (!sessaoCarregada || sessao?.type !== "restaurant") return;
    async function carregar() {
      try {
        const resposta = await apiRequest("/me");
        const restaurante = resposta.perfil;
        const dadosBancarios = restaurante.dados_bancarios_restaurante?.[0];
        setLegalName(restaurante.razao_social ?? restaurante.nome ?? "");
        setDocument(aplicarMascaraCnpj(restaurante.cnpj ?? ""));
        setBankSummary({
          status: dadosBancarios?.status_cadastro ?? "nao_configurado",
          provider: dadosBancarios?.provedor_pagamento ?? "integração_externa_pendente",
          updatedAt: dadosBancarios?.updated_at ?? "",
        });
      } catch (error) {
        setApiMessage(
          error instanceof Error ? error.message : "Não foi possível carregar os dados bancários."
        );
        setApiSuccess(false);
      }
    }
    carregar();
  }, [sessao, sessaoCarregada]);

  async function onSubmit(data) {
    setApiMessage("");
    setApiSuccess(false);
    try {
      const contaCorrente = data.accountDigit
        ? `${data.account}-${data.accountDigit}`
        : data.account;

      const resposta = await apiRequest("/me/dados-bancarios", {
        method: "PATCH",
        body: JSON.stringify({
          bankCode: data.bankCode,
          agency: data.agency,
          checkingAccount: contaCorrente,
          pixKey: data.pixKey,
        }),
      });

      const dadosBancarios = resposta.perfil?.dados_bancarios_restaurante?.[0];
      setBankSummary({
        status: dadosBancarios?.status_cadastro ?? "pendente_validação",
        provider: dadosBancarios?.provedor_pagamento ?? "integração_financeira_externa",
        updatedAt: dadosBancarios?.updated_at ?? "",
      });

      // Limpa campos sensíveis após salvar
      setValue("bankCode", "");
      setValue("agency", "");
      setValue("account", "");
      setValue("accountDigit", "");
      setValue("pixKey", "");

      setApiMessage(resposta.message ?? "Dados bancários salvos com sucesso.");
      setApiSuccess(true);
    } catch (error) {
      setApiMessage(
        error instanceof Error ? error.message : "Não foi possível salvar os dados."
      );
      setApiSuccess(false);
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

  return (
    <div className="min-w-0 text-app-cafe-profundo">
      <section className="w-full min-w-0">
        <div className="border-b border-app-baunilha-dourada/60 pb-6">
          <h2 className="text-3xl font-medium leading-tight text-app-cafe-profundo">
            {ui("Dados Bancários")}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.5fr]"
          noValidate
        >
          {/* Seção principal */}
          <section className="rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-app-baunilha-dourada/60 pb-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-medium text-app-cafe-profundo">
                  {ui("Conta de repasse")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-app-cinza">
                  {ui("Os dados devem pertencer ao mesmo CNPJ do restaurante.")}
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-baunilha-dourada text-app-caramelo-torrado">
                <Landmark className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {/* Campos somente leitura */}
              <div className="grid gap-2 sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  {ui("Razão social titular")}
                </span>
                <input
                  value={legalName}
                  readOnly
                  disabled
                  className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cafe-profundo outline-none disabled:cursor-not-allowed disabled:opacity-65"
                />
              </div>

              <div className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  {ui("CNPJ titular")}
                </span>
                <input
                  value={document}
                  readOnly
                  disabled
                  className="h-12 rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave px-4 text-sm text-app-cafe-profundo outline-none disabled:cursor-not-allowed disabled:opacity-65"
                />
              </div>

              {/* Status summary */}
              <div className="rounded-[8px] border border-app-baunilha-dourada bg-app-creme-suave p-4 text-sm leading-6 text-app-mocha sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-cinza">
                  {ui("Dados cadastrados")}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <span>
                    {ui("Status: ")}<strong>
                      {ui(bankSummary.status === "pendente_validação"
                        ? "Pendente de validação"
                        : bankSummary.status === "validado"
                        ? "Validado"
                        : "Não configurado")}
                    </strong>
                  </span>
                  <span>{ui("Provedor: ")}<strong>{bankSummary.provider}</strong></span>
                  <span>
                    {ui("Atualização: ")}<strong>
                      {ui(bankSummary.updatedAt
                        ? new Date(bankSummary.updatedAt).toLocaleDateString("pt-BR")
                        : "Sem registro")}
                    </strong>
                  </span>
                </div>
                <p className="mt-3 text-xs text-app-cinza">
                  {ui("Por segurança, a Appono não armazena banco, agência, conta ou Pix. No MVP, o envio abaixo apenas muda o status para validação externa pendente.")}
                </p>
              </div>

              <FormInput
                label={ui("Código do banco")}
                inputMode="numeric"
                maxLength={3}
                required
                placeholder="001"
                error={errors.bankCode}
                {...register("bankCode", {
                  onChange: (e) =>
                    setValue("bankCode", aplicarMascaraCodigoBanco(e.target.value)),
                })}
              />

              <FormInput
                label={ui("Agência")}
                inputMode="numeric"
                maxLength={5}
                required
                placeholder="00001"
                error={errors.agency}
                {...register("agency", {
                  onChange: (e) =>
                    setValue("agency", aplicarMascaraAgencia(e.target.value)),
                })}
              />

              <div className="grid gap-5 sm:col-span-2 sm:grid-cols-[1fr_0.38fr]">
                <FormInput
                  label={ui("Conta")}
                  inputMode="numeric"
                  maxLength={20}
                  required
                  placeholder="00000001"
                  error={errors.account}
                  {...register("account", {
                    onChange: (e) =>
                      setValue("account", somenteNumeros(e.target.value).slice(0, 20)),
                  })}
                />
                <FormInput
                  label={ui("Dígito")}
                  maxLength={1}
                  placeholder="0"
                  error={errors.accountDigit}
                  {...register("accountDigit", {
                    onChange: (e) =>
                      setValue(
                        "accountDigit",
                        e.target.value.replace(/[^\dXx]/g, "").slice(0, 1).toUpperCase()
                      ),
                  })}
                />
              </div>

              <FormSelect label={ui("Tipo de conta")} error={errors.accountType} {...register("accountType")}>
                <option value="checking">{ui("Conta corrente")}</option>
                <option value="savings">{ui("Conta poupança")}</option>
              </FormSelect>
            </div>

            {/* Seção Pix */}
            <section className="mt-8 border-t border-app-baunilha-dourada/60 pt-8">
              <h3 className="flex items-center gap-3 text-xl font-medium text-app-cafe-profundo">
                <span className="text-app-caramelo-torrado">Pix</span>
                {ui("Chave de contingência")}
              </h3>
              <div className="mt-6 grid gap-5 sm:grid-cols-[0.46fr_1fr]">
                <FormSelect
                  label={ui("Tipo da chave")}
                  error={errors.pixKeyType}
                  {...register("pixKeyType")}
                >
                  <option value="document">{ui("CNPJ")}</option>
                  <option value="email">{ui("Email")}</option>
                  <option value="phone">{ui("Telefone")}</option>
                  <option value="random">{ui("Chave aleatória")}</option>
                </FormSelect>

                <FormInput
                  label={ui("Chave Pix")}
                  inputMode={pixKeyType === "phone" ? "tel" : "text"}
                  error={errors.pixKey}
                  {...register("pixKey", {
                    onChange: (e) => {
                      const v = e.target.value;
                      setValue(
                        "pixKey",
                        pixKeyType === "document"
                          ? aplicarMascaraCnpj(v)
                          : pixKeyType === "phone"
                          ? aplicarMascaraTelefone(v)
                          : v
                      );
                    },
                  })}
                />
              </div>
            </section>

            {/* Frequência de repasse */}
            <section className="mt-8 border-t border-app-baunilha-dourada/60 pt-8">
              <h3 className="text-xl font-medium text-app-cafe-profundo">
                {ui("Frequência de repasse")}
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["daily", "Diário"],
                  ["weekly", "Semanal"],
                  ["biweekly", "Quinzenal"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("payoutCadence", value)}
                    className={`rounded-xl px-5 py-4 text-sm font-bold uppercase transition ${
                      payoutCadence === value
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-app-creme-suave text-app-mocha hover:bg-app-baunilha-dourada"
                    }`}
                  >
                    {ui(label)}
                  </button>
                ))}
              </div>
            </section>

            {/* Feedback */}
            {apiMessage && (
              <div
                className={`mt-6 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border ${
                  apiSuccess
                    ? "bg-emerald-50 border-emerald-200/60 text-emerald-800"
                    : "bg-amber-50 border-amber-200/60 text-amber-800"
                }`}
              >
                {apiSuccess ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                )}
                <span>{ui(apiMessage)}</span>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onVoltar}
                className="flex h-12 items-center justify-center rounded-xl border border-slate-300 px-8 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
              >
                {ui("Cancelar")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-8 text-xs font-bold uppercase tracking-wide text-white transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>Salvando...</span></>
                ) : (
                  <><Save className="h-4 w-4" /><span>{ui("Salvar dados")}</span></>
                )}
              </button>
            </div>
          </section>

          {/* Aside informativo */}
          <aside className="grid gap-6">
            <section className="rounded-[8px] bg-app-creme-leve p-6 shadow-sm ring-1 ring-app-baunilha-dourada/60 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-cafe-profundo text-app-creme-leve">
                <Shield className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-medium text-app-cafe-profundo">
                {ui("Validação financeira")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-mocha">
                {ui("Em produção, os dados bancários seriam enviados diretamente para um provedor financeiro. A Appono guardaria apenas o identificador seguro retornado por esse provedor.")}
              </p>
            </section>

            <section className="rounded-[8px] bg-white p-6 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:p-8">
              <h3 className="flex items-center gap-3 text-xl font-medium text-app-cafe-profundo">
                <Lock className="h-5 w-5 text-app-caramelo-torrado" aria-hidden="true" />
                {ui("Dados sensíveis")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-app-cinza">
                {ui("Banco, agência, conta e Pix não ficam salvos na base da Appono. Essa decisão reduz exposição de dados sensíveis e melhora a aderência a boas práticas de segurança.")}
              </p>
            </section>

            <section className="rounded-[8px] bg-app-baunilha-dourada p-6 shadow-sm">
              <h3 className="flex items-center gap-3 text-xl font-medium text-app-cafe-profundo">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
                {ui("Status de repasse")}
              </h3>
              <div className="mt-5 rounded-[8px] bg-white p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-cinza">
                  {ui("Integração financeira pendente")}
                </p>
                <p className="mt-2 text-sm leading-6 text-app-mocha">
                  {ui("O histórico de repasses aparecerá aqui quando a integração financeira estiver disponível.")}
                </p>
              </div>
            </section>
          </aside>
        </form>
      </section>
    </div>
  );
}
