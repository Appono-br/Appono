"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormField } from "@/components/auth/form-field";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { aplicarMascaraCep, cepEstaCompleto } from "@/lib/validacoes/cep";
import { aplicarMascaraCnpj, cnpjEstaCompleto } from "@/lib/validacoes/cnpj";
import { somenteNumeros } from "@/lib/validacoes/comum";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";
import {
  enviarImagemRestaurante,
  validarImagemRestaurante,
} from "@/lib/imagem-restaurante";

const initialForm = {
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
  password: "",
};

export function RegisterRestaurantForm({ googleFlow = false }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [imagemPreview, setImagemPreview] = useState("");
  const [googleSession, setGoogleSession] = useState(null);
  const isGoogleFlow = googleFlow;

  useEffect(() => {
    if (!isGoogleFlow) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMessage("Entre com Google novamente para completar o cadastro.");
        return;
      }

      setGoogleSession(data.session);
      setForm((current) => ({
        ...current,
        email: data.session.user.email ?? current.email,
      }));
    });
  }, [isGoogleFlow]);

  function atualizarCampo(field, value) {
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
        (isGoogleFlow || form.password)
    );
  }

  function selecionarImagem(arquivo) {
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

  async function validarCnpj() {
    if (!cnpjEstaCompleto(form.cnpj)) {
      return;
    }

    try {
      const company = await apiRequest(`/validacoes/cnpj/${somenteNumeros(form.cnpj)}`, {
        auth: false,
      });
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
      const address = await apiRequest(`/validacoes/cep/${somenteNumeros(form.cep)}`, {
        auth: false,
      });
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
      setMessage("Preencha os dados do restaurante antes de finalizar.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiRequest(
        isGoogleFlow ? "/auth/google/restaurant" : "/auth/register/restaurant",
        {
          method: "POST",
          auth: isGoogleFlow,
          body: JSON.stringify(form),
        }
      );
      const session = response.session ?? googleSession;

      await persistAuthResponse({ ...response, session });

      if (session) {
        if (imagem) {
          try {
            await enviarImagemRestaurante(imagem, session);
          } catch (error) {
            console.warn("Nao foi possivel enviar a imagem do restaurante.", error);
          }
        }

        window.location.href = getDashboardPath(response.tipo);
        return;
      }

      setMessage(
        response.message ??
          "Conta criada. Confirme seu e-mail para entrar direto no painel."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a conta do restaurante."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl bg-app-creme-leve px-6 py-7 shadow-sm ring-1 ring-app-baunilha-dourada/45 sm:px-9">
        <div className="mb-5 flex justify-center">
          <Image
            src="/brand/appono-mark.svg"
            alt="Appono"
            width={108}
            height={108}
            className="h-16 w-16"
            priority
          />
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-app-caramelo-torrado transition hover:bg-app-chantilly hover:text-app-cafe-profundo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar
          </Link>

          <p className="rounded-full bg-app-creme-suave px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
            Cadastro de parceiro
          </p>
        </div>

        <h1 className="text-2xl font-bold text-app-cafe-profundo">
          Torne-se um parceiro APPONO
        </h1>
        <p className="mt-1 text-sm leading-5 text-app-cinza">
          Informe os dados operacionais do estabelecimento. A conta Mercado Pago
          podera ser conectada depois, nas configuracoes.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FormField
            label="Nome da loja"
            value={form.storeName}
            onChange={(event) => atualizarCampo("storeName", event.target.value)}
            placeholder="Nome que aparecera para os clientes"
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Razao social"
            value={form.legalName}
            onChange={(event) => atualizarCampo("legalName", event.target.value)}
            placeholder="Ex: Terra Artisan Gastronomia LTDA"
            required
            className="sm:col-span-2"
          />
          <FormField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => atualizarCampo("email", event.target.value)}
            placeholder="contato@restaurante.com"
            required
            disabled={isGoogleFlow}
            className="sm:col-span-2"
          />
          <FormField
            label="Telefone"
            value={form.phone}
            onChange={(event) =>
              atualizarCampo("phone", aplicarMascaraTelefone(event.target.value))
            }
            placeholder="(11) 99999-9999"
            inputMode="tel"
            maxLength={15}
            required
            className="sm:col-span-2"
          />
          <FormField
            label="CNPJ"
            value={form.cnpj}
            onChange={(event) =>
              atualizarCampo("cnpj", aplicarMascaraCnpj(event.target.value))
            }
            onBlur={validarCnpj}
            placeholder="00.000.000/0001-00"
            inputMode="numeric"
            maxLength={18}
            required
            className="sm:col-span-2"
          />
          <FormField
            label="CEP"
            value={form.cep}
            onChange={(event) =>
              atualizarCampo("cep", aplicarMascaraCep(event.target.value))
            }
            onBlur={validarCep}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Endereco"
            value={form.address}
            onChange={(event) => atualizarCampo("address", event.target.value)}
            placeholder="Rua, Avenida, etc."
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Bairro"
            value={form.neighborhood}
            onChange={(event) =>
              atualizarCampo("neighborhood", event.target.value)
            }
            placeholder="Ex: Jardins"
            required
          />
          <FormField
            label="Cidade"
            value={form.city}
            onChange={(event) => atualizarCampo("city", event.target.value)}
            placeholder="Ex: Sao Paulo"
            required
          />
          <FormField
            label="UF"
            value={form.uf}
            onChange={(event) => atualizarCampo("uf", event.target.value)}
            placeholder="Ex: SP"
            required
            maxLength={2}
          />
          <FormField
            label="Numero"
            value={form.number}
            onChange={(event) => atualizarCampo("number", event.target.value)}
            placeholder="Ex: 123"
            required
          />
          <FormField
            label="Complemento"
            value={form.complement}
            onChange={(event) => atualizarCampo("complement", event.target.value)}
            placeholder="Sala, Bloco, etc."
            className="sm:col-span-2"
          />
          <FormField
            label="Numero de mesas"
            type="number"
            min="1"
            value={form.tables}
            onChange={(event) => atualizarCampo("tables", event.target.value)}
            placeholder="Ex: 12"
            required
            className="sm:col-span-2"
          />
          {!isGoogleFlow ? (
            <FormField
              label="Senha"
              type="password"
              value={form.password}
              onChange={(event) => atualizarCampo("password", event.target.value)}
              placeholder="Digite aqui"
              required
              minLength={6}
              className="sm:col-span-2"
            />
          ) : null}

          <label className="group grid gap-3 rounded-xl border-2 border-dashed border-app-baunilha-dourada/50 bg-app-creme-leve p-5 text-center transition hover:border-app-caramelo-torrado hover:bg-app-chantilly sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-app-caramelo-torrado">
              Imagem do restaurante
            </span>
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app-creme-suave bg-cover bg-center ring-2 ring-app-caramelo-torrado/20 transition group-hover:ring-app-dourado-mel"
                style={
                  imagemPreview
                    ? { backgroundImage: `url("${imagemPreview}")` }
                    : undefined
                }
              >
                {!imagemPreview ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-app-caramelo-torrado/70"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                ) : null}
              </div>
              <span className="text-xs leading-5 text-app-cinza">
                Selecione JPG, PNG ou WebP de ate 5 MB.
                <br />
                Esta imagem aparecera para os clientes.
              </span>
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-app-caramelo-torrado px-4 py-2 text-xs font-bold text-white transition hover:bg-app-cafe-profundo">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Escolher arquivo
              </span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => selecionarImagem(event.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-app-creme-suave pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] leading-4 text-app-cinza">
            Ao finalizar, voce concorda com nossos Termos e Politica de
            Privacidade.
          </p>
          <button
            type="button"
            onClick={criarRestaurante}
            disabled={isSubmitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Criando...
              </>
            ) : (
              "Criar conta"
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2 text-sm text-app-cinza sm:flex-row sm:items-center sm:justify-between">
          <span>
            Ja possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-app-caramelo-torrado transition hover:text-app-dourado-mel"
            >
              Entrar
            </Link>
          </span>
          {message ? (
            <span className="rounded-full bg-app-creme-leve px-3 py-1 font-semibold text-app-caramelo-torrado">
              {message}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
