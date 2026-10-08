"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Home, Hash, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { useInterface } from "@/lib/use-interface";
import { apiRequest } from "@/lib/api";
import { TelaCarregandoSessao, useSessaoLocal } from "@/lib/use-sessao-local";
import { aplicarMascaraCep, cepEstaCompleto } from "@/lib/validacoes/cep";
import { somenteNumeros } from "@/lib/validacoes/comum";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { validarCep } from "@/lib/schemas/validacoes-base";
import { z } from "zod";

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const enderecoSchema = z.object({
  postalCode: z.string().min(1, "O CEP é obrigatório.").refine(validarCep, "Informe um CEP válido."),
  street: z.string().min(1, "O endereço (rua/avenida) é obrigatório."),
  number: z.string().min(1, "O número é obrigatório."),
  complement: z.string().optional().default(""),
  district: z.string().min(1, "O bairro é obrigatório."),
  city: z.string().min(1, "A cidade é obrigatória."),
  state: z.string().min(1, "Selecione o estado (UF)."),
});

function separarEndereco(endereco) {
  const [street = "", number = "", complement = "", district = "", city = "", state = ""] =
    endereco?.split(",").map((p) => p.trim()) ?? [];
  return { street, number, complement, district, city, state };
}

export default function RestaurantAddressSettingsPage({ onVoltar }) {
  const { ui } = useInterface();
  const { sessao, sessaoCarregada } = useSessaoLocal();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(enderecoSchema),
    mode: "onTouched",
    defaultValues: { postalCode: "", street: "", number: "", complement: "", district: "", city: "", state: "" },
  });

  const [apiMessage, setApiMessage] = useState("");
  const [apiSuccess, setApiSuccess] = useState(false);

  // Carrega dados existentes
  useEffect(() => {
    if (!sessaoCarregada || sessao?.type !== "restaurant") return;
    apiRequest("/me")
      .then(({ perfil }) => {
        const partes = separarEndereco(perfil.endereco);
        setValue("postalCode", aplicarMascaraCep(perfil.cep ?? ""));
        setValue("street", partes.street);
        setValue("number", partes.number);
        setValue("complement", partes.complement);
        setValue("district", partes.district);
        setValue("city", partes.city);
        setValue("state", partes.state);
      })
      .catch((error) => {
        setApiMessage(error instanceof Error ? error.message : "Não foi possível carregar o endereço.");
        setApiSuccess(false);
      });
  }, [sessao, sessaoCarregada, setValue]);

  async function handleCepBlur(e) {
    const raw = e.target.value;
    if (!cepEstaCompleto(raw)) return;
    try {
      const address = await apiRequest(`/validacoes/cep/${somenteNumeros(raw)}`, { auth: false });
      if (address.rua) setValue("street", address.rua);
      if (address.bairro) setValue("district", address.bairro);
      if (address.cidade) setValue("city", address.cidade);
      if (address.estado) setValue("state", address.estado);
    } catch {
      // Não bloqueia o usuário se o CEP não puder ser consultado
    }
  }

  async function onSubmit(data) {
    setApiMessage("");
    setApiSuccess(false);
    try {
      const endereco = [data.street, data.number, data.complement, data.district, data.city, data.state]
        .filter(Boolean).join(", ");
      const resposta = await apiRequest("/me", {
        method: "PATCH",
        body: JSON.stringify({ cep: data.postalCode, endereco }),
      });
      setApiMessage(resposta.message ?? "Endereço salvo com sucesso.");
      setApiSuccess(true);
    } catch (error) {
      setApiMessage(error instanceof Error ? error.message : "Não foi possível salvar o endereço.");
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
      <section className="border-b border-app-baunilha-dourada/45 pb-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-app-creme-suave text-app-caramelo-torrado">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-3xl font-medium leading-tight text-app-cafe-profundo">
              {ui("Endereço da Loja")}
            </h2>
          </div>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-6 pt-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-[8px] border border-app-baunilha-dourada/45 bg-white p-6 sm:p-10"
          noValidate
        >
          <div className="grid gap-6 sm:grid-cols-[0.48fr_1fr] sm:items-end">
            <FormInput
              label={ui("CEP")}
              placeholder="00000-000"
              required
              inputMode="numeric"
              maxLength={9}
              leftIcon={MapPin}
              error={errors.postalCode}
              helperText={ui("Preencha para preenchimento automático.")}
              {...register("postalCode", {
                onChange: (e) => setValue("postalCode", aplicarMascaraCep(e.target.value)),
                onBlur: handleCepBlur,
              })}
            />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FormInput
              label={ui("Rua / Avenida")}
              placeholder="Ex: Rua das Flores"
              required
              leftIcon={Home}
              error={errors.street}
              containerClassName="sm:col-span-2"
              {...register("street")}
            />

            <FormInput
              label={ui("Número")}
              placeholder="123"
              required
              leftIcon={Hash}
              error={errors.number}
              {...register("number")}
            />

            <FormInput
              label={ui("Complemento")}
              placeholder={ui("Sala, Bloco, etc.")}
              error={errors.complement}
              {...register("complement")}
            />

            <FormInput
              label={ui("Bairro")}
              placeholder="Ex: Jardins"
              required
              error={errors.district}
              containerClassName="sm:col-span-2"
              {...register("district")}
            />

            <FormInput
              label={ui("Cidade")}
              placeholder="Ex: São Paulo"
              required
              error={errors.city}
              {...register("city")}
            />

            <FormSelect
              label={ui("Estado (UF)")}
              required
              error={errors.state}
              {...register("state")}
            >
              <option value="">{ui("Selecione a UF")}</option>
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </FormSelect>
          </div>

          {/* Feedback da API */}
          {apiMessage && (
            <div className={`mt-5 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold border ${apiSuccess ? "bg-emerald-50 border-emerald-200/60 text-emerald-800" : "bg-amber-50 border-amber-200/60 text-amber-800"}`}>
              {apiSuccess
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                : <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />}
              <span>{ui(apiMessage)}</span>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-8 text-xs font-bold uppercase tracking-wide text-white transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Salvando...</span></>
              ) : (
                <><Save className="h-4 w-4" /><span>{ui("Salvar endereço")}</span></>
              )}
            </button>
            <button
              type="button"
              onClick={onVoltar}
              className="flex h-12 items-center justify-center rounded-xl border border-slate-300 px-8 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
            >
              {ui("Cancelar")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
