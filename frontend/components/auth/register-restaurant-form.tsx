"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FormField } from "@/components/auth/form-field";
import { apiRequest } from "@/lib/api";
import { AuthResponse, getDashboardPath, persistAuthResponse } from "@/lib/session";
import { aplicarMascaraCep, cepEstaCompleto } from "@/lib/validacoes/cep";
import { aplicarMascaraCnpj, cnpjEstaCompleto } from "@/lib/validacoes/cnpj";
import { somenteNumeros } from "@/lib/validacoes/comum";
import {
  aplicarMascaraAgencia,
  aplicarMascaraCodigoBanco,
  aplicarMascaraConta,
} from "@/lib/validacoes/dados-bancarios";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import {
  enviarImagemRestaurante,
  validarImagemRestaurante,
} from "@/lib/imagem-restaurante";

type RestaurantForm = {
  storeName: string;
  legalName: string;
  email: string;
  phone: string;
  cnpj: string;
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  uf: string;
  number: string;
  complement: string;
  tables: string;
  bankCode: string;
  agency: string;
  checkingAccount: string;
  pixKey: string;
  password: string;
};

type ResultadoConsultaCep = {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type ResultadoConsultaCnpj = {
  razaoSocial: string;
  situacao: string;
};

const initialForm: RestaurantForm = {
  storeName: "",
  legalName: "",
  email: "",
  phone: "",
  cnpj: "",
  cep: "",
  address: "",
  neighborhood: "",
  city: "",
  uf: "",
  number: "",
  complement: "",
  tables: "",
  bankCode: "",
  agency: "",
  checkingAccount: "",
  pixKey: "",
  password: "",
};

export function RegisterRestaurantForm() {
  const [form, setForm] = useState<RestaurantForm>(initialForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState("");

  function atualizarCampo(field: keyof RestaurantForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function dadosRestauranteEstaoPreenchidos() {
    return Boolean(
      form.legalName &&
        form.storeName &&
        form.email &&
        form.phone &&
        form.cnpj &&
        form.cep &&
        form.address &&
        form.neighborhood &&
        form.city &&
        form.uf &&
        form.number &&
        form.tables &&
        form.password,
    );
  }

  function selecionarImagem(arquivo?: File) {
    if (!arquivo) {
      return;
    }

    const erro = validarImagemRestaurante(arquivo);

    if (erro) {
      setMessage(erro);
      return;
    }

    if (imagemPreview) {
      URL.revokeObjectURL(imagemPreview);
    }

    setImagem(arquivo);
    setImagemPreview(URL.createObjectURL(arquivo));
    setMessage("");
  }

  function irParaEtapaBancaria() {
    if (!dadosRestauranteEstaoPreenchidos()) {
      setMessage("Preencha os dados do restaurante antes de continuar.");
      return;
    }

    setStep(2);
    setMessage("");
  }

  async function validarCnpj() {
    if (!cnpjEstaCompleto(form.cnpj)) {
      return;
    }

    try {
      const company = await apiRequest<ResultadoConsultaCnpj>(
        `/validacoes/cnpj/${somenteNumeros(form.cnpj)}`,
      );

      setForm((current) => ({
        ...current,
        legalName: company.razaoSocial || current.legalName,
      }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CNPJ invalido.");
    }
  }

  async function validarCep() {
    if (!cepEstaCompleto(form.cep)) {
      return;
    }

    try {
      const address = await apiRequest<ResultadoConsultaCep>(
        `/validacoes/cep/${somenteNumeros(form.cep)}`,
      );

      setForm((current) => ({
        ...current,
        address: address.rua || current.address,
        neighborhood: address.bairro || current.neighborhood,
        city: address.cidade || current.city,
        uf: address.estado || current.uf,
      }));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CEP invalido.");
    }
  }

  async function criarRestaurante() {
    if (!dadosRestauranteEstaoPreenchidos()) {
      setStep(1);
      setMessage("Preencha os dados do restaurante antes de finalizar.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiRequest<AuthResponse>(
        "/auth/register/restaurant",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );

      await persistAuthResponse(response);

      if (response.session) {
        if (imagem) {
          await enviarImagemRestaurante(imagem, response.session);
        }
        window.location.href = getDashboardPath(response.tipo);
        return;
      }

      setMessage(
        response.message ??
          "Conta criada. Confirme seu e-mail para entrar direto no painel.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a conta do restaurante.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="rounded-[12px] bg-app-chantilly px-5 py-4 shadow-[0_18px_50px_rgba(74,44,10,0.08)] ring-1 ring-app-baunilha-dourada sm:px-7">
        <div className="mb-3 flex justify-center">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={108}
            height={108}
            className="h-16 w-16"
            priority
          />
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
          >
            Voltar
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
            Cadastro de parceiro
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-2xl font-bold text-app-cafe-profundo">
              Torne-se um parceiro APPONO
            </h1>
            <p className="mt-1 text-sm leading-5 text-app-mocha">
              {step === 1
                ? "Informe os dados operacionais do estabelecimento."
                : "Cadastre a conta juridica para receber os repasses da plataforma."}
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden border border-app-baunilha-dourada text-center text-[10px] font-bold uppercase tracking-[0.18em]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-4 py-2 transition ${
                step === 1
                  ? "bg-app-cafe-profundo text-app-creme-leve"
                  : "bg-app-creme-suave text-app-caramelo-torrado hover:bg-app-baunilha-dourada"
              }`}
            >
              Etapa 1
            </button>
            <button
              type="button"
              onClick={irParaEtapaBancaria}
              className={`px-4 py-2 transition ${
                step === 2
                  ? "bg-app-cafe-profundo text-app-creme-leve"
                  : "bg-app-creme-suave text-app-caramelo-torrado hover:bg-app-baunilha-dourada"
              }`}
            >
              Etapa 2
            </button>
          </div>
        </div>

        {step === 1 ? (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-6 xl:grid-cols-12">
            <FormField label="Nome da loja" value={form.storeName} onChange={(event) => atualizarCampo("storeName", event.target.value)} placeholder="Nome que aparecera para os clientes" required className="sm:col-span-6 xl:col-span-4" />
            <FormField label="Razao social" value={form.legalName} onChange={(event) => atualizarCampo("legalName", event.target.value)} placeholder="Ex: Terra Artisan Gastronomia LTDA" required className="sm:col-span-6 xl:col-span-4" />
            <FormField label="E-mail" type="email" value={form.email} onChange={(event) => atualizarCampo("email", event.target.value)} placeholder="contato@restaurante.com" required className="sm:col-span-3 xl:col-span-3" />
            <FormField label="Telefone" value={form.phone} onChange={(event) => atualizarCampo("phone", aplicarMascaraTelefone(event.target.value))} placeholder="(11) 99999-9999" inputMode="tel" maxLength={15} required className="sm:col-span-3 xl:col-span-2" />
            <FormField label="CNPJ" value={form.cnpj} onChange={(event) => atualizarCampo("cnpj", aplicarMascaraCnpj(event.target.value))} onBlur={validarCnpj} placeholder="00.000.000/0001-00" inputMode="numeric" maxLength={18} required className="sm:col-span-3 xl:col-span-3" />
            <FormField label="CEP" value={form.cep} onChange={(event) => atualizarCampo("cep", aplicarMascaraCep(event.target.value))} onBlur={validarCep} placeholder="00000-000" inputMode="numeric" maxLength={9} required className="sm:col-span-2 xl:col-span-2" />
            <FormField label="Endereco" value={form.address} onChange={(event) => atualizarCampo("address", event.target.value)} placeholder="Rua, Avenida, etc." required className="sm:col-span-4 xl:col-span-4" />
            <FormField label="Bairro" value={form.neighborhood} onChange={(event) => atualizarCampo("neighborhood", event.target.value)} placeholder="Ex: Jardins" required className="sm:col-span-2 xl:col-span-2" />
            <FormField label="Cidade" value={form.city} onChange={(event) => atualizarCampo("city", event.target.value)} placeholder="Ex: Sao Paulo" required className="sm:col-span-2 xl:col-span-3" />
            <FormField label="UF" value={form.uf} onChange={(event) => atualizarCampo("uf", event.target.value)} placeholder="Ex: SP" required maxLength={2} className="sm:col-span-2 xl:col-span-1" />
            <FormField label="Numero" value={form.number} onChange={(event) => atualizarCampo("number", event.target.value)} placeholder="Ex: 123" required className="sm:col-span-3 xl:col-span-2" />
            <FormField label="Complemento" value={form.complement} onChange={(event) => atualizarCampo("complement", event.target.value)} placeholder="Sala, Bloco, etc." className="sm:col-span-3 xl:col-span-3" />
            <FormField label="Numero de mesas" type="number" min="1" value={form.tables} onChange={(event) => atualizarCampo("tables", event.target.value)} placeholder="Ex: 12" required className="sm:col-span-3 xl:col-span-2" />
            <FormField label="Senha" type="password" value={form.password} onChange={(event) => atualizarCampo("password", event.target.value)} placeholder="Digite aqui" required minLength={6} className="sm:col-span-3 xl:col-span-2" />
            <label className="grid gap-1 rounded-[8px] border border-dashed border-app-caramelo-torrado/50 bg-app-creme-suave p-3 sm:col-span-6 xl:col-span-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-app-cafe-profundo">
                Imagem do restaurante
              </span>
              <span className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 rounded-[8px] bg-app-baunilha-dourada bg-cover bg-center"
                  style={imagemPreview ? { backgroundImage: `url("${imagemPreview}")` } : undefined}
                />
                <span className="text-xs leading-5 text-app-mocha">
                  Selecione JPG, PNG ou WebP de ate 5 MB. Esta imagem aparecera para os clientes.
                </span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selecionarImagem(event.target.files?.[0])}
                className="text-xs text-app-mocha file:mr-3 file:border-0 file:bg-app-caramelo-torrado file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              />
            </label>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-6">
            <FormField label="Codigo do banco" value={form.bankCode} onChange={(event) => atualizarCampo("bankCode", aplicarMascaraCodigoBanco(event.target.value))} placeholder="Ex: 260, 001" inputMode="numeric" maxLength={3} className="sm:col-span-2" />
            <FormField label="Agencia" value={form.agency} onChange={(event) => atualizarCampo("agency", aplicarMascaraAgencia(event.target.value))} placeholder="Ex: 0001" inputMode="numeric" maxLength={5} className="sm:col-span-2" />
            <FormField label="Conta corrente com digito" value={form.checkingAccount} onChange={(event) => atualizarCampo("checkingAccount", aplicarMascaraConta(event.target.value))} placeholder="Ex: 12345-6" inputMode="numeric" maxLength={22} className="sm:col-span-2" />
            <FormField label="Chave Pix vinculada a conta" value={form.pixKey} onChange={(event) => atualizarCampo("pixKey", event.target.value)} placeholder="Opcional" className="sm:col-span-6" />
            <div className="border border-app-baunilha-dourada bg-app-creme-suave px-4 py-3 text-xs leading-5 text-app-mocha sm:col-span-6">
              Os dados bancarios sao opcionais neste MVP. Quando informados, devem
              pertencer ao mesmo CNPJ da etapa 1. Conta: ate 20 numeros e digito
              opcional apos hifen.
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-col-reverse gap-2 border-t border-app-baunilha-dourada pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] leading-4 text-app-cinza">
            Ao finalizar, voce concorda com nossos Termos e Politica de Privacidade.
          </p>
          {step === 1 ? (
            <button
              type="button"
              onClick={irParaEtapaBancaria}
              className="flex h-9 w-full items-center justify-center bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 sm:w-auto"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={criarRestaurante}
              disabled={isSubmitting}
              className="flex h-9 w-full items-center justify-center bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {isSubmitting ? "Criando..." : "Criar conta"}
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2 text-sm text-app-cinza sm:flex-row sm:items-center sm:justify-between">
          <span>
            Ja possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-app-cafe-profundo transition hover:text-app-caramelo-torrado"
            >
              Entrar
            </Link>
          </span>
          {message ? (
            <span className="font-semibold text-app-caramelo-torrado">
              {message}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
