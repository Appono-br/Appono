"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormField } from "@/components/auth/form-field";
import { apiRequest } from "@/lib/api";
import { getDashboardPath, persistAuthResponse } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { somenteNumeros } from "@/lib/validacoes/comum";
import { aplicarMascaraCpf, cpfEstaCompleto } from "@/lib/validacoes/cpf";
import { aplicarMascaraTelefone } from "@/lib/validacoes/telefone";

const initialForm = {
  name: "",
  birthDate: "",
  cpf: "",
  email: "",
  phone: "",
  password: "",
};

function redirecionarParaLogin(email) {
  const params = new URLSearchParams();
  const emailNormalizado = String(email ?? "").trim().toLowerCase();

  params.set("cadastro", "existente");
  if (emailNormalizado) {
    params.set("email", emailNormalizado);
  }

  window.location.href = `/login?${params.toString()}`;
}

export function RegisterClientForm({ googleFlow = false }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        name: current.name || data.session.user.user_metadata?.full_name || "",
      }));
    });
  }, [isGoogleFlow]);

  function atualizarCampo(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  async function enviarFormulario(event) {
    event.preventDefault();
    if (!cpfEstaCompleto(form.cpf)) {
      setMessage("Informe um CPF completo e válido.");
      return;
    }
    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await apiRequest(isGoogleFlow ? "/auth/google/client" : "/auth/register/client", {
        method: "POST",
        auth: isGoogleFlow,
        body: JSON.stringify(form),
      });
      await persistAuthResponse({ ...response, session: response.session ?? googleSession });
      if (response.session || googleSession) {
        window.location.href = getDashboardPath(response.tipo);
        return;
      }
      setMessage(
        response.message ??
          "Conta criada. Confirme seu e-mail para entrar direto no painel."
      );
    } catch (error) {
      if (error?.code === "AUTH_USER_ALREADY_EXISTS") {
        redirecionarParaLogin(form.email);
        return;
      }

      setMessage(
        error instanceof Error ? error.message : "Não foi possível criar a conta."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={enviarFormulario} className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl bg-app-chantilly px-6 py-7 shadow-2xl sm:px-9">
        <div className="mb-4 flex justify-center">
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
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-app-caramelo-torrado transition hover:bg-app-creme-suave hover:text-app-cafe-profundo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar
          </Link>
          <p className="rounded-full bg-app-creme-suave px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-app-caramelo-torrado">
            Cadastro de cliente
          </p>
        </div>

        <h1 className="text-2xl font-bold text-app-cafe-profundo">
          Crie sua conta Appono
        </h1>
        <p className="mt-1 text-sm leading-5 text-app-mocha">
          Use seus dados reais para reservar mesa e acessar sua conta depois.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FormField
            label="Nome completo"
            value={form.name}
            onChange={(event) => atualizarCampo("name", event.target.value)}
            placeholder="Ex: Maria Silva"
            required
            className="sm:col-span-2"
          />
          <FormField
            label="Data de nascimento"
            type="date"
            value={form.birthDate}
            onChange={(event) => atualizarCampo("birthDate", event.target.value)}
            required
          />
          <FormField
            label="CPF"
            value={form.cpf}
            onChange={(event) => atualizarCampo("cpf", aplicarMascaraCpf(event.target.value))}
            onBlur={async () => {
              if (!cpfEstaCompleto(form.cpf)) {
                return;
              }
              try {
                await apiRequest(`/validacoes/cpf/${somenteNumeros(form.cpf)}`, { auth: false });
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "CPF inválido.");
              }
            }}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
            required
          />
          <FormField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => atualizarCampo("email", event.target.value)}
            placeholder="maria@exemplo.com"
            required
            disabled={isGoogleFlow}
            className="sm:col-span-2"
          />
          <FormField
            label="Telefone"
            value={form.phone}
            onChange={(event) => atualizarCampo("phone", aplicarMascaraTelefone(event.target.value))}
            placeholder="(11) 99999-9999"
            inputMode="tel"
            maxLength={15}
            required
            className="sm:col-span-2"
          />
          {!isGoogleFlow ? (
            <FormField
              label="Senha"
              type="password"
              value={form.password}
              onChange={(event) => atualizarCampo("password", event.target.value)}
              placeholder="********"
              required
              minLength={6}
              className="sm:col-span-2"
            />
          ) : null}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-app-baunilha-dourada pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-app-cinza">
            Ja possui uma conta?{" "}
            <Link
              href="/login"
              className="font-bold text-app-caramelo-torrado transition hover:text-app-cafe-profundo"
            >
              Entrar
            </Link>
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-app-dourado-mel px-6 text-xs font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5 hover:bg-app-caramelo-torrado hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-app-dourado-mel/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Criando...
              </>
            ) : (
              "Criar conta"
            )}
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-lg bg-app-creme-suave px-3 py-2 text-sm font-semibold text-app-caramelo-torrado">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
